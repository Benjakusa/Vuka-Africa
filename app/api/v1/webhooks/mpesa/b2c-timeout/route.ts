import { NextRequest } from 'next/server';
import { getIp } from '@backend/middleware/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    console.log('[M-Pesa] B2C timeout callback received', bodyText.slice(0, 500));
    return new Response('Accepted', { status: 200 });
  } catch (err) {
    console.error('[M-Pesa] Error processing B2C timeout:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
