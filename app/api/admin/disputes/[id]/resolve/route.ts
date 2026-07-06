import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as adminService from '@backend/services/admin.service';
import { authenticate, requireRole } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';
import { ValidationError } from '@backend/lib/errors';

const resolveSchema = z.object({
  resolution: z.enum(['release_to_trainer', 'refund_to_trainee', 'split_50']),
  notes: z.string().max(2000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticate(req);
    requireRole('ADMIN')(auth);

    let body;
    try { body = await req.json(); } catch { throw new ValidationError('Invalid JSON body'); }
    const parsed = resolveSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    await adminService.resolveDispute(
      params.id,
      auth.id,
      parsed.data.resolution,
      parsed.data.notes
    );

    return success({ message: 'Dispute resolved' });
  } catch (err) { return handleError(err); }
}
