import { Queue, Worker, Job } from 'bullmq';
import { redis } from '@backend/lib/redis';
import { supabaseDb } from '@backend/lib/db';
import { addEmailToQueue } from './email-worker';

const connection = redis;

export const mpesaQueue = new Queue('mpesa-callbacks', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 30000 },
    removeOnComplete: { age: 3600 * 24 * 7 },
    removeOnFail: { age: 3600 * 24 * 30 },
  },
});

export async function addMpesaCallbackJob(job: { type: string; data: any }) {
  await mpesaQueue.add(job.type, job.data, {
    jobId: `${job.type}:${job.data.mpesaReceiptNumber || job.data.conversationId || Date.now()}`,
  });
}

const worker = new Worker(
  'mpesa-callbacks',
  async (job: Job) => {
    const { type, data } = job.data;

    switch (type) {
      case 'process-stk-callback':
        await handleStkCallback(data);
        break;
      case 'process-b2c-result':
        await handleB2cResult(data);
        break;
      default:
        console.warn(`[M-Pesa Worker] Unknown job type: ${type}`);
    }
  },
  { connection },
);

worker.on('completed', (job) => {
  console.log(`[M-Pesa Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[M-Pesa Worker] Job ${job?.id} failed:`, err);
});

async function handleStkCallback(data: any) {
  const { resultCode, resultDesc, mpesaReceiptNumber, checkoutRequestId, amount, phoneNumber, accountReference } = data;

  if (resultCode !== 0) {
    console.log(`[M-Pesa] STK Push failed: resultCode=${resultCode}, desc=${resultDesc}`);

    if (accountReference?.startsWith('VUKA-ENR-') || accountReference?.startsWith('ENROL-')) {
      const enrolmentId = accountReference.replace(/^(VUKA-ENR-|ENROL-)/, '');
      await supabaseDb.enrolment
        .update({
          where: { id: enrolmentId },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        })
        .catch(() => {});

      const enrolment = await supabaseDb.enrolment.findUnique({
        where: { id: enrolmentId },
        include: { trainee: true, course: { select: { title: true } } },
      });
      if (enrolment) {
        await sendFailureEmail(enrolment.trainee.email, enrolment.course.title, resultDesc);
      }
    }

    if (accountReference?.startsWith('VUKA-VRFY-') || accountReference?.startsWith('VERIFY-')) {
      const trainerId = accountReference.replace(/^(VUKA-VRFY-|VERIFY-)/, '');
      const trainer = await supabaseDb.trainer.findUnique({
        where: { id: trainerId },
        include: { user: true },
      });
      if (trainer) {
        await addEmailToQueue({
          to: trainer.user.email,
          subject: 'Verification Payment Failed',
          html: `<p>Your verification fee payment of KES 5,000 failed: ${resultDesc}. Please try again from your dashboard.</p>`,
        });
      }
    }

    return;
  }

  console.log(`[M-Pesa] STK Push succeeded: receipt=${mpesaReceiptNumber}, amount=${amount}, ref=${accountReference}`);

  if (!mpesaReceiptNumber) {
    console.error('[M-Pesa] STK callback missing receipt number');
    return;
  }

  if (accountReference?.startsWith('VUKA-ENR-') || accountReference?.startsWith('ENROL-')) {
    const enrolmentId = accountReference.replace(/^(VUKA-ENR-|ENROL-)/, '');
    await processSuccessfulEnrolment(enrolmentId, mpesaReceiptNumber, amount, phoneNumber, checkoutRequestId);
  } else if (accountReference?.startsWith('VUKA-VRFY-') || accountReference?.startsWith('VERIFY-')) {
    const trainerId = accountReference.replace(/^(VUKA-VRFY-|VERIFY-)/, '');
    await processVerificationFee(trainerId, mpesaReceiptNumber, amount);
  } else {
    console.warn(`[M-Pesa] Unknown account reference type: ${accountReference}`);
  }
}

