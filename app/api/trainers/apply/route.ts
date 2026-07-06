import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as trainerService from '@backend/services/trainer.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { created } from '@backend/lib/api-response';
import { ValidationError } from '@backend/lib/errors';

const applySchema = z.object({
  bio: z.string().max(2000).optional(),
  skills: z.array(z.string().max(50)).min(1).default([]),
  idDocumentUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    let body;
    try { body = await req.json(); } catch { throw new ValidationError('Invalid JSON body'); }

    const parsed = applySchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const trainer = await trainerService.apply({
      userId: auth.id,
      ...parsed.data,
    });

    return created(trainer);
  } catch (err) { return handleError(err); }
}
