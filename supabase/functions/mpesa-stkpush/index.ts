import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

interface StkPushRequest {
  phone: string;
  amount: number;
  reference: string;
  description: string;
  enrolmentId?: string;
  trainerId?: string;
}

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

const CONSUMER_KEY = requireEnv('MPESA_CONSUMER_KEY');
const CONSUMER_SECRET = requireEnv('MPESA_CONSUMER_SECRET');
const PASSKEY = requireEnv('MPESA_PASSKEY');
const SHORTCODE = requireEnv('MPESA_SHORTCODE');
const CALLBACK_URL = requireEnv('MPESA_CALLBACK_URL');

const IS_SANDBOX = Deno.env.get('MPESA_ENV') === 'sandbox';
const BASE_URL = IS_SANDBOX ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    console.log('[mpesa-stkpush] Using cached token');
    return cachedToken.token;
  }

  console.log('[mpesa-stkpush] Requesting OAuth token from M-Pesa');
  const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[mpesa-stkpush] OAuth failed: ${res.status} ${body}`);
    throw new Error(`M-Pesa authentication failed (HTTP ${res.status}): ${body}`);
  }

  const resText = await res.text();
  if (!resText) {
    throw new Error('M-Pesa OAuth returned empty response body');
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(resText);
  } catch {
    throw new Error(`M-Pesa OAuth returned non-JSON response: ${resText.slice(0, 200)}`);
  }

  const token = data.access_token as string | undefined;
  if (!token) {
    throw new Error(`M-Pesa OAuth response missing access_token: ${JSON.stringify(data)}`);
  }
  const expiresIn = (data.expires_in || 3599) - 60;
  cachedToken = { token, expiresAt: Date.now() + expiresIn * 1000 };
  console.log('[mpesa-stkpush] OAuth token obtained successfully');
  return token;
}

function getTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}${h}${min}${s}`;
}

function generatePassword(timestamp: string): string {
  return btoa(SHORTCODE + PASSKEY + timestamp);
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) return '254' + cleaned.slice(1);
  if (cleaned.startsWith('254')) return cleaned;
  return '254' + cleaned;
}

async function processEnrolmentPayment(
  enrolmentId: string,
  receipt: string,
  checkoutRequestId: string,
) {
  console.log(`[mpesa-stkpush] Auto-processing enrolment payment for ${enrolmentId}, receipt: ${receipt}`);

  const { data: enrolment, error: fetchError } = await supabase
    .from('Enrolment')
    .select('*, course:Course(title), trainer:Trainer!trainerId(user:User!userId(email, fullName)), trainee:User!traineeId(email, fullName)')
    .eq('id', enrolmentId)
    .maybeSingle();

  if (fetchError || !enrolment) {
    console.error(`[mpesa-stkpush] Enrolment ${enrolmentId} not found:`, fetchError);
    return;
  }

  if (enrolment.status !== 'PENDING_PAYMENT') {
    console.log(`[mpesa-stkpush] Enrolment ${enrolmentId} status is ${enrolment.status}, expected PENDING_PAYMENT`);
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
    console.error(`[mpesa-stkpush] Failed to update enrolment:`, updateError);
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
      console.error(`[mpesa-stkpush] Failed to insert milestone ${m.label}:`, msErr);
    }
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

  console.log(`[mpesa-stkpush] Enrolment ${enrolmentId} auto-processed successfully`);
}

