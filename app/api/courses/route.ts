import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as courseService from '@backend/services/course.service';
import { authenticate, requireRole } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { created, success } from '@backend/lib/api-response';
import { ValidationError } from '@backend/lib/errors';
import { createAdminClient } from '@/lib/supabase/admin';

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  learningOutcomes: z.array(z.string().min(3)).min(1),
  category: z.string().min(2),
  mode: z.enum(['PHYSICAL', 'VIRTUAL', 'HYBRID']),
  duration: z.string().min(1),
  sessionCount: z.number().int().positive(),
  priceKes: z.number().positive(),
  maxStudents: z.number().int().positive().optional(),
  location: z.string().optional(),
  prerequisites: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    requireRole('TRAINER')(auth);

    let body;
    try { body = await req.json(); } catch { throw new ValidationError('Invalid JSON body'); }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const admin = createAdminClient();
    const { data: trainer } = await admin
      .from('Trainer')
      .select('id')
      .eq('userId', auth.id)
      .single();
    if (!trainer) throw new ValidationError('Trainer profile not found');

    const course = await courseService.createCourse({
      trainerId: trainer.id,
      ...parsed.data,
    });

    return created(course);
  } catch (err) { return handleError(err); }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const filters = {
      search: url.searchParams.get('search') || undefined,
      category: url.searchParams.get('category') || undefined,
      mode: url.searchParams.get('mode') || undefined,
      minPrice: url.searchParams.get('minPrice') ? Number(url.searchParams.get('minPrice')) : undefined,
      maxPrice: url.searchParams.get('maxPrice') ? Number(url.searchParams.get('maxPrice')) : undefined,
      sortBy: url.searchParams.get('sortBy') || 'newest',
      page: Math.max(1, Number(url.searchParams.get('page')) || 1),
      perPage: Math.min(100, Math.max(1, Number(url.searchParams.get('perPage')) || 20)),
    };

    const result = await courseService.listCourses(filters);
    return success(result);
  } catch (err) { return handleError(err); }
}
