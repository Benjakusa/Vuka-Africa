import { NextRequest, NextResponse } from 'next/server';
import * as authService from '@backend/services/auth.service';
import { handleError } from '@frontend/utils/error-handler';
import { AuthenticationError } from '@backend/lib/errors';
import { env } from '@backend/lib/env';

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie');
    let refreshToken: string | undefined;

    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => c.trim().split('=').map(decodeURIComponent))
      );
      refreshToken = cookies['refresh_token'];
    }

    if (!refreshToken) {
      throw new AuthenticationError('No refresh token provided');
    }

    const result = await authService.refresh(refreshToken);

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
