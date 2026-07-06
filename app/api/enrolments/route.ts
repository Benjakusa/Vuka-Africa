import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as enrolmentService from '@backend/services/enrolment.service';
import { authenticate, requireRole } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { created, success } from '@backend/lib/api-response';
import { ValidationError } from '@backend/lib/errors';

const createSchema = z.object({
  courseId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    requireRole('TRAINEE')(auth);

    let body;
    try { body = await req.json(); } catch { throw new ValidationError('Invalid JSON body'); }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const result = await enrolmentService.createEnrolment({
      traineeId: auth.id,
      courseId: parsed.data.courseId,
    });

    return created(result);
  } catch (err) { return handleError(err); }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('perPage')) || 20));

    const role = auth.role === 'TRAINER' ? 'TRAINER' : 'TRAINEE';
    const result = await enrolmentService.listUserEnrolments(auth.id, role, status, page, perPage);
    return success(result);
  } catch (err) { return handleError(err); }
}
