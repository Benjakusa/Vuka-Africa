import { supabaseDb } from '@backend/lib/db';
import { mpesaClient } from '@backend/lib/mpesa';
import { setCached, getCached, invalidateCache } from '@backend/lib/cache';
import { ConflictError, NotFoundError, ValidationError } from '@backend/lib/errors';
import { addEmailToQueue } from '@backend/workers/email-worker';
import { COMMISSION, FEES, CACHE } from '@backend/lib/config';

interface ApplyInput {
  userId: string;
  bio?: string;
  skills: string[];
  idDocumentUrl?: string;
}

export async function apply(input: ApplyInput) {
  const existing = await supabaseDb.trainer.findUnique({ where: { userId: input.userId } });
  if (existing) {
    throw new ConflictError('User already has a trainer profile');
  }

  const user = await supabaseDb.user.findUnique({ where: { id: input.userId } });
  if (!user) throw new NotFoundError('User');
  if (user.role !== 'TRAINEE') {
    throw new ConflictError('User is already a trainer or admin');
  }

  const result = await supabaseDb.$transaction(
    async (tx) => {
      const config = await tx.platformConfig.findUnique({ where: { id: 1 } });
      if (!config) throw new Error('Platform configuration missing');

      const isFoundingTrainer = config.trainerCount < COMMISSION.FREE_TRAINER_LIMIT;

      const trainer = await tx.trainer.create({
        data: {
          userId: input.userId,
          bio: input.bio,
          skills: input.skills,
          idDocumentUrl: input.idDocumentUrl,
          ...(isFoundingTrainer
            ? {
                isVerified: true,
                verificationStatus: 'APPROVED' as const,
                verificationFeePaid: false,
                commissionRate: 0.0,
              }
            : {
                isVerified: false,
                verificationStatus: 'UNSUBMITTED' as const,
                commissionRate: COMMISSION.DEFAULT,
              }),
        },
      });

      if (isFoundingTrainer) {
        await tx.platformConfig.update({
          where: { id: 1 },
          data: { trainerCount: { increment: 1 } },
        });
      }

      await tx.user.update({
        where: { id: input.userId },
        data: { role: 'TRAINER' },
      });

      return { trainer, isFoundingTrainer };
    },
    {
      isolationLevel: 'Serializable',
    },
  );

  await invalidateCache('trainers:list:*');

  await addEmailToQueue({
    to: user.email,
    subject: result.isFoundingTrainer
      ? 'Welcome Founding Trainer — 0% Commission for Life!'
      : 'Welcome to Vuka Afrique — Complete Your Profile',
    html: result.isFoundingTrainer
      ? `<h1>Congratulations ${user.fullName}!</h1><p>You are one of the first 100 trainers on Vuka Afrique. You get <strong>0% commission forever</strong> and your <strong>verification badge is free for life</strong>.</p>`
      : `<h1>Welcome ${user.fullName}!</h1><p>Complete your profile and get verified to start attracting students.</p>`,
  });

  return result.trainer;
}

export async function getPublicProfile(trainerId: string) {
  const cacheKey = `trainer:${trainerId}:profile`;
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const trainer = await supabaseDb.trainer.findUnique({
    where: { id: trainerId },
    include: {
      user: {
        select: {
          fullName: true,
          avatarUrl: true,
        },
      },
      courses: {
        where: { isPublished: true, deletedAt: null },
        select: {
          id: true,
          title: true,
          slug: true,
          mode: true,
          duration: true,
          sessionCount: true,
          priceKes: true,
          imageUrl: true,
          category: true,
        },
      },
    },
  });

  if (!trainer) throw new NotFoundError('Trainer');

  const result = {
    id: trainer.id,
    fullName: trainer.user.fullName,
    avatarUrl: trainer.user.avatarUrl,
    bio: trainer.bio,
    skills: trainer.skills,
    isVerified: trainer.isVerified,
    averageRating: trainer.averageRating,
    totalReviews: trainer.totalReviews,
    totalStudents: trainer.totalStudents,
    courses: trainer.courses,
  };

  await setCached(cacheKey, result, CACHE.TRAINER_PROFILE_TTL);
  return result;
}

export async function updateProfile(userId: string, data: { bio?: string; skills?: string[]; idDocumentUrl?: string }) {
  const trainer = await supabaseDb.trainer.findUnique({ where: { userId } });
  if (!trainer) throw new NotFoundError('Trainer');

  const updated = await supabaseDb.trainer.update({
    where: { userId },
    data,
  });

  await invalidateCache(`trainer:${trainer.id}:profile`);
  await invalidateCache('trainers:list:*');

  return updated;
}

