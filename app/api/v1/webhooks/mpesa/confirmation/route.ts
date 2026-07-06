import { NextRequest } from 'next/server';
import { mpesaClient } from '@backend/lib/mpesa';
import { checkAndMarkIdempotent, removeIdempotencyKey } from '@backend/lib/idempotency';
import { addMpesaCallbackJob } from '@backend/workers/mpesa-worker';
import { getIp } from '@backend/middleware/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req);
    const forwardedFor = req.headers.get('x-forwarded-for') || undefined;

    if (!mpesaClient.validateCallbackIp(ip, forwardedFor)) {
      console.warn(`[M-Pesa] Rejected STK callback from unauthorized IP: ${ip}`);
      return new Response('Unauthorized IP', { status: 403 });
    }

    const bodyText = await req.text();
    const signature = req.headers.get('x-mpesa-signature') || '';

    if (!mpesaClient.validateCallbackSignature(bodyText, signature)) {
      console.warn('[M-Pesa] Invalid HMAC signature on STK callback');
      return new Response('Invalid signature', { status: 403 });
    }

    const body = JSON.parse(bodyText);
    const callback = mpesaClient.parseStkCallback(body);

    if (!callback) {
      console.error('[M-Pesa] Failed to parse STK callback body');
      return new Response('Invalid callback body', { status: 400 });
    }

    console.log(`[M-Pesa] STK callback: resultCode=${callback.resultCode}, receipt=${callback.mpesaReceiptNumber}, checkout=${callback.checkoutRequestId}`);

    // Check idempotency BEFORE enqueuing to avoid duplicate work
    const receiptKey = callback.mpesaReceiptNumber;
    if (callback.resultCode === 0 && receiptKey) {
      const alreadyProcessed = await checkAndMarkIdempotent(
        'mpesa:stk',
        receiptKey
      );
      if (alreadyProcessed) {
        console.log(`[M-Pesa] Duplicate STK callback for receipt ${receiptKey}, acknowledging`);
        return new Response('Already processed', { status: 200 });
      }
    }

    try {
      await addMpesaCallbackJob({
        type: 'process-stk-callback',
        data: {
          resultCode: callback.resultCode,
          resultDesc: callback.resultDesc,
          mpesaReceiptNumber: callback.mpesaReceiptNumber || null,
          checkoutRequestId: callback.checkoutRequestId,
          merchantRequestId: callback.merchantRequestId,
          amount: callback.amount || 0,
          phoneNumber: callback.phoneNumber || '',
          accountReference: callback.accountReference || '',
          transactionDate: callback.transactionDate || '',
          rawCallback: body,
        },
      });
    } catch (jobErr) {
      // Job enqueue failed — rollback idempotency so Safaricom retry can succeed
      if (callback.resultCode === 0 && receiptKey) {
        await removeIdempotencyKey('mpesa:stk', receiptKey).catch(() => {});
      }
      throw jobErr;
    }

    return new Response('Accepted', { status: 200 });
  } catch (err) {
    console.error('[M-Pesa] Error processing STK callback:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
