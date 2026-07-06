import { NextRequest } from 'next/server';
import { z } from 'zod';
import * as authService from '@backend/services/auth.service';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';
import { ValidationError } from '@backend/lib/errors';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    let body;
    try { body = await req.json(); } catch { throw new ValidationError('Invalid JSON body'); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const result = await authService.resetPassword(parsed.data.token, parsed.data.password);
    return success(result);
  } catch (err) { return handleError(err); }
}
