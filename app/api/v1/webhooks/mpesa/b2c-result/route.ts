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
      console.warn(`[M-Pesa] Rejected B2C callback from unauthorized IP: ${ip}`);
      return new Response('Unauthorized IP', { status: 403 });
    }

    const bodyText = await req.text();
    const signature = req.headers.get('x-mpesa-signature') || '';

    if (!mpesaClient.validateCallbackSignature(bodyText, signature)) {
      console.warn('[M-Pesa] Invalid HMAC signature on B2C callback');
      return new Response('Invalid signature', { status: 403 });
    }

    const body = JSON.parse(bodyText);
    const callback = mpesaClient.parseB2cCallback(body);

    if (!callback) {
      console.error('[M-Pesa] Failed to parse B2C callback body');
      return new Response('Invalid callback body', { status: 400 });
    }

    console.log(`[M-Pesa] B2C callback: resultCode=${callback.resultCode}, conversationId=${callback.conversationId}, transactionId=${callback.transactionId}`);

    const alreadyProcessed = await checkAndMarkIdempotent(
      'mpesa:b2c',
      callback.conversationId
    );
    if (alreadyProcessed) {
      console.log(`[M-Pesa] Duplicate B2C callback for conversation ${callback.conversationId}, acknowledging`);
      return new Response('Already processed', { status: 200 });
    }

    try {
      await addMpesaCallbackJob({
        type: 'process-b2c-result',
        data: {
          resultCode: callback.resultCode,
          resultDesc: callback.resultDesc,
          originatorConversationId: callback.originatorConversationId,
          conversationId: callback.conversationId,
          transactionId: callback.transactionId,
          receiverPartyPublicName: callback.receiverPartyPublicName || '',
          transactionAmount: callback.transactionAmount || '',
          transactionDate: callback.transactionDate || '',
          rawCallback: body,
        },
      });
    } catch (jobErr) {
      await removeIdempotencyKey('mpesa:b2c', callback.conversationId).catch(() => {});
      throw jobErr;
    }

    return new Response('Accepted', { status: 200 });
  } catch (err) {
    console.error('[M-Pesa] Error processing B2C callback:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
