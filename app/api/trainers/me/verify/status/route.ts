import { NextRequest } from 'next/server';
import * as trainerService from '@backend/services/trainer.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    const result = await trainerService.getVerificationStatus(auth.id);
    return success(result);
  } catch (err) { return handleError(err); }
}
