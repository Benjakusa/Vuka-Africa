import { NextRequest } from 'next/server';
import * as payoutService from '@backend/services/payout.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    const result = await payoutService.request2fa(auth.id);
    return success(result);
  } catch (err) { return handleError(err); }
}
