import { Queue } from 'bullmq';
import { redis } from '@backend/lib/redis';
import * as milestoneService from '@backend/services/milestone.service';
import { addEmailToQueue } from './email-worker';
import { supabaseDb } from '@backend/lib/db';
import { createManagedWorker, setupGracefulShutdown } from './base';
import { WORKER, MILESTONE } from '@backend/lib/config';

const connection = redis;

export const milestoneQueue = new Queue('milestone-release', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 3600 * 24 * 7 },
    removeOnFail: { age: 3600 * 24 * 30 },
  },
});

export async function addMilestoneReleaseJob(data: {
  milestoneId: string;
  enrolmentId: string;
  trainerId: string;
  amountKes: number;
}) {
  await milestoneQueue.add('release-milestone', data, {
    delay: MILESTONE.RELEASE_DELAY_MS,
    jobId: `milestone:${data.milestoneId}`,
  });
}

export async function processDelayedRelease(milestoneId: string) {
  const milestone = await supabaseDb.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      enrolment: {
        include: {
          course: { select: { title: true } },
          trainee: { select: { email: true, fullName: true } },
          trainer: { include: { user: { select: { email: true, fullName: true } } } },
        },
      },
    },
  });

  if (!milestone) {
    console.warn(`[Milestone Worker] Milestone ${milestoneId} not found`);
    return { skipped: true, reason: 'not found' };
  }

  const { enrolment } = milestone;
  if (!enrolment) return { skipped: true, reason: 'enrolment not found' };

  const result = await milestoneService.releaseMilestone(
    milestoneId,
    enrolment.id,
    enrolment.trainerId,
    Number(milestone.amountKes),
  );

  if (!result.skipped) {
    await addEmailToQueue({
      to: enrolment.trainer.user.email,
      subject: `Milestone Released — ${enrolment.course.title}`,
      html: `<p>KES ${Number(milestone.amountKes).toLocaleString()} has been added to your balance for ${enrolment.course.title}.</p>`,
    });

    await addEmailToQueue({
      to: enrolment.trainee.email,
      subject: `Session Confirmed — ${enrolment.course.title}`,
      html: `<p>Your session for ${enrolment.course.title} has been confirmed and the trainer has been paid.</p>`,
    });

    if (enrolment.status === 'COMPLETED') {
      await addEmailToQueue({
        to: enrolment.trainee.email,
        subject: `Course Completed — ${enrolment.course.title}`,
        html: `<p>Congratulations! You've completed ${enrolment.course.title}. Leave a review for your trainer.</p>`,
      });
    }
  }

  return result;
}

const worker = createManagedWorker({
  name: 'milestone-release',
  connection,
  concurrency: WORKER.MILESTONE_CONCURRENCY,
  processor: async (job) => {
    const { milestoneId } = job.data;
    await processDelayedRelease(milestoneId);
  },
});

setupGracefulShutdown(worker, 'Milestone Worker');
