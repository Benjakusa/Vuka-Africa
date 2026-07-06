import { prisma } from '@backend/lib/prisma';
import { NotFoundError, ValidationError, ForbiddenError } from '@backend/lib/errors';
import { addMilestoneReleaseJob } from '@backend/workers/milestone-worker';

export async function confirmByTrainer(milestoneId: string, enrolmentId: string, userId: string) {
  const enrolment = await prisma.enrolment.findUnique({
    where: { id: enrolmentId },
    include: { trainer: true },
  });
  if (!enrolment) throw new NotFoundError('Enrolment');
  if (enrolment.trainer.userId !== userId) throw new ForbiddenError('Not your enrolment');
  if (enrolment.status !== 'ACTIVE') throw new ValidationError('Enrolment is not active');

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId, enrolmentId },
  });
  if (!milestone) throw new NotFoundError('Milestone');
  if (milestone.status !== 'PENDING') throw new ValidationError('Milestone is not pending');

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      status: 'TRAINER_CONFIRMED',
      trainerConfirmedAt: new Date(),
    },
  });

  if (updated.status === 'TRAINER_CONFIRMED') {
    const traineeConfirmed = await prisma.milestone.findFirst({
      where: { id: milestoneId, traineeConfirmedAt: { not: null } },
    });

    if (traineeConfirmed) {
      await addMilestoneReleaseJob({
        milestoneId,
        enrolmentId,
        trainerId: enrolment.trainerId,
        amountKes: Number(milestone.amountKes),
      });
    }
  }

  return updated;
}

export async function confirmByTrainee(milestoneId: string, enrolmentId: string, userId: string) {
  const enrolment = await prisma.enrolment.findUnique({
    where: { id: enrolmentId },
    include: { trainer: true },
  });
  if (!enrolment) throw new NotFoundError('Enrolment');
  if (enrolment.traineeId !== userId) throw new ForbiddenError('Not your enrolment');
  if (enrolment.status !== 'ACTIVE') throw new ValidationError('Enrolment is not active');

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId, enrolmentId },
  });
  if (!milestone) throw new NotFoundError('Milestone');
  if (milestone.status !== 'TRAINER_CONFIRMED' && milestone.status !== 'PENDING') {
    throw new ValidationError('Milestone cannot be confirmed');
  }

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      status: 'TRAINEE_CONFIRMED',
      traineeConfirmedAt: new Date(),
    },
  });

  const trainerConfirmed = await prisma.milestone.findFirst({
    where: { id: milestoneId, trainerConfirmedAt: { not: null } },
  });

  if (trainerConfirmed) {
    await addMilestoneReleaseJob({
      milestoneId,
      enrolmentId,
      trainerId: enrolment.trainerId,
      amountKes: Number(milestone.amountKes),
    });
  }

  return updated;
}

export async function releaseMilestone(milestoneId: string, enrolmentId: string, trainerId: string, amountKes: number) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId, enrolmentId },
    select: { id: true, sequence: true },
  });
  if (!milestone) throw new NotFoundError('Milestone');

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.milestone.updateMany({
      where: { id: milestoneId, enrolmentId, status: 'TRAINEE_CONFIRMED' },
      data: { status: 'RELEASED', releasedAt: new Date() },
    });

    if (updated.count === 0) {
      return { skipped: true, reason: 'Status no longer TRAINEE_CONFIRMED' };
    }

    await tx.trainer.update({
      where: { id: trainerId },
      data: { availableBalance: { increment: amountKes } },
    });

    const trainer = await tx.trainer.findUnique({
      where: { id: trainerId },
      select: { availableBalance: true, userId: true },
    });

    await tx.transactionLedger.create({
      data: {
        userId: trainer!.userId,
        type: 'TRAINER_PAYOUT',
        direction: 'CREDIT',
        amountKes,
        balanceBefore: Number(trainer!.availableBalance) - amountKes,
        balanceAfter: Number(trainer!.availableBalance),
        referenceType: 'milestone',
        referenceId: milestoneId,
        description: `Milestone ${milestone.sequence} released`,
      },
    });

    await tx.enrolment.update({
      where: { id: enrolmentId },
      data: { currentMilestone: { increment: 1 } },
    });

    const enrolment = await tx.enrolment.findUnique({
      where: { id: enrolmentId },
      select: { currentMilestone: true, _count: { select: { milestones: true } } },
    });

    if (enrolment && enrolment.currentMilestone >= 3) {
      await tx.enrolment.update({
        where: { id: enrolmentId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    return { skipped: false };
  });

  return result;
}
