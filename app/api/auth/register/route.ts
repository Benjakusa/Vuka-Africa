import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleError } from '@frontend/utils/error-handler';
import { ValidationError, ConflictError } from '@backend/lib/errors';

export async function POST(req: NextRequest) {
  try {
    let body;
    try { body = await req.json(); } catch { throw new ValidationError('Invalid JSON body'); }

    const { email, password, phone, fullName, role } = body;

    if (!email || !password || !phone || !fullName) {
      throw new ValidationError('All fields are required');
    }
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const admin = createAdminClient();
    const { data: existingEmail } = await admin
      .from('User')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    if (existingEmail) throw new ConflictError('Email already registered');

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role,
        },
      },
    });

    if (authError || !data.user) {
      throw new ValidationError(authError?.message || 'Registration failed');
    }

    const supabaseUser = data.user;

    const { data: user, error: createError } = await admin
      .from('User')
      .insert({
        id: supabaseUser.id,
        email: supabaseUser.email!,
        phone: phone.replace(/[^0-9]/g, ''),
        fullName: fullName.trim(),
        role: role || 'TRAINEE',
        lastLoginAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError || !user) throw new Error('Failed to create user record');

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
