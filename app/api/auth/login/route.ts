import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleError } from '@frontend/utils/error-handler';
import { ValidationError, AuthenticationError } from '@backend/lib/errors';

export async function POST(req: NextRequest) {
  try {
    let body;
    try { body = await req.json(); } catch { throw new ValidationError('Invalid JSON body'); }

    const { email, password } = body;
    if (!email || !password) throw new ValidationError('Email and password required');

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      throw new AuthenticationError(authError?.message || 'Invalid email or password');
    }

    const supabaseUser = data.user;
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from('User')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    let dbUser;
    if (!existing) {
      const metadata = supabaseUser.user_metadata || {};
      const { data: created, error: createError } = await admin
        .from('User')
        .insert({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          phone: metadata.phone || '',
          fullName: metadata.full_name || supabaseUser.email!.split('@')[0],
          role: metadata.role || 'TRAINEE',
          lastLoginAt: new Date().toISOString(),
        })
        .select()
        .single();
      if (createError || !created) throw new Error('Failed to create user');
      dbUser = created;
    } else {
      const { data: updated, error: updateError } = await admin
        .from('User')
        .update({ lastLoginAt: new Date().toISOString() })
        .eq('id', supabaseUser.id)
        .select()
        .single();
      if (updateError || !updated) throw new Error('Failed to update user');
      dbUser = updated;
    }

    return NextResponse.json({
      data: {
        id: dbUser.id,
        email: dbUser.email,
        phone: dbUser.phone,
        fullName: dbUser.fullName,
        role: dbUser.role,
        avatarUrl: dbUser.avatarUrl,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