async function processSuccessfulEnrolment(
  enrolmentId: string,
  mpesaReceiptNumber: string,
  amount: number,
  phoneNumber: string,
  checkoutRequestId: string,
) {
  const enrolment = await supabaseDb.enrolment.findUnique({
    where: { id: enrolmentId, status: 'PENDING_PAYMENT' },
    include: {
      course: { select: { title: true } },
      trainer: { include: { user: { select: { email: true, fullName: true } } } },
      trainee: { select: { email: true, fullName: true } },
    },
  });

  if (!enrolment) {
    const existing = await supabaseDb.enrolment.findUnique({ where: { id: enrolmentId } });
    if (existing && existing.status === 'ACTIVE') {
      console.log(`[M-Pesa] Enrolment ${enrolmentId} already active, skipping`);
      return;
    }
    console.warn(`[M-Pesa] Enrolment ${enrolmentId} not found`);
    return;
  }

  if (Math.abs(Number(enrolment.pricePaidKes) - amount) > 1) {
    console.error(
      `[M-Pesa] Amount mismatch for enrolment ${enrolmentId}: expected ${enrolment.pricePaidKes}, got ${amount}`,
    );
    return;
  }

  const paidAmount = Number(enrolment.pricePaidKes);
  const trainerPayoutTotal = Number(enrolment.trainerPayoutKes);
  const commissionAmount = Number(enrolment.commissionKes);

  await supabaseDb.$transaction(async (tx) => {
    await tx.enrolment.update({
      where: { id: enrolmentId },
      data: {
        status: 'ACTIVE',
        mpesaTransactionId: mpesaReceiptNumber,
        mpesaReceiptNumber,
        mpesaCheckoutRequestId: checkoutRequestId,
        startedAt: new Date(),
      },
    });

    const milestoneData = [
      { sequence: 1, label: 'Start', percentage: 25.0, amountKes: Math.round(trainerPayoutTotal * 0.25 * 100) / 100 },
      { sequence: 2, label: 'Progress', percentage: 50.0, amountKes: Math.round(trainerPayoutTotal * 0.5 * 100) / 100 },
      {
        sequence: 3,
        label: 'Completion',
        percentage: 25.0,
        amountKes: Math.round(trainerPayoutTotal * 0.25 * 100) / 100,
      },
    ];

    for (const m of milestoneData) {
      await tx.milestone.create({
        data: {
          enrolmentId,
          sequence: m.sequence,
          label: m.label,
          percentage: m.percentage,
          amountKes: m.amountKes,
        },
      });
    }

    await tx.transactionLedger.create({
      data: {
        userId: enrolment.traineeId,
        type: 'TRAINEE_PAYMENT',
        direction: 'CREDIT',
        amountKes: paidAmount,
        balanceBefore: 0,
        balanceAfter: 0,
        referenceType: 'enrolment',
        referenceId: enrolmentId,
        mpesaTransactionId: mpesaReceiptNumber,
        description: `Payment for ${enrolment.course.title}`,
      },
    });

    await tx.transactionLedger.create({
      data: {
        userId: enrolment.trainer.userId,
        type: 'COMMISSION',
        direction: 'CREDIT',
        amountKes: commissionAmount,
        balanceBefore: 0,
        balanceAfter: 0,
        referenceType: 'enrolment',
        referenceId: enrolmentId,
        mpesaTransactionId: mpesaReceiptNumber,
        description: `Commission on ${enrolment.course.title}`,
      },
    });

    await tx.trainer.update({
      where: { id: enrolment.trainerId },
      data: { totalStudents: { increment: 1 } },
    });
  });

  await addEmailToQueue({
    to: enrolment.trainee.email,
    subject: `Payment Successful — Enrolled in ${enrolment.course.title}`,
    html: `<p>Hi ${enrolment.trainee.fullName},</p>
<p>Your payment of KES ${paidAmount.toLocaleString()} for <strong>${enrolment.course.title}</strong> was successful.</p>
<p>M-Pesa receipt: ${mpesaReceiptNumber}</p>
<p>You can now access your course from your dashboard.</p>`,
  });

  await addEmailToQueue({
    to: enrolment.trainer.user.email,
    subject: `New Enrolment — ${enrolment.trainee.fullName} joined ${enrolment.course.title}`,
    html: `<p>Hi ${enrolment.trainer.user.fullName},</p>
<p><strong>${enrolment.trainee.fullName}</strong> has enrolled in your course <strong>${enrolment.course.title}</strong>.</p>
<p>Payment of KES ${paidAmount.toLocaleString()} has been received and held in escrow.</p>`,
  });
}

