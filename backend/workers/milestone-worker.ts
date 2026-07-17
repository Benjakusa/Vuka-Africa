import { Queue, Worker, type Job } from 'bullmq';
import Redis from 'ioredis';
import { supabaseAdmin } from '../lib/supabase-admin';

// ─── Types ───────────────────────────────────────────────────

interface MilestoneJobData {
  milestoneId: string;
  enrolmentId: string;
}

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

export const milestoneQueue = new Queue<MilestoneJobData>('milestones', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

// ─── Helpers ─────────────────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    console.warn('[milestone-worker] SENDGRID_API_KEY not set, skipping email');
    return;
  }

  const emailFrom = process.env.EMAIL_FROM || 'Vuka <noreply@vuka.africa>';
  const fromMatch = emailFrom.match(/^"?([^"]*)"?\s*<(.+)>$/);
  const from = fromMatch
    ? { name: fromMatch[1].trim(), email: fromMatch[2].trim() }
    : { name: 'Vuka', email: emailFrom.trim() };

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from,
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[milestone-worker] SendGrid error: ${res.status} ${body}`);
    }
  } catch (err) {
    console.error('[milestone-worker] SendGrid error:', err);
  }
}

// ─── Worker ───────────────────────────────────────────────────

const worker = new Worker<MilestoneJobData>(
  'milestones',
  async (job: Job<MilestoneJobData>) => {
    const { milestoneId, enrolmentId } = job.data;

    console.log(
      `[milestone-worker] Processing milestone release: ${milestoneId}`,
    );

    // 1. Fetch milestone with enrolment and trainer data
    const { data: milestone, error: fetchError } = await supabaseAdmin
      .from('Milestone')
      .select(
        `*,
        enrolment:Enrolment!enrolmentId(
          id, trainerId, traineeId, pricePaidKes, trainerPayoutKes, commissionKes, status,
          trainer:Trainer!trainerId(
            id, availableBalance, userId,
            user:User!userId(email, fullName)
          ),
          trainee:User!traineeId(email, fullName),
          course:Course(title)
        )`,
      )
      .eq('id', milestoneId)
      .maybeSingle();

    if (fetchError || !milestone) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    // 2. Verify milestone is ready for release
    if (milestone.status === 'RELEASED') {
      console.log(
        `[milestone-worker] Milestone ${milestoneId} already released, skipping`,
      );
      return { skipped: true, reason: 'Already released' };
    }

    if (!milestone.traineeConfirmedAt || !milestone.trainerConfirmedAt) {
      console.log(
        `[milestone-worker] Milestone ${milestoneId} not fully confirmed, skipping`,
      );
      return { skipped: true, reason: 'Not fully confirmed' };
    }

    // 3. Check cooling-off period (24 hours after last confirmation)
    const lastConfirmation =
      milestone.traineeConfirmedAt > milestone.trainerConfirmedAt
        ? new Date(milestone.traineeConfirmedAt)
        : new Date(milestone.trainerConfirmedAt);

    const coolingOffEnd = new Date(
      lastConfirmation.getTime() + 24 * 60 * 60 * 1000, // 24 hours
    );

    if (Date.now() < coolingOffEnd.getTime()) {
      // Reschedule for after cooling-off period
      const delayMs = coolingOffEnd.getTime() - Date.now() + 60000; // +1 min buffer
      console.log(
        `[milestone-worker] Cooling-off not complete. Rescheduling in ${Math.round(delayMs / 60000)} minutes`,
      );
      throw Worker.RateLimitError(); // Use rate limit to retry later
    }

    // 4. Check enrolment is still ACTIVE
    if (milestone.enrolment?.status !== 'ACTIVE') {
      console.log(
        `[milestone-worker] Enrolment ${enrolmentId} not active (${milestone.enrolment?.status}), skipping`,
      );
      return { skipped: true, reason: 'Enrolment not active' };
    }

    // 5. Release the milestone amount
    const releaseAmount = milestone.amountKes || 0;
    const enrolment = milestone.enrolment;

    if (releaseAmount <= 0) {
      console.log(`[milestone-worker] No amount to release for milestone ${milestoneId}`);
    }

    // Update milestone status
    const { error: updateError } = await supabaseAdmin
      .from('Milestone')
      .update({
        status: 'RELEASED',
        releasedAt: new Date().toISOString(),
      })
      .eq('id', milestoneId);

    if (updateError) {
      console.error('[milestone-worker] Failed to update milestone:', updateError);
      throw updateError;
    }

    // Update trainer's available balance
    if (releaseAmount > 0 && enrolment?.trainerId) {
      await supabaseAdmin
        .from('Trainer')
        .update({
          availableBalance: supabaseAdmin.sql`"availableBalance" + ${releaseAmount}`,
        })
        .eq('id', enrolment.trainerId);
    }

    // 6. Record transaction
    if (enrolment?.trainer?.userId) {
      await supabaseAdmin.from('TransactionLedger').insert({
        userId: enrolment.trainer.userId,
        type: 'MILESTONE_RELEASE',
        direction: 'CREDIT',
        amountKes: releaseAmount,
        balanceBefore: 0,
        balanceAfter: 0,
        referenceType: 'milestone',
        referenceId: milestoneId,
        description: `Milestone ${milestone.sequence}: ${milestone.label} — ${enrolment.course?.title || 'Course'}`,
      });
    }

    // 7. Send notification email to trainer
    if (enrolment?.trainer?.user?.email) {
      await sendEmail(
        enrolment.trainer.user.email,
        `Milestone Funds Released — ${enrolment.course?.title || 'Your Course'}`,
        `<p>Hi ${enrolment.trainer.user.fullName || 'Trainer'},</p>
