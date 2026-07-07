import { Queue, Worker, Job } from 'bullmq';
import { redis } from '@backend/lib/redis';
import { sendEmail } from '@backend/lib/email';
import { supabaseDb } from '@backend/lib/db';

const connection = redis;

export const emailQueue = new Queue('emails', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 60000 },
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 24 * 7 },
  },
});

interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  notificationId?: string;
  userId?: string;
}

export async function addEmailToQueue(data: EmailJobData) {
  let notificationId: string | undefined;

  if (data.userId) {
    const notification = await supabaseDb.notification.create({
      data: {
        userId: data.userId,
        subject: data.subject,
        body: data.html,
        status: 'QUEUED',
      },
    });
    notificationId = notification.id;
  }

  await emailQueue.add('send-email', {
    ...data,
    notificationId,
  });
}

const worker = new Worker(
  'emails',
  async (job: Job) => {
    const { to, subject, html, notificationId } = job.data;

    try {
      const info = await sendEmail(to, subject, html);

      if (notificationId) {
        await supabaseDb.notification.update({
          where: { id: notificationId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            meta: { messageId: info.messageId },
          },
        });
      }
    } catch (error: any) {
      if (notificationId) {
        await supabaseDb.notification.update({
          where: { id: notificationId },
          data: {
            status: 'FAILED',
            meta: { error: error.message },
          },
        });
      }
      throw error;
    }
  },
  { connection },
);

worker.on('completed', (job) => {
  console.log(`Email job ${job.id} sent to ${job.data.to}`);
});

worker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err);
});

console.log('Email worker started');
