import { Queue, Worker, type Job } from 'bullmq';
import Redis from 'ioredis';
import { supabaseAdmin } from '../lib/supabase-admin';

// ─── Redis Connection ────────────────────────────────────────

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is required');
}

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// ─── Queue ────────────────────────────────────────────────────

interface CronJobData {
  task: 'release-milestones' | 'cleanup-sessions' | 'daily-report';
  scheduledAt: string;
}

export const cronQueue = new Queue<CronJobData>('cron', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
  },
});

// ─── Task Handlers ────────────────────────────────────────────

async function releaseCooledOffMilestones(): Promise<{
  released: number;
}> {
  console.log('[cron-worker] Checking for milestones ready for release...');

  // Find milestones where both parties confirmed more than 24 hours ago
  const coolingOffDeadline = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: milestones, error } = await supabaseAdmin
    .from('Milestone')
    .select('id, enrolmentId, status, traineeConfirmedAt, trainerConfirmedAt')
    .eq('status', 'PENDING') // Not yet released
    .not('traineeConfirmedAt', 'is', null)
    .not('trainerConfirmedAt', 'is', null)
    .lte('trainerConfirmedAt', coolingOffDeadline)
    .lte('traineeConfirmedAt', coolingOffDeadline);

  if (error) {
    console.error('[cron-worker] Failed to fetch milestones:', error);
    return { released: 0 };
  }

  if (!milestones || milestones.length === 0) {
    console.log('[cron-worker] No milestones ready for release');
    return { released: 0 };
  }

  console.log(
    `[cron-worker] Found ${milestones.length} milestones ready for release`,
  );

  let released = 0;

  for (const milestone of milestones) {
    try {
      // Fetch full milestone data with enrolment
      const { data: fullMilestone } = await supabaseAdmin
        .from('Milestone')
        .select(
          `*,
          enrolment:Enrolment!enrolmentId(
            id, trainerId, pricePaidKes, trainerPayoutKes,
            trainer:Trainer!trainerId(availableBalance, userId)
          )`,
        )
        .eq('id', milestone.id)
        .maybeSingle();

      if (!fullMilestone) continue;

      const releaseAmount = fullMilestone.amountKes || 0;

      // Update milestone status
      await supabaseAdmin
        .from('Milestone')
        .update({
          status: 'RELEASED',
          releasedAt: new Date().toISOString(),
        })
        .eq('id', milestone.id);

      // Update trainer's available balance
      if (releaseAmount > 0 && fullMilestone.enrolment?.trainerId) {
        await supabaseAdmin
          .from('Trainer')
          .update({
            availableBalance: supabaseAdmin.sql`"availableBalance" + ${releaseAmount}`,
          })
          .eq('id', fullMilestone.enrolment.trainerId);

        // Record transaction
        if (fullMilestone.enrolment?.trainer?.userId) {
          await supabaseAdmin.from('TransactionLedger').insert({
            userId: fullMilestone.enrolment.trainer.userId,
            type: 'MILESTONE_RELEASE',
            direction: 'CREDIT',
            amountKes: releaseAmount,
            balanceBefore: 0,
            balanceAfter: 0,
            referenceType: 'milestone',
            referenceId: milestone.id,
            description: `Milestone ${fullMilestone.sequence}: ${fullMilestone.label}`,
          });
        }
      }

      // Check if all milestones are released
      const { data: allMilestones } = await supabaseAdmin
        .from('Milestone')
        .select('status')
        .eq('enrolmentId', milestone.enrolmentId);

      const allReleased = allMilestones?.every(
        (m) => m.status === 'RELEASED',
      );

      if (allReleased && allMilestones && allMilestones.length > 0) {
        await supabaseAdmin
          .from('Enrolment')
          .update({
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
          })
          .eq('id', milestone.enrolmentId);
      }

      released++;
    } catch (err) {
      console.error(
        `[cron-worker] Failed to release milestone ${milestone.id}:`,
        err,
      );
    }
  }

  console.log(`[cron-worker] Released ${released} milestones`);
  return { released };
}

async function cleanupExpiredSessions(): Promise<{ cleaned: number }> {
  console.log('[cron-worker] Cleaning up expired sessions...');

  // Delete sessions older than 30 days
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error, count } = await supabaseAdmin
    .from('sessions')
    .delete()
    .lt('created_at', thirtyDaysAgo)
    .select('id', { count: 'exact' });

  if (error) {
    // Sessions table might not exist — that's okay
    console.warn('[cron-worker] Could not clean sessions:', error.message);
    return { cleaned: 0 };
  }

  console.log(`[cron-worker] Cleaned ${count || 0} expired sessions`);
  return { cleaned: count || 0 };
}