<p>KES ${releaseAmount.toLocaleString()} has been released from escrow for:</p>
<p><strong>${enrolment.course?.title || 'Course'}</strong> — ${milestone.label}</p>
<p>The funds have been added to your available balance. You can withdraw them at any time.</p>`,
      );
    }

    // 8. Check if all milestones are released — complete the enrolment
    if (enrolmentId) {
      const { data: allMilestones } = await supabaseAdmin
        .from('Milestone')
        .select('status')
        .eq('enrolmentId', enrolmentId);

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
          .eq('id', enrolmentId);

        // Notify trainee to leave a review
        if (enrolment?.trainee?.email) {
          await sendEmail(
            enrolment.trainee.email,
            `Training Complete — ${enrolment.course?.title || 'Your Course'}`,
            `<p>Hi ${enrolment.trainee.fullName || 'Student'},</p>
<p>All milestones for <strong>${enrolment.course?.title || 'your course'}</strong> have been completed!</p>
<p>Please take a moment to rate your trainer and leave a review.</p>`,
          );
        }
      }
    }

    console.log(
      `[milestone-worker] Milestone ${milestoneId} released successfully: KES ${releaseAmount}`,
    );
    return { success: true, amount: releaseAmount };
  },
  { connection, concurrency: 3 },
);

// ─── Job Adder ────────────────────────────────────────────────

export async function addMilestoneReleaseJob(
  data: MilestoneJobData,
): Promise<void> {
  // Schedule the job with a 24-hour delay (cooling-off period)
  await milestoneQueue.add('release-milestone', data, {
    jobId: `milestone-${data.milestoneId}`,
    delay: 24 * 60 * 60 * 1000, // 24 hours
  });
}

// ─── Graceful Shutdown ────────────────────────────────────────

process.on('SIGTERM', async () => {
  console.log('[milestone-worker] Shutting down...');
  await worker.close();
  await milestoneQueue.close();
  connection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[milestone-worker] Shutting down...');
  await worker.close();
  await milestoneQueue.close();
  connection.disconnect();
  process.exit(0);
});

console.log('[milestone-worker] Worker started and waiting for jobs...');