async function processVerificationFee(trainerId: string, mpesaReceiptNumber: string, amount: number) {
  const trainer = await supabaseDb.trainer.findUnique({
    where: { id: trainerId },
    include: { user: true },
  });

  if (!trainer) {
    console.warn(`[M-Pesa] Trainer ${trainerId} not found for verification fee`);
    return;
  }

  if (trainer.verificationFeePaid) {
    console.log(`[M-Pesa] Verification fee already paid for trainer ${trainerId}, skipping`);
    return;
  }

  if (Math.abs(amount - 5000) > 1) {
    console.error(`[M-Pesa] Verification fee amount mismatch: expected 5000, got ${amount}`);
    return;
  }

  await supabaseDb.$transaction(async (tx) => {
    await tx.trainer.update({
      where: { id: trainerId },
      data: {
        verificationFeePaid: true,
        verificationFeeAmount: amount,
        verificationStatus: 'PENDING',
      },
    });

    await tx.transactionLedger.create({
      data: {
        userId: trainer.userId,
        type: 'VERIFICATION_FEE',
        direction: 'DEBIT',
        amountKes: amount,
        balanceBefore: 0,
        balanceAfter: 0,
        referenceType: 'verification',
        referenceId: trainerId,
        mpesaTransactionId: mpesaReceiptNumber,
        description: 'Verification fee payment',
      },
    });
  });

  await addEmailToQueue({
    to: trainer.user.email,
    subject: 'Verification Fee Received — Under Review',
    html: `<p>Hi ${trainer.user.fullName},</p>
<p>Your KES 5,000 verification fee has been received (M-Pesa: ${mpesaReceiptNumber}).</p>
<p>Our team will review your documents within 2 business days.</p>`,
  });

  const admin = await supabaseDb.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin) {
    await addEmailToQueue({
      to: admin.email,
      subject: `New Verification Fee Paid — ${trainer.user.fullName}`,
      html: `<p>Trainer <strong>${trainer.user.fullName}</strong> (${trainer.user.email}) has paid the KES 5,000 verification fee.</p>
<p>Receipt: ${mpesaReceiptNumber}</p>
<p>Review their application in the admin dashboard.</p>`,
    });
  }
}

async function handleB2cResult(data: any) {
  const { resultCode, resultDesc, originatorConversationId, conversationId, transactionId } = data;

  console.log(
    `[M-Pesa] B2C result: resultCode=${resultCode}, conversationId=${conversationId}, txnId=${transactionId}`,
  );

  const payout = await supabaseDb.payout.findFirst({
    where: {
      OR: [{ mpesaConversationId: conversationId }, { idempotencyKey: originatorConversationId }],
    },
    include: { trainer: { include: { user: true } } },
  });

  if (!payout) {
    console.warn(
      `[M-Pesa] Payout not found for conversationId=${conversationId} or originatorId=${originatorConversationId}`,
    );
    return;
  }

  if (payout.status === 'COMPLETED' || payout.status === 'FAILED') {
    console.log(`[M-Pesa] Payout ${payout.id} already ${payout.status}, skipping`);
    return;
  }

  if (resultCode === 0) {
    await supabaseDb.payout.update({
      where: { id: payout.id },
      data: {
        status: 'COMPLETED',
        mpesaTransactionId: transactionId || conversationId,
        mpesaReceiptNumber: transactionId,
        mpesaConversationId: conversationId,
        completedAt: new Date(),
      },
    });

    await supabaseDb.transactionLedger.create({
      data: {
        userId: payout.trainer.userId,
        type: 'TRAINER_PAYOUT',
        direction: 'DEBIT',
        amountKes: Number(payout.amountKes),
        balanceBefore: 0,
        balanceAfter: 0,
        referenceType: 'payout',
        referenceId: payout.id,
        mpesaTransactionId: transactionId,
        description: `B2C payout completed`,
      },
    });

    await addEmailToQueue({
      to: payout.trainer.user.email,
      subject: 'Withdrawal Successful',
      html: `<p>Hi ${payout.trainer.user.fullName},</p>
<p>KES ${Number(payout.amountKes).toLocaleString()} has been sent to ${payout.mpesaPhone} via M-Pesa.</p>
<p>M-Pesa receipt: ${transactionId}</p>`,
    });

    console.log(`[M-Pesa] Payout ${payout.id} completed successfully`);
  } else {
    await supabaseDb.payout.update({
      where: { id: payout.id },
      data: {
        status: 'FAILED',
        failureReason: resultDesc,
        mpesaConversationId: conversationId,
      },
    });

    await supabaseDb.$transaction(async (tx) => {
      const trainer = await tx.trainer.findUnique({
        where: { id: payout.trainerId },
      });
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
          description: `Refund for failed payout: ${resultDesc.slice(0, 200)}`,
        },
      });
    });

    await addEmailToQueue({
      to: payout.trainer.user.email,
      subject: 'Payout Failed — Funds Returned',
      html: `<p>Hi ${payout.trainer.user.fullName},</p>
<p>Your withdrawal of KES ${Number(payout.amountKes).toLocaleString()} has failed: ${resultDesc.slice(0, 500)}.</p>
<p>The funds have been returned to your Vuka wallet.</p>`,
    });

    console.log(`[M-Pesa] Payout ${payout.id} failed: ${resultDesc}`);
  }
}

async function sendFailureEmail(email: string, courseTitle: string, reason: string) {
  await addEmailToQueue({
    to: email,
    subject: `Payment Failed — ${courseTitle}`,
    html: `<p>Your payment for <strong>${courseTitle}</strong> was not completed: ${reason}.</p>
<p>Please try again from your dashboard. If the problem persists, contact support.</p>`,
  });
}

console.log('[M-Pesa] Callback worker started');
