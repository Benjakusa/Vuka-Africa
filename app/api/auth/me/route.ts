import { NextRequest } from 'next/server';
import * as authService from '@backend/services/auth.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const result = await authService.getCurrentUser(user.id);
    return success(result);
  } catch (err) {
    return handleError(err);
  }
}
