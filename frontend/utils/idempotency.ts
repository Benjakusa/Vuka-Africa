import { v4 as uuidv4 } from 'uuid';
import { redis } from '@backend/lib/redis';
import { IdempotencyError } from '@backend/lib/errors';

export function generateIdempotencyKey(): string {
  return uuidv4();
}

export async function checkIdempotency(key: string, ttlSeconds = 86400): Promise<void> {
  const existing = await redis.get(`idempotency:${key}`);
  if (existing) {
    throw new IdempotencyError();
  }
  await redis.setex(`idempotency:${key}`, ttlSeconds, 'processed');
}

export async function isIdempotent(key: string): Promise<boolean> {
  const existing = await redis.get(`idempotency:${key}`);
  return existing !== null;
}
