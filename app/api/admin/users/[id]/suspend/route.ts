import { NextRequest } from 'next/server';
import * as adminService from '@backend/services/admin.service';
import { authenticate, requireRole } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticate(req);
    requireRole('ADMIN')(auth);

    await adminService.suspendUser(params.id);
    return success({ message: 'User suspended' });
  } catch (err) { return handleError(err); }
}
