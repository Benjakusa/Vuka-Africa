import { NextRequest } from 'next/server';
import * as payoutService from '@backend/services/payout.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('perPage')) || 20));

    const result = await payoutService.getPayoutHistory(auth.id, page, perPage);
    return success(result);
  } catch (err) { return handleError(err); }
}
