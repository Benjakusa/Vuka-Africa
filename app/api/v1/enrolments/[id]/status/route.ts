import { NextRequest } from 'next/server';
import { authenticate } from '@backend/middleware/auth';
import { getEnrolmentStatus } from '@backend/services/enrolment.service';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticate(req);
    const enrolment = await getEnrolmentStatus(params.id, auth.id);
    return success(enrolment);
  } catch (err) {
    return handleError(err);
  }
}
