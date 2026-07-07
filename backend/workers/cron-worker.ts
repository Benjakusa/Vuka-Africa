import { Queue, Worker, Job } from 'bullmq';
import { redis } from '@backend/lib/redis';
import { supabaseDb } from '@backend/lib/db';
import { addEmailToQueue } from './email-worker';

const connection = redis;

export const cronQueue = new Queue('cron-jobs', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { age: 3600 * 24 },
    removeOnFail: { age: 3600 * 24 * 7 },
  },
});

async function runMpesaReconciliation() {
  console.log('[Reconciliation] Starting M-Pesa reconciliation...');

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const payments = await supabaseDb.transactionLedger.findMany({
    where: {
      createdAt: { gte: twentyFourHoursAgo },
      mpesaTransactionId: { not: null },
    },
    include: { user: { select: { email: true, fullName: true } } },
  });

  const internalTransactions = await supabaseDb.transactionLedger.findMany({
    where: {
      createdAt: { gte: twentyFourHoursAgo },
    },
  });

  const orphaned = await supabaseDb.enrolment.findMany({
    where: {
      status: 'PENDING_PAYMENT',
      createdAt: { lt: twentyFourHoursAgo },
    },
    include: { trainee: true, course: { select: { title: true } } },
  });

  for (const enrolment of orphaned) {
    await supabaseDb.enrolment.update({
      where: { id: enrolment.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });

    await addEmailToQueue({
      to: enrolment.trainee.email,
      subject: 'Enrolment Cancelled — Payment Not Completed',
      html: `<p>Hi ${enrolment.trainee.fullName},</p>
<p>Your enrolment for <strong>${enrolment.course.title}</strong> has been cancelled because the payment was not completed within 24 hours.</p>
<p>You can re-enrol from the course page if you still wish to join.</p>`,
    });
  }

  if (orphaned.length > 0) {
    console.log(`[Reconciliation] Cancelled ${orphaned.length} stale pending enrolments`);
  }

  const pendingPayouts = await supabaseDb.payout.findMany({
    where: {
      status: { in: ['PENDING', 'PROCESSING'] },
      createdAt: { lt: twentyFourHoursAgo },
    },
    include: { trainer: { include: { user: true } } },
  });

  if (pendingPayouts.length > 0) {
    console.log(`[Reconciliation] Found ${pendingPayouts.length} stuck payouts`);

    for (const payout of pendingPayouts) {
      await supabaseDb.payout.update({
        where: { id: payout.id },
        data: {
          status: 'FAILED',
          failureReason: 'Auto-cancelled by reconciliation — no callback received within 24 hours',
        },
      });

      await supabaseDb.$transaction(async (tx) => {
        const trainer = await tx.trainer.findUnique({ where: { id: payout.trainerId } });
        if (!trainer) return;

        await tx.trainer.update({
          where: { id: payout.trainerId },
          data: { availableBalance: { increment: Number(payout.amountKes) } },
        });

        await tx.transactionLedger.create({
          data: {
            userId: payout.trainer.userId,
            type: 'REFUND',
            direction: 'CREDIT',
            amountKes: Number(payout.amountKes),
            balanceBefore: Number(trainer.availableBalance),
            balanceAfter: Number(trainer.availableBalance) + Number(payout.amountKes),
            referenceType: 'payout',
            referenceId: payout.id,
            description: 'Auto-refund for stuck payout',
          },
        });
      });

      await addEmailToQueue({
        to: payout.trainer.user.email,
        subject: 'Payout Cancelled — No Callback Received',
        html: `<p>Hi ${payout.trainer.user.fullName},</p>
<p>Your withdrawal of KES ${Number(payout.amountKes).toLocaleString()} was cancelled because we did not receive a confirmation from M-Pesa within 24 hours.</p>
<p>The funds have been returned to your Vuka wallet. Please try again.</p>`,
      });
    }
  }

  let discrepancyCount = 0;
  for (const txn of internalTransactions) {
    if (txn.type === 'TRAINEE_PAYMENT' && txn.amountKes > 0 && !txn.mpesaTransactionId) {
      discrepancyCount++;
      console.warn(`[Reconciliation] Ledger entry ${txn.id} has no M-Pesa transaction ID`);
    }
  }

  if (discrepancyCount > 0 || orphaned.length > 0 || pendingPayouts.length > 0) {
    const admin = await supabaseDb.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      let html = `<h2>Daily Reconciliation Report</h2>`;
      html += `<p>Cancelled stale enrolments: ${orphaned.length}</p>`;
      html += `<p>Stuck payouts auto-refunded: ${pendingPayouts.length}</p>`;
      html += `<p>Ledger entries without M-Pesa IDs: ${discrepancyCount}</p>`;
      html += `<p>Total transactions in last 24h: ${internalTransactions.length}</p>`;

      await addEmailToQueue({
        to: admin.email,
        subject: `M-Pesa Reconciliation Report — ${new Date().toLocaleDateString()}`,
        html,
      });
    }
  }

  console.log('[Reconciliation] Completed');
}

