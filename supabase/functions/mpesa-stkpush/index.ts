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
    method: 'POST',
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[mpesa-stkpush] OAuth failed: ${res.status} ${body}`);
    throw new Error(`M-Pesa authentication failed (HTTP ${res.status}): ${body}`);
  }

  const data = await res.json();
  const token = data.access_token;
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

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[mpesa-stkpush:${requestId}] Request received`);

  const cors = handleCors(req);
  if (cors) return cors;

  try {
    let body: StkPushRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
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

    console.log(`[mpesa-stkpush:${requestId}] Sending STK push request to ${BASE_URL}/mpesa/stkpush/v3/simulate`);

    const stkRes = await fetch(`${BASE_URL}/mpesa/stkpush/v3/simulate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    let stkData: Record<string, unknown>;
    try {
      stkData = await stkRes.json();
    } catch {
      const text = await stkRes.text();
      console.error(`[mpesa-stkpush:${requestId}] STK push non-JSON response: ${stkRes.status} ${text}`);
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
