import { supabaseDb } from '@backend/lib/db';
import { NotFoundError, ValidationError } from '@backend/lib/errors';
import { addEmailToQueue } from '@backend/workers/email-worker';

export async function getStats() {
  const [
    totalUsers,
    totalTrainers,
    totalCourses,
    totalEnrolments,
    activeEnrolments,
    pendingVerifications,
    openDisputes,
    revenue,
  ] = await Promise.all([
    supabaseDb.user.count(),
    supabaseDb.trainer.count(),
    supabaseDb.course.count({ where: { deletedAt: null } }),
    supabaseDb.enrolment.count(),
    supabaseDb.enrolment.count({ where: { status: 'ACTIVE' } }),
    supabaseDb.trainer.count({ where: { verificationStatus: 'PENDING' } }),
    supabaseDb.dispute.count({ where: { status: 'OPEN' } }),
    supabaseDb.transactionLedger.aggregate({
      where: { type: 'COMMISSION' },
      _sum: { amountKes: true },
    }),
  ]);

  return {
    totalUsers,
    totalTrainers,
    totalCourses,
    totalEnrolments,
    activeEnrolments,
    pendingVerifications,
    openDisputes,
    totalRevenue: revenue._sum.amountKes || 0,
  };
}

export async function listVerifications(status?: string, page = 1, perPage = 20) {
  const where: any = {};
  if (status) where.verificationStatus = status;

  const [trainers, total] = await Promise.all([
    supabaseDb.trainer.findMany({
      where,
      include: {
        user: {
          select: { fullName: true, email: true, phone: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    supabaseDb.trainer.count({ where }),
  ]);

  return {
    data: trainers,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };
}

export async function approveVerification(trainerId: string, adminId: string) {
  const trainer = await supabaseDb.trainer.findUnique({
    where: { id: trainerId },
    include: { user: true },
  });
  if (!trainer) throw new NotFoundError('Trainer');
  if (trainer.verificationStatus !== 'PENDING' && trainer.verificationStatus !== 'UNSUBMITTED') {
    throw new ValidationError('Trainer is not pending verification');
  }

  await supabaseDb.trainer.update({
    where: { id: trainerId },
    data: {
      isVerified: true,
      verificationStatus: 'APPROVED',
    },
  });

  await addEmailToQueue({
    to: trainer.user.email,
    subject: 'Verification Approved!',
    html: '<p>Congratulations! Your trainer profile has been verified. Your students will now see the verified badge on your profile.</p>',
  });
}

export async function rejectVerification(trainerId: string, adminId: string, reason: string) {
  const trainer = await supabaseDb.trainer.findUnique({
    where: { id: trainerId },
    include: { user: true },
  });
  if (!trainer) throw new NotFoundError('Trainer');

  await supabaseDb.trainer.update({
    where: { id: trainerId },
    data: {
      verificationStatus: 'REJECTED',
      isVerified: false,
    },
  });

  await addEmailToQueue({
    to: trainer.user.email,
    subject: 'Verification Update',
    html: `<p>Your verification request was not approved.</p><p>Reason: ${reason}</p><p>You can re-submit your documents after addressing the concerns above.</p>`,
  });
}

export async function listDisputes(status?: string, page = 1, perPage = 20) {
  const where: any = {};
  if (status) where.status = status;

  const [disputes, total] = await Promise.all([
    supabaseDb.dispute.findMany({
      where,
      include: {
        raisedBy: { select: { fullName: true, email: true } },
        enrolment: {
          include: {
            course: { select: { title: true } },
          },
        },
        milestone: { select: { sequence: true, label: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    supabaseDb.dispute.count({ where }),
  ]);

  return {
    data: disputes,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };
}

export async function resolveDispute(disputeId: string, adminId: string, resolution: string, notes?: string) {
  const dispute = await supabaseDb.dispute.findUnique({
    where: { id: disputeId },
    include: {
      enrolment: {
        include: {
          course: { include: { trainer: { include: { user: true } } } },
          trainee: true,
        },
      },
      milestone: true,
    },
  });
  if (!dispute) throw new NotFoundError('Dispute');

  let resolvedStatus: string;
  switch (resolution) {
    case 'release_to_trainer':
      resolvedStatus = 'RESOLVED_TRAINER';
      break;
    case 'refund_to_trainee':
      resolvedStatus = 'RESOLVED_TRAINEE';
      break;
    case 'split_50':
      resolvedStatus = 'RESOLVED_SPLIT';
      break;
    default:
      throw new ValidationError('Invalid resolution type');
  }

  await supabaseDb.dispute.update({
    where: { id: disputeId },
    data: {
      status: resolvedStatus as any,
      resolutionNotes: notes,
      resolvedById: adminId,
    },
  });

  if (resolution === 'refund_to_trainee' && dispute.milestone) {
    await supabaseDb.milestone.update({
      where: { id: dispute.milestone.id },
      data: { status: 'PENDING' },
    });
  } else if (resolution === 'release_to_trainer' && dispute.milestone) {
    await supabaseDb.milestone.update({
      where: { id: dispute.milestone.id },
      data: { status: 'TRAINEE_CONFIRMED' },
    });
    const { addMilestoneReleaseJob } = await import('@backend/workers/milestone-worker');
    await addMilestoneReleaseJob({
      milestoneId: dispute.milestone.id,
      enrolmentId: dispute.enrolmentId,
      trainerId: dispute.enrolment.course.trainerId,
      amountKes: Number(dispute.milestone.amountKes),
    });
  }

  await addEmailToQueue({
    to: dispute.enrolment.trainee.email,
    subject: `Dispute Resolved — ${dispute.enrolment.course.title}`,
    html: `<p>Your dispute has been resolved. Resolution: ${resolution}. ${notes ? 'Notes: ' + notes : ''}</p>`,
  });

  await addEmailToQueue({
    to: dispute.enrolment.course.trainer.user.email,
    subject: `Dispute Resolved — ${dispute.enrolment.course.title}`,
    html: `<p>A dispute on your enrolment has been resolved. Resolution: ${resolution}. ${notes ? 'Notes: ' + notes : ''}</p>`,
  });
}

export async function listTransactions(filters: {
  type?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}) {
  const page = filters.page || 1;
  const perPage = filters.perPage || 50;
  const where: any = {};

  if (filters.type) where.type = filters.type;
  if (filters.userId) where.userId = filters.userId;
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(filters.from);
    if (filters.to) where.createdAt.lte = new Date(filters.to);
  }

  const [transactions, total] = await Promise.all([
    supabaseDb.transactionLedger.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    supabaseDb.transactionLedger.count({ where }),
  ]);

  return {
    data: transactions,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };
}

export async function listUsers(search?: string, role?: string, isActive?: string, page = 1, perPage = 20) {
  const where: any = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [users, total] = await Promise.all([
    supabaseDb.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        trainer: { select: { isVerified: true, verificationStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    supabaseDb.user.count({ where }),
  ]);

  return {
    data: users,
    meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  };
}

export async function suspendUser(targetUserId: string) {
  const user = await supabaseDb.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new NotFoundError('User');
  if (user.role === 'ADMIN') throw new ValidationError('Cannot suspend admin');

  await supabaseDb.user.update({
    where: { id: targetUserId },
    data: { isActive: false },
  });

  await supabaseDb.enrolment.updateMany({
    where: {
      OR: [{ traineeId: targetUserId }, { trainer: { userId: targetUserId } }],
      status: { in: ['PENDING_PAYMENT', 'ACTIVE'] },
    },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
}

export async function activateUser(targetUserId: string) {
  const user = await supabaseDb.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new NotFoundError('User');

  await supabaseDb.user.update({
    where: { id: targetUserId },
    data: { isActive: true },
  });
}