async function runCleanup() {
  console.log('[Cleanup] Running weekly cleanup...');

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const stale = await supabaseDb.enrolment.findMany({
    where: {
      status: 'PENDING_PAYMENT',
      createdAt: { lt: thirtyMinutesAgo },
    },
    include: { trainee: true, course: { include: { trainer: { include: { user: true } } } } },
  });

  for (const enrolment of stale) {
    await supabaseDb.enrolment.update({
      where: { id: enrolment.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const staleConfirmations = await supabaseDb.milestone.findMany({
    where: {
      status: 'TRAINER_CONFIRMED',
      trainerConfirmedAt: { lt: threeDaysAgo },
    },
    include: { enrolment: { include: { course: true } } },
  });

  if (staleConfirmations.length > 0) {
    const admin = await supabaseDb.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      await addEmailToQueue({
        to: admin.email,
        subject: `Escalated Milestones (${staleConfirmations.length})`,
        html: `<p>${staleConfirmations.length} milestones have been waiting for trainee confirmation for over 72 hours and require admin attention.</p>`,
      });
    }
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const staleCheckout = await supabaseDb.enrolment.findMany({
    where: {
      status: 'PENDING_PAYMENT',
      createdAt: { lt: sevenDaysAgo },
    },
  });

  for (const enrolment of staleCheckout) {
    await supabaseDb.enrolment.update({
      where: { id: enrolment.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }
}

export async function scheduleCronJobs() {
  await cronQueue.upsertJobScheduler(
    'mpesa-reconciliation',
    {
      pattern: '0 2 * * *',
      tz: 'Africa/Nairobi',
    },
    {
      name: 'run-mpesa-reconciliation',
      data: {},
    },
  );

  await cronQueue.upsertJobScheduler(
    'cleanup',
    {
      pattern: '0 3 * * 0',
      tz: 'Africa/Nairobi',
    },
    {
      name: 'run-cleanup',
      data: {},
    },
  );

  await cronQueue.upsertJobScheduler(
    'session-reminders',
    {
      pattern: '0 * * * *',
      tz: 'Africa/Nairobi',
    },
    {
      name: 'run-session-reminders',
      data: {},
    },
  );

  console.log('[Cron] Jobs scheduled');
}

async function sendSessionReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const sessions = await supabaseDb.sessionLog.findMany({
    where: {
      sessionDate: {
        gte: tomorrow,
        lt: dayAfter,
      },
    },
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

  for (const session of sessions) {
    await addEmailToQueue({
      to: session.enrolment.trainee.email,
      subject: `Reminder: Session Tomorrow — ${session.enrolment.course.title}`,
      html: `<p>Hi ${session.enrolment.trainee.fullName},</p><p>You have a session tomorrow at ${session.sessionDate.toLocaleTimeString()}.</p>`,
    });

    await addEmailToQueue({
      to: session.enrolment.trainer.user.email,
      subject: `Reminder: Session Tomorrow — ${session.enrolment.course.title}`,
      html: `<p>Hi ${session.enrolment.trainer.user.fullName},</p><p>You have a session with ${session.enrolment.trainee.fullName} tomorrow at ${session.sessionDate.toLocaleTimeString()}.</p>`,
    });
  }
}

const worker = new Worker(
  'cron-jobs',
  async (job: Job) => {
    switch (job.name) {
      case 'run-mpesa-reconciliation':
        await runMpesaReconciliation();
        break;
      case 'run-cleanup':
        await runCleanup();
        break;
      case 'run-session-reminders':
        await sendSessionReminders();
        break;
      default:
        console.warn(`[Cron] Unknown job: ${job.name}`);
    }
  },
  { connection },
);

worker.on('completed', (job) => {
  console.log(`[Cron] Job ${job.name} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Cron] Job ${job?.name} failed:`, err);
});

console.log('[Cron] Worker started');
