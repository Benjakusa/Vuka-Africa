import { NextRequest } from 'next/server';
import * as enrolmentService from '@backend/services/enrolment.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticate(req);
    const enrolment = await enrolmentService.getEnrolmentDetail(params.id, auth.id);
    return success(enrolment);
  } catch (err) { return handleError(err); }
}