export async function initiateVerificationPayment(userId: string) {
  const trainer = await supabaseDb.trainer.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!trainer) throw new NotFoundError('Trainer');
  if (trainer.isVerified) throw new ValidationError('Already verified');
  if (trainer.verificationStatus === 'PENDING') throw new ValidationError('Verification already pending');
  if (trainer.verificationFeePaid) throw new ValidationError('Verification fee already paid');

  const response = await mpesaClient.stkPush({
    phone: trainer.user.phone,
    amount: FEES.VERIFICATION,
    accountReference: `VERIFY-${trainer.id}`,
    transactionDesc: 'Vuka Afrique Trainer Verification Fee',
  });

  return {
    checkoutRequestID: response.CheckoutRequestID,
    amount: FEES.VERIFICATION,
  };
}

export async function getVerificationStatus(userId: string) {
  const trainer = await supabaseDb.trainer.findUnique({
    where: { userId },
    select: {
      isVerified: true,
      verificationStatus: true,
      verificationFeePaid: true,
    },
  });
  if (!trainer) throw new NotFoundError('Trainer');
  return trainer;
}

export async function processVerificationCallback(trainerId: string, mpesaTransactionId: string) {
  await supabaseDb.trainer.update({
    where: { id: trainerId },
    data: {
      verificationFeePaid: true,
    },
  });

  await supabaseDb.transactionLedger.create({
    data: {
      userId: (await supabaseDb.trainer.findUnique({ where: { id: trainerId }, select: { userId: true } }))!.userId,
      type: 'VERIFICATION_FEE',
      direction: 'DEBIT',
      amountKes: FEES.VERIFICATION,
      balanceBefore: 0,
      balanceAfter: 0,
      referenceType: 'verification',
      referenceId: trainerId,
      mpesaTransactionId,
      description: 'Verification fee payment',
    },
  });

  const trainer = await supabaseDb.trainer.findUnique({
    where: { id: trainerId },
    include: { user: true },
  });

  if (trainer) {
    await addEmailToQueue({
      to: trainer.user.email,
      subject: 'Verification Fee Received — Under Review',
      html: `<p>Your KES ${FEES.VERIFICATION.toLocaleString()} verification fee has been received. Our team will review your documents within 2 business days.</p>`,
    });
  }
}

interface TrainerListFilters {
  search?: string;
  category?: string;
  mode?: string;
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  sortBy?: string;
  page: number;
  perPage: number;
}

export async function listTrainers(filters: TrainerListFilters) {
  const cacheKey = `trainers:list:${JSON.stringify(filters)}`;
  const cached = await getCached<any>(cacheKey);
  if (cached) return cached;

  const where: any = {};

  if (filters.verifiedOnly) {
    where.isVerified = true;
  }

  if (filters.search) {
    where.user = {
      fullName: { contains: filters.search, mode: 'insensitive' },
    };
  }

  if (filters.category || filters.mode) {
    where.courses = {
      some: {
        isPublished: true,
        deletedAt: null,
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.mode ? { mode: filters.mode as any } : {}),
      },
    };
  }

  if (filters.minPrice || filters.maxPrice) {
    where.courses = {
      ...where.courses,
      some: {
        ...(where.courses?.some || {}),
        ...(filters.minPrice ? { priceKes: { gte: filters.minPrice } } : {}),
        ...(filters.maxPrice ? { priceKes: { lte: filters.maxPrice } } : {}),
      },
    };
  }

  let orderBy: any = { averageRating: 'desc' };
  switch (filters.sortBy) {
    case 'rating':
      orderBy = { averageRating: 'desc' };
      break;
    case 'price_asc':
      orderBy = { courses: { _count: 'asc' } };
      break;
    case 'price_desc':
      orderBy = { courses: { _count: 'desc' } };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
  }

  const [trainers, total] = await Promise.all([
    supabaseDb.trainer.findMany({
      where,
      include: {
        user: {
          select: { fullName: true, avatarUrl: true },
        },
        courses: {
          where: { isPublished: true, deletedAt: null },
          select: { priceKes: true },
          orderBy: { priceKes: 'asc' as const },
          take: 1,
        },
      },
      orderBy,
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage,
    }),
    supabaseDb.trainer.count({ where }),
  ]);

  const result = {
    data: trainers.map((t) => ({
      id: t.id,
      fullName: t.user.fullName,
      avatarUrl: t.user.avatarUrl,
      skills: t.skills,
      isVerified: t.isVerified,
      averageRating: t.averageRating,
      totalReviews: t.totalReviews,
      totalStudents: t.totalStudents,
      startingPrice: t.courses[0]?.priceKes || null,
    })),
    meta: {
      page: filters.page,
      perPage: filters.perPage,
      total,
      totalPages: Math.ceil(total / filters.perPage),
    },
  };

  await setCached(cacheKey, result, CACHE.TRAINER_LIST_TTL);
  return result;
}
