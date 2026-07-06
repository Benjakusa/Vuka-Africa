import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as payoutService from '@backend/services/payout.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';
import { ValidationError } from '@backend/lib/errors';

const requestSchema = z.object({
  amount: z.number().positive(),
  phone: z.string().regex(/^\+254\d{9}$/),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);

    let body;
    try { body = await req.json(); } catch { throw new ValidationError('Invalid JSON body'); }
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const payout = await payoutService.requestPayout({
      userId: auth.id,
      amount: parsed.data.amount,
      phone: parsed.data.phone,
      code: parsed.data.code,
    });

    return success(payout);
  } catch (err) { return handleError(err); }
}
