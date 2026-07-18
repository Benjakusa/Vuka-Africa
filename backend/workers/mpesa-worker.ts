import { Queue, Worker, Job } from 'bullmq';
import { redis } from '@backend/lib/redis';
import { supabaseDb } from '@backend/lib/db';
import { addEmailToQueue } from './email-worker';

const connection = redis as any;

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
  _phoneNumber: string,
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

  await supabaseDb.$transaction(async (tx: any) => {
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
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
<tr><td style="background:#FF5349;padding:28px 32px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:-.02em">Vuka Afrique</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:13px">Payment Confirmed</p>
</td></tr>
<tr><td style="padding:32px">
<h2 style="margin:0 0 6px;font-size:18px;color:#1a1a1a">Hi ${enrolment.trainee.fullName},</h2>
<p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6">
Your payment was successful. You are now enrolled in <strong style="color:#1a1a1a">${enrolment.course.title}</strong>.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px">
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Course</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;font-weight:600">${enrolment.course.title}</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Amount Paid</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;font-weight:600">KES ${paidAmount.toLocaleString()}</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">M-Pesa Receipt</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;font-family:monospace">${mpesaReceiptNumber}</td></tr>
</table>
<p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.6">
You can now access your course materials and start learning from your dashboard.
</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<a href="https://vukaafrique.com/trainee/enrolments" style="display:inline-block;padding:12px 28px;background:#FF5349;color:#fff;text-decoration:none;font-size:14px;font-weight:600;border-radius:6px">Go to Dashboard</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
<p style="margin:0;font-size:12px;color:#9ca3af">© 2026 Vuka Afrique. All rights reserved.</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`,
  });

  await addEmailToQueue({
    to: enrolment.trainer.user.email,
    subject: `New Enrolment — ${enrolment.trainee.fullName} joined ${enrolment.course.title}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
<tr><td style="background:#FF5349;padding:28px 32px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:-.02em">Vuka Afrique</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:13px">New Enrolment</p>
</td></tr>
<tr><td style="padding:32px">
<h2 style="margin:0 0 6px;font-size:18px;color:#1a1a1a">Hi ${enrolment.trainer.user.fullName},</h2>
<p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6">
<strong style="color:#1a1a1a">${enrolment.trainee.fullName}</strong> has enrolled in your course <strong style="color:#1a1a1a">${enrolment.course.title}</strong>.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px">
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Trainee</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;font-weight:600">${enrolment.trainee.fullName}</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Course</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;font-weight:600">${enrolment.course.title}</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Amount Received</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;font-weight:600">KES ${paidAmount.toLocaleString()}</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">M-Pesa Receipt</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;font-family:monospace">${mpesaReceiptNumber}</td></tr>
</table>
<p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.6">
The payment has been received and is held securely in escrow. It will be released as training milestones are confirmed.
</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<a href="https://vukaafrique.com/trainer/enrolments" style="display:inline-block;padding:12px 28px;background:#FF5349;color:#fff;text-decoration:none;font-size:14px;font-weight:600;border-radius:6px">View Enrolment</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
<p style="margin:0;font-size:12px;color:#9ca3af">© 2026 Vuka Afrique. All rights reserved.</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`,
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

  await supabaseDb.$transaction(async (tx: any) => {
    await tx.trainer.update({
      where: { id: trainerId },
      data: {
        verificationFeePaid: true,
        verificationFeeAmount: amount,
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
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
<tr><td style="background:#FF5349;padding:28px 32px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:-.02em">Vuka Afrique</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:13px">Verification Fee Received</p>
</td></tr>
<tr><td style="padding:32px">
<h2 style="margin:0 0 6px;font-size:18px;color:#1a1a1a">Hi ${trainer.user.fullName},</h2>
<p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6">
Thank you for your payment. Your trainer verification application is now under review.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px">
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Amount</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;font-weight:600">KES 5,000</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">M-Pesa Receipt</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;font-family:monospace">${mpesaReceiptNumber}</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Status</td><td style="padding:4px 0;font-size:13px;color:#eab308;font-weight:600">Under Review</td></tr>
</table>
<p style="margin:0 0 4px;font-size:14px;color:#4b5563;line-height:1.6">Our team will review your documents within <strong>2 business days</strong>. You will receive an email once your account is verified.</p>
</td></tr>
<tr><td style="padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
<p style="margin:0;font-size:12px;color:#9ca3af">© 2026 Vuka Afrique. All rights reserved.</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`,
  });

  const admin = await supabaseDb.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin) {
    await addEmailToQueue({
      to: admin.email,
      subject: `New Verification Fee Paid — ${trainer.user.fullName}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
<tr><td style="background:#FF5349;padding:28px 32px;text-align:center">
<h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:-.02em">Vuka Afrique</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:13px">New Verification Fee</p>
</td></tr>
<tr><td style="padding:32px">
<h2 style="margin:0 0 6px;font-size:18px;color:#1a1a1a">Admin Notification</h2>
<p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6">
Trainer <strong style="color:#1a1a1a">${trainer.user.fullName}</strong> has paid the verification fee and is ready for review.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:16px">
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Name</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;font-weight:600">${trainer.user.fullName}</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">Email</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;font-weight:600">${trainer.user.email}</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280">M-Pesa Receipt</td><td style="padding:4px 0;font-size:13px;color:#1a1a1a;font-family:monospace">${mpesaReceiptNumber}</td></tr>
</table>
<p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.6">Review their application in the admin dashboard.</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<a href="https://vukaafrique.com/admin/trainers" style="display:inline-block;padding:12px 28px;background:#FF5349;color:#fff;text-decoration:none;font-size:14px;font-weight:600;border-radius:6px">Review Application</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
<p style="margin:0;font-size:12px;color:#9ca3af">© 2026 Vuka Afrique. All rights reserved.</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`,
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

    await supabaseDb.$transaction(async (tx: any) => {
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
<p>The funds have been returned to your Vuka Afrique wallet.</p>`,
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
