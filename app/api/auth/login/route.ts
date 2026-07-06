import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as authService from '@backend/services/auth.service';
import { handleError } from '@frontend/utils/error-handler';
import { ValidationError } from '@backend/lib/errors';
import { env } from '@backend/lib/env';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Invalid JSON body');
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map(i => ({
        path: i.path.join('.'),
        message: i.message,
      })));
    }

    const result = await authService.login(parsed.data);

    const response = NextResponse.json({ data: result }, { status: 200 });

    response.cookies.set('access_token', result.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
    });

    response.cookies.set('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    return handleError(err);
  }
}
