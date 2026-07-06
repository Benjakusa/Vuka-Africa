import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as adminService from '@backend/services/admin.service';
import { authenticate, requireRole } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';
import { ValidationError } from '@backend/lib/errors';

const rejectSchema = z.object({
  reason: z.string().min(1).max(2000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { trainerId: string } }
) {
  try {
    const auth = await authenticate(req);
    requireRole('ADMIN')(auth);

    let body;
    try { body = await req.json(); } catch { throw new ValidationError('Invalid JSON body'); }
    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    await adminService.rejectVerification(params.trainerId, auth.id, parsed.data.reason);
    return success({ message: 'Verification rejected' });
  } catch (err) { return handleError(err); }
}
