import { Queue } from 'bullmq';
import { redis } from '@backend/lib/redis';
import { supabaseDb } from '@backend/lib/db';
import { mpesaClient } from '@backend/lib/mpesa';
import { addEmailToQueue } from './email-worker';
import { createManagedWorker, setupGracefulShutdown } from './base';
import { WORKER } from '@backend/lib/config';

const connection = redis;

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

      await supabaseDb.$transaction(async (tx) => {
        await tx.payout.update({
          where: { id: payoutId },
          data: { status: 'FAILED', failureReason: error.message || 'B2C failed after retries', retryCount },
        });

        const trainer = await tx.trainer.findUnique({ where: { id: trainerId } });
        if (!trainer) return;

        await tx.trainer.update({
          where: { id: trainerId },
          data: { availableBalance: { increment: amountKes } },
        });

        await tx.transactionLedger.create({
          data: {
            userId: trainer.userId,
            type: 'REFUND',
            direction: 'CREDIT',
            amountKes,
            balanceBefore: Number(trainer.availableBalance),
            balanceAfter: Number(trainer.availableBalance) + amountKes,
            referenceType: 'payout',
            referenceId: payoutId,
            description: 'Refund for failed payout after retries',
          },
        });
      });

      const trainerUser = await supabaseDb.trainer.findUnique({
        where: { id: trainerId },
        include: { user: { select: { email: true } } },
      });
      if (trainerUser) {
        await addEmailToQueue({
          to: trainerUser.user.email,
          subject: 'Payout Failed — Funds Returned',
          html: `<p>Your withdrawal of KES ${amountKes.toLocaleString()} has failed after multiple attempts. The funds have been returned to your Vuka wallet.</p>`,
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
