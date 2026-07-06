import { NextRequest } from 'next/server';
import * as courseService from '@backend/services/course.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';
import { prisma } from '@backend/lib/prisma';
import { NotFoundError } from '@backend/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    const trainer = await prisma.trainer.findUnique({ where: { userId: auth.id } });
    if (!trainer) throw new NotFoundError('Trainer');

    const url = new URL(req.url);
    const includeUnpublished = url.searchParams.get('all') === 'true';

    const courses = await courseService.getTrainerCourses(trainer.id, includeUnpublished);
    return success(courses);
  } catch (err) { return handleError(err); }
}
