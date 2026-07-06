import { NextRequest, NextResponse } from 'next/server';
import * as authService from '@backend/services/auth.service';
import { authenticate } from '@backend/middleware/auth';
import { handleError } from '@frontend/utils/error-handler';
import { env } from '@backend/lib/env';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);

    const cookieHeader = req.headers.get('cookie');
    let refreshToken: string | undefined;
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => c.trim().split('=').map(decodeURIComponent))
      );
      refreshToken = cookies['refresh_token'];
    }

    await authService.logout(user.id, refreshToken);

    const response = NextResponse.json({ data: { message: 'Logged out successfully' } }, { status: 200 });

    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 0,
    });

    return response;
  } catch (err) {
    return handleError(err);
  }
}
