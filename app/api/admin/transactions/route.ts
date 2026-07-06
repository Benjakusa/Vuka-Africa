import { NextRequest } from 'next/server';
import * as adminService from '@backend/services/admin.service';
import { authenticate, requireRole } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    requireRole('ADMIN')(auth);

    const url = new URL(req.url);
    const filters = {
      type: url.searchParams.get('type') || undefined,
      userId: url.searchParams.get('userId') || undefined,
      from: url.searchParams.get('from') || undefined,
      to: url.searchParams.get('to') || undefined,
      page: Math.max(1, Number(url.searchParams.get('page')) || 1),
      perPage: Math.min(200, Math.max(1, Number(url.searchParams.get('perPage')) || 50)),
    };

    const result = await adminService.listTransactions(filters);
    return success(result);
  } catch (err) { return handleError(err); }
}
