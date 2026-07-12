import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!;
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Vuka Afrique <noreply@vukaafrique.com>';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface StkCallbackMetaItem {
  Name: string;
  Value: string | number;
}

interface StkCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item: StkCallbackMetaItem[];
  };
}

interface CallbackPayload {
  Body: {
    stkCallback: StkCallback;
  };
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.warn('[mpesa-callback] SENDGRID_API_KEY not set, skipping email');
    return;
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: {
        email: EMAIL_FROM.replace(/^.*<(.+)>$/, '$1').trim() || EMAIL_FROM,
        name: EMAIL_FROM.replace(/^(.+)<.*$/, '$1').trim() || 'Vuka Afrique',
      },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[mpesa-callback] SendGrid error: ${res.status} ${body}`);
  }
}

function getMeta(callback: StkCallback, name: string): string | number | undefined {
  return callback.CallbackMetadata?.Item?.find((i) => i.Name === name)?.Value;
}

async function processEnrolmentPayment(
  enrolmentId: string,
  receipt: string,
  amount: number,
  phone: string,
  checkoutRequestId: string,
) {
  const { data: enrolment, error: fetchError } = await supabase
    .from('Enrolment')
    .select(
      '*, course:Course(title), trainer:Trainer!trainerId(user:User!userId(email, fullName)), trainee:User!traineeId(email, fullName)',
    )
    .eq('id', enrolmentId)
    .maybeSingle();

  if (fetchError || !enrolment) {
    console.error(`[mpesa-callback] Enrolment ${enrolmentId} not found:`, fetchError);
    return;
  }

  if (enrolment.status !== 'PENDING_PAYMENT') {
    console.log(`[mpesa-callback] Enrolment ${enrolmentId} status is ${enrolment.status}, expected PENDING_PAYMENT`);
    return;
  }

  const paidAmount = Number(enrolment.pricePaidKes);
  const trainerPayoutTotal = Number(enrolment.trainerPayoutKes);
  const commissionAmount = Number(enrolment.commissionKes);

  const { error: updateError } = await supabase
    .from('Enrolment')
    .update({
      status: 'PENDING_ACCEPTANCE',
      mpesaTransactionId: receipt,
      mpesaReceiptNumber: receipt,
      mpesaCheckoutRequestId: checkoutRequestId,
      startedAt: new Date().toISOString(),
    })
    .eq('id', enrolmentId);

  if (updateError) {
    console.error(`[mpesa-callback] Failed to update enrolment:`, updateError);
    return;
  }

  const milestones = [
    { sequence: 1, label: 'Start', percentage: 25.0, amountKes: Math.round(trainerPayoutTotal * 0.25 * 100) / 100 },
    { sequence: 2, label: 'Progress', percentage: 50.0, amountKes: Math.round(trainerPayoutTotal * 0.5 * 100) / 100 },
    {
      sequence: 3,
      label: 'Completion',
      percentage: 25.0,
      amountKes: Math.round(trainerPayoutTotal * 0.25 * 100) / 100,
    },
  ];

  for (const m of milestones) {
    await supabase.from('Milestone').insert({
      enrolmentId,
      sequence: m.sequence,
      label: m.label,
      percentage: m.percentage,
      amountKes: m.amountKes,
    });
  }

  await supabase.from('TransactionLedger').insert({
    userId: enrolment.traineeId,
    type: 'TRAINEE_PAYMENT',
    direction: 'CREDIT',
    amountKes: paidAmount,
    balanceBefore: 0,
    balanceAfter: 0,
    referenceType: 'enrolment',
    referenceId: enrolmentId,
    mpesaTransactionId: receipt,
    description: `Payment for ${enrolment.course.title}`,
  });

  await supabase.from('TransactionLedger').insert({
    userId: enrolment.trainer.userId,
    type: 'COMMISSION',
    direction: 'CREDIT',
    amountKes: commissionAmount,
    balanceBefore: 0,
    balanceAfter: 0,
    referenceType: 'enrolment',
    referenceId: enrolmentId,
    mpesaTransactionId: receipt,
    description: `Commission on ${enrolment.course.title}`,
  });
  // totalStudents increment is now handled by the DB trigger trg_enrolment_increment_students

  await sendEmail(
    enrolment.trainee.email,
    `Payment Successful — Enrolled in ${enrolment.course.title}`,
    `<p>Hi ${enrolment.trainee.fullName},</p>
<p>Your payment of KES ${paidAmount.toLocaleString()} for <strong>${enrolment.course.title}</strong> was successful.</p>
<p>M-Pesa receipt: ${receipt}</p>
<p>You can now access your course from your dashboard.</p>`,
  );

  const trainerEmail = enrolment.trainer?.user?.email;
  const trainerName = enrolment.trainer?.user?.fullName;
  if (trainerEmail) {
    await sendEmail(
      trainerEmail,
      `New Enrolment Requires Review — ${enrolment.trainee.fullName} joined ${enrolment.course.title}`,
      `<p>Hi ${trainerName},</p>
<p><strong>${enrolment.trainee.fullName}</strong> has enrolled in your course <strong>${enrolment.course.title}</strong>.</p>
<p>Payment of KES ${paidAmount.toLocaleString()} has been received and is awaiting your acceptance.</p>
<p>Please review and accept this enrolment in your trainer dashboard to begin.</p>`,
    );
  }
}

async function processVerificationPayment(trainerId: string, receipt: string, amount: number) {
  const { data: trainer, error: fetchError } = await supabase
    .from('Trainer')
    .select('*, user:User!userId(email, fullName)')
    .eq('id', trainerId)
    .maybeSingle();

  if (fetchError || !trainer) {
    console.error(`[mpesa-callback] Trainer ${trainerId} not found:`, fetchError);
    return;
  }

  if (trainer.verificationFeePaid) {
    console.log(`[mpesa-callback] Verification fee already paid for trainer ${trainerId}, skipping`);
    return;
  }

  await supabase
    .from('Trainer')
    .update({
      verificationFeePaid: true,
      verificationFeeAmount: amount,
      verificationStatus: 'PENDING',
    })
    .eq('id', trainerId);

  await supabase.from('TransactionLedger').insert({
    userId: trainer.userId,
    type: 'VERIFICATION_FEE',
    direction: 'DEBIT',
    amountKes: amount,
    balanceBefore: 0,
    balanceAfter: 0,
    referenceType: 'verification',
    referenceId: trainerId,
    mpesaTransactionId: receipt,
    description: 'Verification fee payment',
  });

  await sendEmail(
    trainer.user.email,
    'Verification Fee Received — Under Review',
    `<p>Hi ${trainer.user.fullName},</p>
<p>Your KES 2,000 verification fee has been received (M-Pesa: ${receipt}).</p>
<p>Our team will review your documents within 2 business days.</p>`,
  );

  const { data: admin } = await supabase.from('User').select('email').eq('role', 'ADMIN').limit(1).maybeSingle();
  if (admin) {
    await sendEmail(
      admin.email,
      `New Verification Fee Paid — ${trainer.user.fullName}`,
      `<p>Trainer <strong>${trainer.user.fullName}</strong> (${trainer.user.email}) has paid the KES 2,000 verification fee.</p>
<p>Receipt: ${receipt}</p>
<p>Review their application in the admin dashboard.</p>`,
    );
  }
}

async function handleFailedPayment(callback: StkCallback) {
  const ref = callback.CheckoutRequestID || '';

  const { data: enrolment } = await supabase
    .from('Enrolment')
    .select('id, trainee:User!traineeId(email), course:Course(title)')
    .eq('mpesaCheckoutRequestId', ref)
    .maybeSingle();

  if (enrolment) {
    await supabase
      .from('Enrolment')
      .update({ status: 'CANCELLED', cancelledAt: new Date().toISOString() })
      .eq('id', enrolment.id);

    await sendEmail(
      enrolment.trainee.email,
      `Payment Failed — ${enrolment.course.title}`,
      `<p>Your payment for <strong>${enrolment.course.title}</strong> was not completed: ${callback.ResultDesc}.</p>
<p>Please try again from your dashboard.</p>`,
    );
    return;
  }

  const { data: trainer } = await supabase
    .from('Trainer')
    .select('id, user:User!userId(email, fullName)')
    .eq('id', ref)
    .maybeSingle();

  if (trainer) {
    await sendEmail(
      trainer.user.email,
      'Verification Payment Failed',
      `<p>Your verification fee payment of KES 2,000 failed: ${callback.ResultDesc}. Please try again from your dashboard.</p>`,
    );
  }
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const payload: CallbackPayload = await req.json();
    const callback = payload.Body?.stkCallback;

    if (!callback) {
      console.error('[mpesa-callback] Invalid callback payload:', JSON.stringify(payload));
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(
      `[mpesa-callback] Received: resultCode=${callback.ResultCode}, checkoutId=${callback.CheckoutRequestID}, receipt=${getMeta(callback, 'MpesaReceiptNumber')}`,
    );

    if (callback.ResultCode !== 0) {
      await handleFailedPayment(callback);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const receipt = getMeta(callback, 'MpesaReceiptNumber') as string | undefined;
    if (!receipt) {
      console.error('[mpesa-callback] Missing receipt number');
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: 'Missing receipt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amount = Number(getMeta(callback, 'Amount') || 0);
    const phone = String(getMeta(callback, 'PhoneNumber') || '');
    const checkoutRequestId = callback.CheckoutRequestID;

    const { data: enrolment } = await supabase
      .from('Enrolment')
      .select('id')
      .eq('mpesaCheckoutRequestId', checkoutRequestId)
      .maybeSingle();

    if (enrolment) {
      await processEnrolmentPayment(enrolment.id, receipt, amount, phone, checkoutRequestId);
    } else {
      const { data: trainer } = await supabase
        .from('Trainer')
        .select('id')
        .eq('mpesaCheckoutRequestId', checkoutRequestId)
        .maybeSingle();

      if (trainer) {
        await processVerificationPayment(trainer.id, receipt, amount);
      } else {
        console.warn(`[mpesa-callback] No enrolment or trainer found for checkoutRequestId: ${checkoutRequestId}`);
      }
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Success' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[mpesa-callback] Error:', err);
    return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
