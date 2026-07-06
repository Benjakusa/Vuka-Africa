import { NextRequest } from 'next/server';
import * as courseService from '@backend/services/course.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';
import { NotFoundError } from '@backend/lib/errors';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    const admin = createAdminClient();
    const { data: trainer } = await admin
      .from('Trainer')
      .select('id')
      .eq('userId', auth.id)
      .single();
    if (!trainer) throw new NotFoundError('Trainer');

    const url = new URL(req.url);
    const includeUnpublished = url.searchParams.get('all') === 'true';

    const courses = await courseService.getTrainerCourses(trainer.id, includeUnpublished);
    return success(courses);
  } catch (err) { return handleError(err); }
}
