import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

function requireEnv(name: string): string {
  const val = Deno.env.get(name);
  if (!val) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

const SUPABASE_URL = requireEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'Vuka Afrique <noreply@vukaafrique.com>';

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
  if (!RESEND_API_KEY) {
    console.warn('[mpesa-callback] RESEND_API_KEY not set, skipping email');
    return;
  }

  const fromEmail = EMAIL_FROM.replace(/^.*<(.+)>$/, '$1').trim() || EMAIL_FROM;
  const fromName = EMAIL_FROM.replace(/^(.+)<.*$/, '$1').trim() || 'Vuka Afrique';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[mpesa-callback] Resend error: ${res.status} ${body}`);
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
  console.log(`[mpesa-callback] Processing enrolment payment for ${enrolmentId}, receipt: ${receipt}`);

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
    { sequence: 3, label: 'Completion', percentage: 25.0, amountKes: Math.round(trainerPayoutTotal * 0.25 * 100) / 100 },
  ];

  for (const m of milestones) {
    const { error: msErr } = await supabase.from('Milestone').insert({
      enrolmentId,
      sequence: m.sequence,
      label: m.label,
      percentage: m.percentage,
      amountKes: m.amountKes,
    });
    if (msErr) {
      console.error(`[mpesa-callback] Failed to insert milestone ${m.label}:`, msErr);
    }
  }

  const { error: tl1Err } = await supabase.from('TransactionLedger').insert({
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
  if (tl1Err) {
    console.error(`[mpesa-callback] Failed to insert trainee transaction:`, tl1Err);
  }

  const { error: tl2Err } = await supabase.from('TransactionLedger').insert({
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
  if (tl2Err) {
    console.error(`[mpesa-callback] Failed to insert commission transaction:`, tl2Err);
  }

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

  console.log(`[mpesa-callback] Enrolment ${enrolmentId} processed successfully`);
}

async function processVerificationPayment(trainerId: string, receipt: string, amount: number) {
  console.log(`[mpesa-callback] Processing verification payment for trainer ${trainerId}, receipt: ${receipt}`);

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

  const { error: updateErr } = await supabase
    .from('Trainer')
    .update({
      verificationFeePaid: true,
      verificationFeeAmount: amount,
    })
    .eq('id', trainerId);
  if (updateErr) {
    console.error(`[mpesa-callback] Failed to update trainer verification:`, updateErr);
    return;
  }

  const { error: tlErr } = await supabase.from('TransactionLedger').insert({
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
  if (tlErr) {
    console.error(`[mpesa-callback] Failed to insert verification transaction:`, tlErr);
  }

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

  console.log(`[mpesa-callback] Verification payment for trainer ${trainerId} processed successfully`);
}

async function handleFailedPayment(callback: StkCallback) {
  const ref = callback.CheckoutRequestID || '';
  console.log(`[mpesa-callback] Handling failed payment for checkoutRef: ${ref}, resultCode: ${callback.ResultCode}, desc: ${callback.ResultDesc}`);

  const { data: enrolment } = await supabase
    .from('Enrolment')
    .select('id, trainee:User!traineeId(email), course:Course(title)')
    .eq('mpesaCheckoutRequestId', ref)
    .maybeSingle();

  if (enrolment) {
    const { error: updateErr } = await supabase
      .from('Enrolment')
      .update({ status: 'CANCELLED', cancelledAt: new Date().toISOString() })
      .eq('id', enrolment.id);
    if (updateErr) {
      console.error(`[mpesa-callback] Failed to cancel enrolment:`, updateErr);
    }

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
    .eq('mpesaCheckoutRequestId', ref)
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
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[mpesa-callback:${requestId}] Callback received`);

  const cors = handleCors(req);
  if (cors) return cors;

  try {
    let payload: CallbackPayload;
    try {
      payload = await req.json();
    } catch {
      console.error(`[mpesa-callback:${requestId}] Invalid JSON in callback`);
      return new Response(
        JSON.stringify({ ResultCode: 1, ResultDesc: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const callback = payload.Body?.stkCallback;

    if (!callback) {
      console.error(`[mpesa-callback:${requestId}] Invalid callback payload:`, JSON.stringify(payload));
      return new Response(
        JSON.stringify({ ResultCode: 1, ResultDesc: 'Invalid payload structure' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const receipt = getMeta(callback, 'MpesaReceiptNumber') as string | undefined;
    const cbAmount = Number(getMeta(callback, 'Amount') || 0);
    const cbPhone = String(getMeta(callback, 'PhoneNumber') || '');

    console.log(`[mpesa-callback:${requestId}] Processing: resultCode=${callback.ResultCode}, checkoutId=${callback.CheckoutRequestID}, receipt=${receipt}, amount=${cbAmount}, phone=${cbPhone}`);

    if (callback.ResultCode !== 0) {
      console.log(`[mpesa-callback:${requestId}] Payment failed: ${callback.ResultDesc}`);
      await handleFailedPayment(callback);
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!receipt) {
      console.error(`[mpesa-callback:${requestId}] Missing receipt number in successful callback`);
      return new Response(
        JSON.stringify({ ResultCode: 1, ResultDesc: 'Missing receipt number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const checkoutRequestId = callback.CheckoutRequestID;

    const { data: enrolment } = await supabase
      .from('Enrolment')
      .select('id')
      .eq('mpesaCheckoutRequestId', checkoutRequestId)
      .maybeSingle();

    if (enrolment) {
      await processEnrolmentPayment(enrolment.id, receipt, cbAmount, cbPhone, checkoutRequestId);
    } else {
      const { data: trainer } = await supabase
        .from('Trainer')
        .select('id')
        .eq('mpesaCheckoutRequestId', checkoutRequestId)
        .maybeSingle();

      if (trainer) {
        await processVerificationPayment(trainer.id, receipt, cbAmount);
      } else {
        console.warn(`[mpesa-callback:${requestId}] No enrolment or trainer found for checkoutRequestId: ${checkoutRequestId}`);
      }
    }

    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Success' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[mpesa-callback:${requestId}] Unhandled error:`, err instanceof Error ? err.stack || err.message : err);
    return new Response(
      JSON.stringify({ ResultCode: 1, ResultDesc: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
