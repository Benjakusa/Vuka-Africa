import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as reviewService from '@backend/services/review.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { created } from '@backend/lib/api-response';
import { ValidationError } from '@backend/lib/errors';

const createSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticate(req);

    let body;
    try { body = await req.json(); } catch { throw new ValidationError('Invalid JSON body'); }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const review = await reviewService.createReview({
      id: params.id,
      userId: auth.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    return created(review);
  } catch (err) { return handleError(err); }
}
