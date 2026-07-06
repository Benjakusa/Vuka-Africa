import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@frontend/utils/error-handler';

export async function POST(_req: NextRequest) {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ data: { message: 'Logged out successfully' } });
  } catch (err) {
    return handleError(err);
  }
}
