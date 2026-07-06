import { NextRequest } from 'next/server';
import * as adminService from '@backend/services/admin.service';
import { authenticate, requireRole } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    requireRole('ADMIN')(auth);

    const stats = await adminService.getStats();
    return success(stats);
  } catch (err) { return handleError(err); }
}
