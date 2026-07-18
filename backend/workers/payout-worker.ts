import { Queue } from 'bullmq';
import { redis } from '@backend/lib/redis';
import { supabaseDb, supabaseAdmin } from '@backend/lib/db';
import { mpesaClient } from '@backend/lib/mpesa';
import { addEmailToQueue } from './email-worker';
import { createManagedWorker, setupGracefulShutdown } from './base';
import { WORKER } from '@backend/lib/config';

const connection = redis as any;

export const payoutQueue = new Queue('payouts', {
  connection,
  defaultJobOptions: {
    attempts: WORKER.PAYOUT_MAX_RETRIES,
    backoff: { type: 'exponential', delay: WORKER.PAYOUT_RETRY_DELAY_MS },
    removeOnComplete: { age: 3600 * 24 * 7 },
    removeOnFail: { age: 3600 * 24 * 30 },
  },
});

export async function addPayoutJob(data: {
  payoutId: string;
  trainerId: string;
  amountKes: number;
  phoneNumber: string;
  idempotencyKey: string;
}) {
  await payoutQueue.add('process-payout', data, {
    jobId: `payout:${data.payoutId}`,
  });
}

async function processB2CInitiation(
  payoutId: string,
  trainerId: string,
  amountKes: number,
  phoneNumber: string,
  idempotencyKey: string,
) {
  const payout = await supabaseDb.payout.findUnique({ where: { id: payoutId } });
  if (!payout) {
    console.error(`[Payout Worker] Payout ${payoutId} not found`);
    return;
  }
  if (payout.status === 'COMPLETED' || payout.status === 'FAILED') {
    console.log(`[Payout Worker] Payout ${payoutId} already ${payout.status}, skipping`);
    return;
  }

  await supabaseDb.payout.update({
    where: { id: payoutId },
    data: { status: 'PROCESSING' },
  });

  try {
    const b2cResponse = await mpesaClient.b2cPayment({
      amount: amountKes,
      phone: phoneNumber,
      remarks: `Vuka payout ${payoutId.slice(0, 8)}`,
      occasion: idempotencyKey,
      idempotencyKey,
    });

    await supabaseDb.payout.update({
      where: { id: payoutId },
      data: { mpesaConversationId: b2cResponse.ConversationID, idempotencyKey },
    });

    console.log(`[Payout Worker] B2C initiated for payout ${payoutId}: conversationId=${b2cResponse.ConversationID}`);
  } catch (error: any) {
    const retryCount = payout.retryCount + 1;

    if (retryCount >= WORKER.PAYOUT_MAX_RETRIES) {
      console.error(
        `[Payout Worker] B2C failed after ${WORKER.PAYOUT_MAX_RETRIES} retries for payout ${payoutId}: ${error.message}`,
      );

      await supabaseDb.$transaction(async (tx: any) => {
        const { error: rpcError } = await supabaseAdmin.rpc('handle_failed_payout_refund', {
          p_payout_id: payoutId,
          p_trainer_id: trainerId,
          p_amount_kes: amountKes,
          p_failure_reason: error.message || 'B2C failed after retries',
          p_retry_count: retryCount,
        });
        if (rpcError) throw rpcError;
      });

      const trainerUser = await supabaseDb.trainer.findUnique({
        where: { id: trainerId },
        include: { user: { select: { email: true } } },
      });
      if (trainerUser) {
        await addEmailToQueue({
          to: trainerUser.user.email,
          subject: 'Payout Failed — Funds Returned',
          html: `<p>Your withdrawal of KES ${amountKes.toLocaleString()} has failed after multiple attempts. The funds have been returned to your Vuka Afrique wallet.</p>`,
        });
      }
    } else {
      await supabaseDb.payout.update({
        where: { id: payoutId },
        data: { retryCount },
      });
      throw error;
    }
  }
}

const worker = createManagedWorker({
  name: 'payouts',
  connection,
  concurrency: WORKER.PAYOUT_CONCURRENCY,
  processor: async (job) => {
    const { payoutId, trainerId, amountKes, phoneNumber, idempotencyKey } = job.data;
    await processB2CInitiation(payoutId, trainerId, amountKes, phoneNumber, idempotencyKey);
  },
});

setupGracefulShutdown(worker, 'Payout Worker');
