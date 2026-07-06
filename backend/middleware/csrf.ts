import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual, randomBytes } from 'crypto';
import { env } from '@backend/lib/env';
import { redis } from '@backend/lib/redis';
import { CsrfError } from '@backend/lib/errors';

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf-token';

export function generateCsrfToken(userId: string): string {
  const raw = `${userId}:${randomBytes(16).toString('hex')}:${Date.now()}`;
  const hmac = createHmac('sha256', env.CSRF_SECRET || 'csrf-secret-change-in-prod')
    .update(raw)
    .digest('hex');
  return `${userId}.${hmac}`;
}

export async function storeCsrfToken(userId: string, token: string): Promise<void> {
  await redis.setex(`csrf:${userId}`, 24 * 60 * 60, token);
}

export async function validateCsrfToken(
  req: NextRequest,
  userId: string,
  method: string
): Promise<void> {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(method.toUpperCase())) {
    return;
  }

  const headerToken = req.headers.get(CSRF_HEADER);
  if (!headerToken) {
    throw new CsrfError();
  }

  const stored = await redis.get(`csrf:${userId}`);
  if (!stored) {
    throw new CsrfError();
  }

  const storedBuf = Buffer.from(stored);
  const headerBuf = Buffer.from(headerToken);
  if (storedBuf.length !== headerBuf.length) {
    throw new CsrfError();
  }

  if (!timingSafeEqual(storedBuf, headerBuf)) {
    throw new CsrfError();
  }
}

export function getCsrfCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict';
  path: string;
} {
  return {
    httpOnly: false,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  };
}
