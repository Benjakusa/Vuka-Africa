import { NextRequest } from 'next/server';
import { verifyAccessToken, isTokenBlacklisted, getTokenVersion } from '@backend/lib/jwt';
import { AuthenticationError, ForbiddenError, AccountSuspendedError, EmailNotVerifiedError } from '@backend/lib/errors';
import { prisma } from '@backend/lib/prisma';
import { env } from '@backend/lib/env';

export interface AuthUser {
  id: string;
  role: 'TRAINEE' | 'TRAINER' | 'ADMIN';
  emailVerified: boolean;
  isActive: boolean;
}

const PUBLIC_CACHE = new Map<string, { user: AuthUser; expiresAt: number }>();

function getCachedUser(userId: string): AuthUser | null {
  const cached = PUBLIC_CACHE.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }
  PUBLIC_CACHE.delete(userId);
  return null;
}

function setCachedUser(user: AuthUser): void {
  PUBLIC_CACHE.set(user.id, { user, expiresAt: Date.now() + 30000 });
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

function getJtiFromRequest(req: NextRequest): string | null {
  const jti = req.headers.get('x-jti');
  return jti;
}

export async function authenticate(req: NextRequest): Promise<AuthUser> {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new AuthenticationError('No authentication token provided. Use Authorization: Bearer <token>');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err: any) {
    throw new AuthenticationError(err.message);
  }

  if (payload.jti) {
    const blacklisted = await isTokenBlacklisted(payload.jti);
    if (blacklisted) {
      throw new AuthenticationError('Token has been revoked');
    }
  }

  const cached = getCachedUser(payload.userId);
  if (cached) {
    return cached;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, emailVerified: true, isActive: true, suspendedAt: true, suspensionReason: true },
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  if (!user.isActive || user.suspendedAt) {
    throw new AccountSuspendedError(user.suspensionReason || undefined);
  }

  const authUser: AuthUser = {
    id: user.id,
    role: user.role,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
  };

  setCachedUser(authUser);
  return authUser;
}

export function requireRole(...roles: string[]) {
  return (user: AuthUser): void => {
    if (!roles.includes(user.role)) {
      throw new ForbiddenError('Insufficient permissions for this action');
    }
  };
}

export function requireEmailVerified(user: AuthUser): void {
  if (env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.emailVerified) {
    throw new EmailNotVerifiedError();
  }
}

export async function optionalAuth(req: NextRequest): Promise<AuthUser | null> {
  try {
    return await authenticate(req);
  } catch {
    return null;
  }
}

export function getUserId(user: AuthUser): string {
  return user.id;
}

export function isAdmin(user: AuthUser): boolean {
  return user.role === 'ADMIN';
}

export function isTrainer(user: AuthUser): boolean {
  return user.role === 'TRAINER';
}

export function isTrainee(user: AuthUser): boolean {
  return user.role === 'TRAINEE';
}

export function clearAuthCache(userId: string): void {
  PUBLIC_CACHE.delete(userId);
}
