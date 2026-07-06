import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as courseService from '@backend/services/course.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';
import { ValidationError } from '@backend/lib/errors';

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  learningOutcomes: z.array(z.string().min(3)).optional(),
  category: z.string().min(2).optional(),
  mode: z.enum(['PHYSICAL', 'VIRTUAL', 'HYBRID']).optional(),
  duration: z.string().optional(),
  sessionCount: z.number().int().positive().optional(),
  priceKes: z.number().positive().optional(),
  maxStudents: z.number().int().positive().optional(),
  location: z.string().optional(),
  prerequisites: z.string().optional(),
  imageUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const course = await courseService.getCourseBySlug(params.slug);
    return success(course);
  } catch (err) { return handleError(err); }
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const auth = await authenticate(req);
    let body;
    try { body = await req.json(); } catch { throw new ValidationError('Invalid JSON body'); }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const course = await courseService.updateCourse(params.slug, auth.id, parsed.data);
    return success(course);
  } catch (err) { return handleError(err); }
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const auth = await authenticate(req);
    await courseService.softDeleteCourse(params.slug, auth.id);
    return success({ message: 'Course deleted' });
  } catch (err) { return handleError(err); }
}
