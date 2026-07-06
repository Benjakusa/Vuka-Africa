import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from './env';
import { redis } from './redis';
import { randomUUID } from 'crypto';

export interface TokenPayload {
  userId: string;
  role: string;
  jti?: string;
}

export interface AccessTokenPayload extends TokenPayload {
  type: 'access';
}

export interface RefreshTokenPayload extends TokenPayload {
  type: 'refresh';
  tokenVersion: number;
}

const ACCESS_TOKEN_OPTIONS: jwt.SignOptions = {
  issuer: env.JWT_ISSUER,
  audience: 'vuka-api',
};

const REFRESH_TOKEN_OPTIONS: jwt.SignOptions = {
  issuer: env.JWT_ISSUER,
  audience: 'vuka-api',
};

export function signAccessToken(payload: TokenPayload): string {
  const jti = randomUUID();
  return jwt.sign(
    { ...payload, type: 'access', jti },
    env.JWT_ACCESS_SECRET,
    { ...ACCESS_TOKEN_OPTIONS, expiresIn: env.JWT_ACCESS_EXPIRY }
  );
}

export function signRefreshToken(payload: TokenPayload & { tokenVersion: number }): string {
  const jti = randomUUID();
  return jwt.sign(
    { ...payload, type: 'refresh', jti },
    env.JWT_REFRESH_SECRET,
    { ...REFRESH_TOKEN_OPTIONS, expiresIn: env.JWT_REFRESH_EXPIRY }
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: 'vuka-api',
    }) as AccessTokenPayload;
    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return payload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    }
    throw new Error('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: 'vuka-api',
    }) as RefreshTokenPayload;
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return payload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    }
    throw new Error('Invalid or expired refresh token');
  }
}

export function parseTokenExpiry(token: string): number | null {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    return decoded?.exp || null;
  } catch {
    return null;
  }
}

export async function storeRefreshToken(userId: string, jti: string, ttlSeconds: number = 7 * 24 * 60 * 60): Promise<void> {
  const key = `refresh:${userId}:${jti}`;
  await redis.setex(key, ttlSeconds, 'valid');
}

export async function validateRefreshToken(userId: string, jti: string): Promise<boolean> {
  const key = `refresh:${userId}:${jti}`;
  const result = await redis.get(key);
  if (result !== 'valid') return false;

  const userTokenVersion = await getTokenVersion(userId);
  if (userTokenVersion === null) return false;

  const payload = jwt.decode(jti) as { tokenVersion?: number } | null;
  if (payload && payload.tokenVersion !== undefined) {
    return payload.tokenVersion === userTokenVersion;
  }

  return true;
}

export async function removeRefreshToken(userId: string, jti: string): Promise<void> {
  const key = `refresh:${userId}:${jti}`;
  await redis.del(key);
}

export async function removeAllRefreshTokens(userId: string): Promise<void> {
  const keys = await redis.keys(`refresh:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export async function blacklistToken(jti: string, expiresAt: number): Promise<void> {
  const ttl = Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
  if (ttl > 0) {
    await redis.setex(`blacklist:${jti}`, ttl, 'revoked');
  }
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const result = await redis.get(`blacklist:${jti}`);
  return result === 'revoked';
}

export async function incrementTokenVersion(userId: string): Promise<number> {
  const key = `token_version:${userId}`;
  const version = await redis.incr(key);
  await redis.expire(key, 30 * 24 * 60 * 60);
  return version;
}

export async function getTokenVersion(userId: string): Promise<number | null> {
  const key = `token_version:${userId}`;
  const version = await redis.get(key);
  return version ? parseInt(version, 10) : null;
}

export async function rotateRefreshToken(oldJti: string, userId: string): Promise<string> {
  await removeRefreshToken(userId, oldJti);
  const jti = randomUUID();
  await storeRefreshToken(userId, jti);
  return jti;
}
