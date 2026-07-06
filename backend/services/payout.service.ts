import crypto from 'crypto';
import { prisma } from '@backend/lib/prisma';
import { redis } from '@backend/lib/redis';
import {
  NotFoundError, ValidationError, InsufficientBalanceError,
  RateLimitError,
} from '@backend/lib/errors';
import { addPayoutJob } from '@backend/workers/payout-worker';
import { addEmailToQueue } from '@backend/workers/email-worker';

const TWOFA_TTL = 600;
const TWOFA_MAX_ATTEMPTS = 5;
const TWOFA_ATTEMPT_WINDOW = 3600;
const TWOFA_RESEND_COOLDOWN = 60;

function generate2faCode(): string {
  const buf = crypto.randomBytes(4);
  const num = buf.readUInt32BE(0) % 900000;
  return String(100000 + num);
}

async function check2faRateLimit(userId: string): Promise<void> {
  const attemptKey = `payout_2fa_attempts:${userId}`;
  const attempts = await redis.get(attemptKey);
  if (attempts && parseInt(attempts, 10) >= TWOFA_MAX_ATTEMPTS) {
    const ttl = await redis.ttl(attemptKey);
    throw new RateLimitError(ttl > 0 ? ttl : TWOFA_ATTEMPT_WINDOW);
  }
}

async function increment2faAttempt(userId: string): Promise<void> {
  const key = `payout_2fa_attempts:${userId}`;
  const current = await redis.get(key);
  if (!current) {
    await redis.setex(key, TWOFA_ATTEMPT_WINDOW, '1');
  } else {
    await redis.incr(key);
  }
}

async function check2faResendCooldown(userId: string): Promise<void> {
  const key = `payout_2fa_resend:${userId}`;
  const lastSent = await redis.get(key);
  if (lastSent) {
    const remaining = await redis.ttl(key);
    throw new ValidationError(`Please wait ${remaining} seconds before requesting a new code`);
  }
}

export async function request2fa(userId: string, trainerId?: string) {
  let trainerIdToUse = trainerId;

  if (!trainerIdToUse) {
    const trainer = await prisma.trainer.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!trainer) throw new NotFoundError('Trainer');
    trainerIdToUse = trainer.id;
  }

  const trainer = await prisma.trainer.findUnique({
    where: { id: trainerIdToUse },
    include: { user: true },
  });
  if (!trainer) throw new NotFoundError('Trainer');

  const code = generate2faCode();
  const codeKey = `2fa:payout:${userId}`;
  await redis.setex(codeKey, TWOFA_TTL, code);

  await check2faResendCooldown(userId);
  await redis.setex(`payout_2fa_resend:${userId}`, TWOFA_RESEND_COOLDOWN, '1');

  await addEmailToQueue({
    to: trainer.user.email,
    subject: 'Your Withdrawal Verification Code',
    html: `<p>Your withdrawal verification code is: <strong>${code}</strong></p>
<p>This code expires in ${TWOFA_TTL / 60} minutes.</p>
<p>If you did not request this withdrawal, please contact support immediately.</p>
<p><em>Never share this code with anyone.</em></p>`,
  });

  return { message: 'Verification code sent to your email' };
}

export async function requestPayout(input: {
  userId: string;
  amount: number;
  phone: string;
  code: string;
}) {
  await check2faRateLimit(input.userId);

  const codeKey = `2fa:payout:${input.userId}`;
  const storedCode = await redis.get(codeKey);
  if (!storedCode || storedCode !== input.code.trim()) {
    await increment2faAttempt(input.userId);
    throw new ValidationError('Invalid or expired verification code');
  }

  await redis.del(codeKey);

  const trainer = await prisma.trainer.findUnique({
    where: { userId: input.userId },
  });
  if (!trainer) throw new NotFoundError('Trainer');

  if (input.amount <= 0) {
    throw new ValidationError('Amount must be greater than 0');
  }

  const idempotencyKey = crypto.randomUUID();

  const payout = await prisma.$transaction(async (tx) => {
    const updated = await tx.trainer.updateMany({
      where: { id: trainer.id, availableBalance: { gte: input.amount } },
      data: { availableBalance: { decrement: input.amount } },
    });

    if (updated.count === 0) {
      throw new InsufficientBalanceError();
    }

    const currentTrainer = await tx.trainer.findUnique({
      where: { id: trainer.id },
      select: { availableBalance: true },
    });

    const payout = await tx.payout.create({
      data: {
        trainerId: trainer.id,
        amountKes: input.amount,
        mpesaPhone: input.phone,
        status: 'PENDING',
        idempotencyKey,
      },
    });

    const balanceBefore = Number(currentTrainer!.availableBalance) + input.amount;

    await tx.transactionLedger.create({
      data: {
        userId: input.userId,
        type: 'TRAINER_PAYOUT',
        direction: 'DEBIT',
        amountKes: input.amount,
        balanceBefore,
        balanceAfter: Number(currentTrainer!.availableBalance),
        referenceType: 'payout',
        referenceId: payout.id,
        description: 'Withdrawal request',
      },
    });

    return payout;
  });

  await redis.del(`payout_2fa_attempts:${input.userId}`);

  await addPayoutJob({
    payoutId: payout.id,
    trainerId: trainer.id,
    amountKes: input.amount,
    phoneNumber: input.phone,
    idempotencyKey,
  });

  return payout;
}

export async function getPayoutHistory(userId: string, page = 1, perPage = 20) {
  const trainer = await prisma.trainer.findUnique({ where: { userId } });
  if (!trainer) throw new NotFoundError('Trainer');

  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where: { trainerId: trainer.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.payout.count({ where: { trainerId: trainer.id } }),
  ]);

  return {
    data: payouts,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };
}

export async function getEarningsSummary(userId: string) {
  const trainer = await prisma.trainer.findUnique({
    where: { userId },
    select: {
      id: true,
      availableBalance: true,
      totalStudents: true,
      averageRating: true,
      totalReviews: true,
    },
  });
  if (!trainer) throw new NotFoundError('Trainer');

  const pendingRelease = await prisma.milestone.aggregate({
    where: {
      enrolment: { trainer: { userId }, status: 'ACTIVE' },
      status: 'TRAINEE_CONFIRMED',
    },
    _sum: { amountKes: true },
  });

  const totalEarnedAgg = await prisma.transactionLedger.aggregate({
    where: {
      userId,
      type: 'TRAINER_PAYOUT',
      direction: 'CREDIT',
    },
    _sum: { amountKes: true },
  });

  return {
    availableBalance: trainer.availableBalance,
    pendingRelease: pendingRelease._sum.amountKes || 0,
    totalEarned: totalEarnedAgg._sum.amountKes || 0,
    totalStudents: trainer.totalStudents,
    averageRating: trainer.averageRating,
    totalReviews: trainer.totalReviews,
  };
}
