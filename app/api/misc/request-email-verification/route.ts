import { NextRequest } from 'next/server';
import * as authService from '@backend/services/auth.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    const result = await authService.requestEmailVerification(auth.id);
    return success(result);
  } catch (err) { return handleError(err); }
}
