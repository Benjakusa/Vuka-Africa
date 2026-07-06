import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { success } from '@backend/lib/api-response';
import { ValidationError, NotFoundError } from '@backend/lib/errors';

const updateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  phone: z.string().regex(/^\+254\d{9}$/).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from('User')
      .select(`
        *,
        trainer:Trainer(
          id,
          bio,
          skills,
          isVerified,
          verificationStatus,
          commissionRate,
          availableBalance,
          averageRating,
          totalReviews,
          totalStudents
        )
      `)
      .eq('id', user.id)
      .single();
    if (error || !profile) throw new NotFoundError('User');
    return success(profile);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await authenticate(req);

    let body;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Invalid JSON body');
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map(i => ({
        path: i.path.join('.'),
        message: i.message,
      })));
    }

    const admin = createAdminClient();
    const { data: updated, error: updateError } = await admin
      .from('User')
      .update(parsed.data)
      .eq('id', auth.id)
      .select()
      .single();

    if (updateError || !updated) throw new Error('Failed to update user');

    return success(updated);
  } catch (err) {
    return handleError(err);
  }
}
