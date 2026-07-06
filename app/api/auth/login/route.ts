import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@backend/lib/prisma';
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

    let dbUser = await prisma.user.findUnique({ where: { id: supabaseUser.id } });

    if (!dbUser) {
      const metadata = supabaseUser.user_metadata || {};
      dbUser = await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          phone: metadata.phone || '',
          fullName: metadata.full_name || supabaseUser.email!.split('@')[0],
          role: metadata.role || 'TRAINEE',
          lastLoginAt: new Date(),
        },
      });
    } else {
      dbUser = await prisma.user.update({
        where: { id: supabaseUser.id },
        data: { lastLoginAt: new Date() },
      });
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
