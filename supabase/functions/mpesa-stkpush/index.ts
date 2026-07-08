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

const CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY')!;
const CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET')!;
const PASSKEY = Deno.env.get('MPESA_PASSKEY')!;
const SHORTCODE = Deno.env.get('MPESA_SHORTCODE')!;
const CALLBACK_URL = Deno.env.get('MPESA_CALLBACK_URL')!;
const IS_SANDBOX = Deno.env.get('MPESA_ENV') === 'sandbox';
const BASE_URL = IS_SANDBOX ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`M-Pesa auth failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const token = data.access_token;
  const expiresIn = (data.expires_in || 3599) - 60;
  cachedToken = { token, expiresAt: Date.now() + expiresIn * 1000 };
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
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const body: StkPushRequest = await req.json();

    if (!body.phone || !body.amount || !body.reference) {
      return new Response(JSON.stringify({ error: 'Missing required fields: phone, amount, reference' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);
    const phone = formatPhone(body.phone);

    const stkRes = await fetch(`${BASE_URL}/mpesa/stkpush/v3/simulate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(body.amount),
        PartyA: phone,
        PartyB: SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: CALLBACK_URL,
        AccountReference: body.reference.slice(0, 12),
        TransactionDesc: (body.description || 'Payment').slice(0, 13),
      }),
    });

    const data = await stkRes.json();

    if (!stkRes.ok) {
      throw new Error(data.errorMessage || `STK push failed: ${stkRes.status}`);
    }

    const checkoutRequestId = data.CheckoutRequestID;

    if (checkoutRequestId && body.enrolmentId) {
      await supabase.from('Enrolment').update({ mpesaCheckoutRequestId: checkoutRequestId }).eq('id', body.enrolmentId);
    }

    return new Response(
      JSON.stringify({
        MerchantRequestID: data.MerchantRequestID,
        CheckoutRequestID: checkoutRequestId,
        ResponseCode: data.ResponseCode,
        ResponseDescription: data.ResponseDescription,
        CustomerMessage: data.CustomerMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
