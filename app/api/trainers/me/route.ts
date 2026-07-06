import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as trainerService from '@backend/services/trainer.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';
import { ValidationError } from '@backend/lib/errors';

const updateSchema = z.object({
  bio: z.string().max(2000).optional(),
  skills: z.array(z.string().max(50)).optional(),
  idDocumentUrl: z.string().url().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    let body;
    try { body = await req.json(); } catch { throw new ValidationError('Invalid JSON body'); }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const trainer = await trainerService.updateProfile(auth.id, parsed.data);
    return success(trainer);
  } catch (err) { return handleError(err); }
}
