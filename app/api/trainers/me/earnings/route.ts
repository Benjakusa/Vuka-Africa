import { NextRequest } from 'next/server';
import * as payoutService from '@backend/services/payout.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    const summary = await payoutService.getEarningsSummary(auth.id);
    return success(summary);
  } catch (err) { return handleError(err); }
}
