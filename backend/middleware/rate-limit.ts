import { NextRequest } from 'next/server';
import { redis } from '@backend/lib/redis';
import { RateLimitError } from '@backend/lib/errors';

interface RateLimitConfig {
  max: number;
  windowMs: number;
  message?: string;
}

const defaultConfig: RateLimitConfig = {
  max: 100,
  windowMs: 60000,
};

export async function rateLimit(
  req: NextRequest,
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<void> {
  const cfg = { ...defaultConfig, ...config };
  const key = `ratelimit:${identifier}`;

  const current = await redis.get(key);
  const currentCount = current ? parseInt(current, 10) : 0;

  if (currentCount >= cfg.max) {
    const ttl = await redis.ttl(key);
    throw new RateLimitError(ttl > 0 ? ttl : cfg.windowMs / 1000);
  }

  if (currentCount === 0) {
    await redis.setex(key, Math.ceil(cfg.windowMs / 1000), '1');
  } else {
    await redis.incr(key);
  }
}

export function getIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export async function rateLimitByIp(
  req: NextRequest,
  prefix: string,
  config?: Partial<RateLimitConfig>
): Promise<void> {
  const ip = getIp(req);
  await rateLimit(req, `${prefix}:ip:${ip}`, config);
}

export async function rateLimitByUser(
  req: NextRequest,
  userId: string,
  prefix: string,
  config?: Partial<RateLimitConfig>
): Promise<void> {
  await rateLimit(req, `${prefix}:user:${userId}`, config);
}

export async function rateLimitByEmail(
  req: NextRequest,
  email: string,
  prefix: string,
  config?: Partial<RateLimitConfig>
): Promise<void> {
  const hashed = Buffer.from(email.toLowerCase()).toString('base64');
  await rateLimit(req, `${prefix}:email:${hashed}`, config);
}
