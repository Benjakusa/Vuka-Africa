import { NextRequest } from 'next/server';
import * as milestoneService from '@backend/services/milestone.service';
import { authenticate, requireRole } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; milestoneId: string } }
) {
  try {
    const auth = await authenticate(req);
    requireRole('TRAINER')(auth);

    const milestone = await milestoneService.confirmByTrainer(
      params.milestoneId,
      params.id,
      auth.id
    );

    return success(milestone);
  } catch (err) { return handleError(err); }
}
