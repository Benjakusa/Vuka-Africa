import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleError } from '@frontend/utils/error-handler';
import { AuthenticationError, NotFoundError } from '@backend/lib/errors';

export async function GET(_req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      throw new AuthenticationError('Not authenticated');
    }

    const admin = createAdminClient();

    const { data: dbUser, error: dbError } = await admin
      .from('User')
      .select(`
        *,
        trainer:Trainer(
          id,
          isVerified,
          verificationStatus,
          commissionRate,
          availableBalance,
          bio,
          skills
        )
      `)
      .eq('id', supabaseUser.id)
      .single();

    if (dbError || !dbUser) {
      throw new NotFoundError('User');
    }

    return NextResponse.json({ data: dbUser });
  } catch (err) {
    return handleError(err);
  }
}