async function generateDailyReport(): Promise<{ generated: boolean }> {
  console.log('[cron-worker] Generating daily report...');

  try {
    // Fetch platform stats
    const [users, trainers, enrolments, payouts, disputes] =
      await Promise.all([
        supabaseAdmin
          .from('User')
          .select('*', { count: 'exact', head: true }),
        supabaseAdmin
          .from('Trainer')
          .select('*', { count: 'exact', head: true }),
        supabaseAdmin
          .from('Enrolment')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ACTIVE'),
        supabaseAdmin
          .from('Payout')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'COMPLETED'),
        supabaseAdmin
          .from('Dispute')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'OPEN'),
      ]);

    const report = {
      date: new Date().toISOString().split('T')[0],
      totalUsers: users.count || 0,
      totalTrainers: trainers.count || 0,
      activeEnrolments: enrolments.count || 0,
      completedPayouts: payouts.count || 0,
      openDisputes: disputes.count || 0,
      generatedAt: new Date().toISOString(),
    };

    // Store report in the database
    const { error: insertError } = await supabaseAdmin
      .from('DailyReport')
      .upsert(
        { id: report.date, ...report },
        { onConflict: 'id' },
      );

    if (insertError) {
      console.error('[cron-worker] Failed to store daily report:', insertError);
      return { generated: false };
    }

    console.log('[cron-worker] Daily report generated:', report);
    return { generated: true };
  } catch (err) {
    console.error('[cron-worker] Failed to generate daily report:', err);
    return { generated: false };
  }
}

// ─── Worker ───────────────────────────────────────────────────

const worker = new Worker<CronJobData>(
  'cron',
  async (job: Job<CronJobData>) => {
    console.log(
      `[cron-worker] Running task: ${job.data.task} (scheduled: ${job.data.scheduledAt})`,
    );

    switch (job.data.task) {
      case 'release-milestones':
        return await releaseCooledOffMilestones();

      case 'cleanup-sessions':
        return await cleanupExpiredSessions();

      case 'daily-report':
        return await generateDailyReport();

      default:
        console.warn(`[cron-worker] Unknown task: ${job.data.task}`);
        return { skipped: true };
    }
  },
  { connection, concurrency: 1 }, // Single concurrency for cron tasks
);

// ─── Job Scheduler ────────────────────────────────────────────

export async function scheduleCronTasks(): Promise<void> {
  // Schedule milestone release check — every 15 minutes
  await cronQueue.upsertJobScheduler(
    'release-milestones-schedule',
    { every: 15 * 60 * 1000 }, // 15 minutes
    {
      name: 'cron-task',
      data: {
        task: 'release-milestones',
        scheduledAt: new Date().toISOString(),
      },
      opts: {
        removeOnComplete: true,
        removeOnFail: 5,
      },
    },
  );

  // Schedule session cleanup — every 24 hours
  await cronQueue.upsertJobScheduler(
    'cleanup-sessions-schedule',
    { every: 24 * 60 * 60 * 1000 }, // 24 hours
    {
      name: 'cron-task',
      data: {
        task: 'cleanup-sessions',
        scheduledAt: new Date().toISOString(),
      },
      opts: {
        removeOnComplete: true,
        removeOnFail: 3,
      },
    },
  );

  // Schedule daily report — every 24 hours at midnight
  await cronQueue.upsertJobScheduler(
    'daily-report-schedule',
    {
      pattern: '0 0 * * *', // Midnight every day
    },
    {
      name: 'cron-task',
      data: {
        task: 'daily-report',
        scheduledAt: new Date().toISOString(),
      },
      opts: {
        removeOnComplete: true,
        removeOnFail: 3,
      },
    },
  );

  console.log('[cron-worker] Cron schedules registered');
}

// ─── Graceful Shutdown ────────────────────────────────────────

process.on('SIGTERM', async () => {
  console.log('[cron-worker] Shutting down...');
  await worker.close();
  await cronQueue.close();
  connection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[cron-worker] Shutting down...');
  await worker.close();
  await cronQueue.close();
  connection.disconnect();
  process.exit(0);
});

console.log('[cron-worker] Worker started. Call scheduleCronTasks() to register schedules.');