import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as disputeService from '@backend/services/dispute.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { created, success } from '@backend/lib/api-response';
import { ValidationError } from '@backend/lib/errors';

const createSchema = z.object({
  reason: z.string().min(10).max(2000),
  milestoneId: z.string().uuid().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticate(req);

    let body;
    try { body = await req.json(); } catch { throw new ValidationError('Invalid JSON body'); }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const dispute = await disputeService.raiseDispute({
      id: params.id,
      userId: auth.id,
      reason: parsed.data.reason,
      milestoneId: parsed.data.milestoneId,
    });

    return created(dispute);
  } catch (err) { return handleError(err); }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticate(req);
    const disputes = await disputeService.getDisputesForEnrolment(params.id, auth.id);
    return success(disputes);
  } catch (err) { return handleError(err); }
}
