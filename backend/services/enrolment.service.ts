import { supabaseDb } from '@backend/lib/db';
import { mpesaClient } from '@backend/lib/mpesa';
import { ConflictError, NotFoundError, ValidationError } from '@backend/lib/errors';
import { checkAndMarkIdempotent } from '@backend/lib/idempotency';
import { CACHE } from '@backend/lib/config';

interface CreateEnrolmentInput {
  traineeId: string;
  courseId: string;
}

export async function createEnrolment(input: CreateEnrolmentInput) {
  const course = await supabaseDb.course.findUnique({
    where: { id: input.courseId, deletedAt: null },
    include: { trainer: true, _count: { select: { enrolments: true } } },
  });

  if (!course) throw new NotFoundError('Course');
  if (!course.isPublished) throw new ValidationError('Course is not published');
  if (course.trainer.userId === input.traineeId) {
    throw new ValidationError('Cannot enrol in your own course');
  }
  if (course.maxStudents && course._count.enrolments >= course.maxStudents) {
    throw new ValidationError('Course is full');
  }

  const existing = await supabaseDb.enrolment.findFirst({
    where: {
      traineeId: input.traineeId,
      courseId: input.courseId,
      status: { in: ['PENDING_PAYMENT', 'ACTIVE'] },
    },
  });
  if (existing) throw new ConflictError('Already enrolled in this course');

  const user = await supabaseDb.user.findUnique({ where: { id: input.traineeId } });
  if (!user) throw new NotFoundError('User');

  const idempotent = await checkAndMarkIdempotent(
    'enrolment',
    `${input.courseId}:${input.traineeId}`,
    CACHE.IDEMPOTENCY_TTL,
  );
  if (idempotent) {
    throw new ConflictError('Duplicate enrolment request. Please wait for M-Pesa prompt.');
  }

  const pricePaidKes = Number(course.priceKes);
  const commissionKes = (pricePaidKes * Number(course.trainer.commissionRate)) / 100;
  const trainerPayoutKes = pricePaidKes - commissionKes;

  let enrolment;

  try {
    enrolment = await supabaseDb.enrolment.create({
      data: {
        courseId: input.courseId,
        traineeId: input.traineeId,
        trainerId: course.trainer.id,
        status: 'PENDING_PAYMENT',
        pricePaidKes,
        commissionKes,
        trainerPayoutKes,
      },
    });

    const response = await mpesaClient.stkPush({
      phone: user.phone,
      amount: pricePaidKes,
      accountReference: `ENROL-${enrolment.id}`,
      transactionDesc: `Vuka Course Enrolment`,
    });

    await supabaseDb.enrolment.update({
      where: { id: enrolment.id },
      data: { mpesaCheckoutRequestId: response.CheckoutRequestID },
    });

    return {
      enrolmentId: enrolment.id,
      checkoutRequestID: response.CheckoutRequestID,
    };
  } catch (error: any) {
    if (enrolment) {
      await supabaseDb.enrolment.delete({ where: { id: enrolment.id } }).catch(() => {});
    }
    throw error;
  }
}

export async function getEnrolmentStatus(enrolmentId: string, userId: string) {
  const enrolment = await supabaseDb.enrolment.findUnique({
    where: { id: enrolmentId },
    select: {
      id: true,
      status: true,
      mpesaCheckoutRequestId: true,
      mpesaTransactionId: true,
      pricePaidKes: true,
      startedAt: true,
      createdAt: true,
      traineeId: true,
    },
  });

  if (!enrolment) throw new NotFoundError('Enrolment');
  if (enrolment.traineeId !== userId) throw new NotFoundError('Enrolment');

  return enrolment;
}

export async function getEnrolmentDetail(enrolmentId: string, userId: string) {
  const enrolment = await supabaseDb.enrolment.findUnique({
    where: { id: enrolmentId },
    include: {
      course: {
        include: {
          trainer: {
            include: {
              user: { select: { fullName: true, avatarUrl: true } },
            },
          },
        },
      },
      trainee: {
        select: { id: true, fullName: true, avatarUrl: true, email: true, phone: true },
      },
      milestones: { orderBy: { sequence: 'asc' } },
      reviews: true,
      sessionLogs: { orderBy: { sessionDate: 'desc' } },
    },
  });

  if (!enrolment) throw new NotFoundError('Enrolment');

  if (enrolment.traineeId !== userId && enrolment.trainer.userId !== userId) {
    const admin = await supabaseDb.user.findUnique({ where: { id: userId } });
    if (!admin || admin.role !== 'ADMIN') {
      throw new ValidationError('Not authorized to view this enrolment');
    }
  }

  return enrolment;
}

export async function listUserEnrolments(
  userId: string,
  role: 'TRAINEE' | 'TRAINER',
  status?: string,
  page = 1,
  perPage = 20,
) {
  const where: any = {};
  if (role === 'TRAINEE') where.traineeId = userId;
  else where.trainer = { userId };

  if (status) where.status = status;

  const [enrolments, total] = await Promise.all([
    supabaseDb.enrolment.findMany({
      where,
      include: {
        course: { select: { title: true, slug: true, imageUrl: true, mode: true } },
        trainee: { select: { id: true, fullName: true, avatarUrl: true } },
        milestones: {
          select: { status: true, sequence: true },
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    supabaseDb.enrolment.count({ where }),
  ]);

  return {
    data: enrolments,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };
}