async function processVerificationPayment(trainerId: string, receipt: string, amount: number) {
  console.log(`[mpesa-stkpush] Auto-processing verification payment for trainer ${trainerId}, receipt: ${receipt}`);

  const { data: trainer, error: fetchError } = await supabase
    .from('Trainer')
    .select('*, user:User!userId(email, fullName)')
    .eq('id', trainerId)
    .maybeSingle();

  if (fetchError || !trainer) {
    console.error(`[mpesa-stkpush] Trainer ${trainerId} not found:`, fetchError);
    return;
  }

  if (trainer.verificationFeePaid) {
    console.log(`[mpesa-stkpush] Verification fee already paid for trainer ${trainerId}, skipping`);
    return;
  }

  await supabase
    .from('Trainer')
    .update({
      verificationFeePaid: true,
      verificationFeeAmount: amount,
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

  console.log(`[mpesa-stkpush] Trainer ${trainerId} verification auto-processed successfully`);
}

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[mpesa-stkpush:${requestId}] Request received`);

  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return new Response(
        JSON.stringify({ success: false, error: 'Request body is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let body: StkPushRequest;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[mpesa-stkpush:${requestId}] Parsed request:`, {
      phone: body.phone?.replace(/\d(?=\d{4})/g, '*'),
      amount: body.amount,
      reference: body.reference,
      description: body.description,
      hasEnrolmentId: !!body.enrolmentId,
      hasTrainerId: !!body.trainerId,
    });

    if (!body.phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!body.amount || body.amount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'A valid amount is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!body.reference) {
      return new Response(
        JSON.stringify({ success: false, error: 'Reference is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const token = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);
    const phone = formatPhone(body.phone);

    // ── Idempotency: check for existing pending payment ──
    if (body.enrolmentId) {
      const { data: existing } = await supabase
        .from('Enrolment')
        .select('status')
        .eq('id', body.enrolmentId)
        .maybeSingle();

      if (existing && existing.status !== 'PENDING_PAYMENT') {
        console.log(`[mpesa-stkpush:${requestId}] Enrolment ${body.enrolmentId} already ${existing.status}, skipping`);
        if (existing.status === 'PENDING_ACCEPTANCE') {
          return new Response(
            JSON.stringify({ success: true, alreadyProcessed: true, message: 'Payment already completed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        return new Response(
          JSON.stringify({ success: false, error: `Cannot process payment: enrolment is ${existing.status}` }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    if (!phone.startsWith('254') || phone.length !== 12) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid phone number format: ${phone}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const stkPayload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline' as const,
      Amount: Math.round(body.amount),
      PartyA: phone,
      PartyB: SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: CALLBACK_URL,
      AccountReference: body.reference.slice(0, 12),
      TransactionDesc: (body.description || 'Payment').slice(0, 13),
    };

    console.log(`[mpesa-stkpush:${requestId}] Sending STK push request to ${BASE_URL}/mpesa/stkpush/v1/processrequest`);

    const stkRes = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    const stkRaw = await stkRes.text();
    if (!stkRaw) {
      console.error(`[mpesa-stkpush:${requestId}] STK push returned empty response (HTTP ${stkRes.status})`);
      return new Response(
        JSON.stringify({ success: false, error: `M-Pesa returned empty response (HTTP ${stkRes.status})` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let stkData: Record<string, unknown>;
    try {
      stkData = JSON.parse(stkRaw);
    } catch {
      console.error(`[mpesa-stkpush:${requestId}] STK push non-JSON response: ${stkRes.status} ${stkRaw.slice(0, 500)}`);
      return new Response(
        JSON.stringify({ success: false, error: `M-Pesa returned non-JSON response (HTTP ${stkRes.status})` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[mpesa-stkpush:${requestId}] STK push response:`, stkData);

    if (!stkRes.ok) {
      const errMsg = (stkData?.errorMessage as string) || (stkData?.ResponseDescription as string) || `STK push failed (HTTP ${stkRes.status})`;
      console.error(`[mpesa-stkpush:${requestId}] STK push failed: ${errMsg}`);
      return new Response(
        JSON.stringify({ success: false, error: errMsg, response: stkData }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const checkoutRequestId = stkData.CheckoutRequestID as string | undefined;
    console.log(`[mpesa-stkpush:${requestId}] STK push sent, CheckoutRequestID: ${checkoutRequestId}`);

    if (checkoutRequestId) {
      if (body.enrolmentId) {
        const { error: updateErr } = await supabase
          .from('Enrolment')
          .update({ mpesaCheckoutRequestId: checkoutRequestId })
          .eq('id', body.enrolmentId);
        if (updateErr) {
          console.error(`[mpesa-stkpush:${requestId}] Failed to update enrolment:`, updateErr);
        }
      } else if (body.trainerId) {
        const { error: updateErr } = await supabase
          .from('Trainer')
          .update({ mpesaCheckoutRequestId: checkoutRequestId })
          .eq('id', body.trainerId);
        if (updateErr) {
          console.error(`[mpesa-stkpush:${requestId}] Failed to update trainer:`, updateErr);
        }
      }
    }

    // ── Sandbox auto-confirm ──────────────────────────────────
    // In sandbox mode, the M-Pesa callback won't arrive, so we
    // process the payment immediately so the frontend can proceed.
    if (IS_SANDBOX) {
      console.log(`[mpesa-stkpush:${requestId}] Sandbox mode: auto-processing payment`);
      if (body.enrolmentId) {
        await processEnrolmentPayment(
          body.enrolmentId,
          `SANDBOX-${checkoutRequestId || 'TEST'}`,
          checkoutRequestId || 'SANDBOX-TEST',
        );
      } else if (body.trainerId) {
        await processVerificationPayment(
          body.trainerId,
          `SANDBOX-${checkoutRequestId || 'TEST'}`,
          Math.round(body.amount),
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        MerchantRequestID: stkData.MerchantRequestID,
        CheckoutRequestID: checkoutRequestId,
        ResponseCode: stkData.ResponseCode,
        ResponseDescription: stkData.ResponseDescription,
        CustomerMessage: stkData.CustomerMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[mpesa-stkpush:${requestId}] Unhandled error:`, err instanceof Error ? err.stack || err.message : err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
