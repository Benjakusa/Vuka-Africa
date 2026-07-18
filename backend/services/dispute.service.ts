import { supabaseDb } from '@backend/lib/db';
import { NotFoundError, ValidationError, ForbiddenError } from '@backend/lib/errors';
import { addEmailToQueue } from '@backend/workers/email-worker';

interface RaiseDisputeInput {
  enrolmentId: string;
  userId: string;
  reason: string;
  milestoneId?: string;
}

export async function raiseDispute(input: RaiseDisputeInput) {
  const enrolment = await supabaseDb.enrolment.findUnique({
    where: { id: input.enrolmentId },
    include: {
      course: { include: { trainer: { include: { user: true } } } },
      trainee: true,
    },
  });
  if (!enrolment) throw new NotFoundError('Enrolment');

  const isParticipant = enrolment.traineeId === input.userId || enrolment.course.trainer.userId === input.userId;
  if (!isParticipant) throw new ForbiddenError('Not a participant in this enrolment');
  if (enrolment.status !== 'ACTIVE') throw new ValidationError('Can only dispute active enrolments');

  if (input.milestoneId) {
    const milestone = await supabaseDb.milestone.findUnique({
      where: { id: input.milestoneId, enrolmentId: input.enrolmentId },
    });
    if (!milestone) throw new NotFoundError('Milestone');
    if (milestone.status === 'RELEASED') throw new ValidationError('Cannot dispute released milestone');
  }

  const dispute = await supabaseDb.dispute.create({
    data: {
      enrolmentId: input.enrolmentId,
      milestoneId: input.milestoneId,
      raisedById: input.userId,
      reason: input.reason,
      status: 'OPEN',
    },
  });

  if (input.milestoneId) {
    await supabaseDb.milestone.update({
      where: { id: input.milestoneId },
      data: { status: 'DISPUTED', disputeId: dispute.id },
    });
  }

  const admin = await supabaseDb.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin) {
    await addEmailToQueue({
      to: admin.email,
      subject: `New Dispute #${dispute.id.slice(0, 8)}`,
      html: `<p>A new dispute has been raised on enrolment ${input.enrolmentId}.</p><p>Reason: ${input.reason}</p>`,
    });
  }

  return dispute;
}

export async function getDisputesForEnrolment(enrolmentId: string, userId: string) {
  const enrolment = await supabaseDb.enrolment.findUnique({
    where: { id: enrolmentId },
    include: { course: { include: { trainer: true } } },
  });
  if (!enrolment) throw new NotFoundError('Enrolment');

  const isParticipant = enrolment.traineeId === userId || enrolment.course.trainer.userId === userId;
  if (!isParticipant) {
    const user = await supabaseDb.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') throw new ForbiddenError();
  }

  return supabaseDb.dispute.findMany({
    where: { enrolmentId },
    include: {
      raisedBy: { select: { id: true, fullName: true } },
      resolvedBy: { select: { id: true, fullName: true } },
      milestone: { select: { sequence: true, label: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
