import { redis } from './redis';

const TTL_30_DAYS = 86400 * 30;

export async function checkAndMarkIdempotent(
  namespace: string,
  key: string,
  ttlSeconds: number = TTL_30_DAYS
): Promise<boolean> {
  const redisKey = `idempotency:${namespace}:${key}`;
  const result = await redis.set(redisKey, 'processed', 'EX', ttlSeconds, 'NX');
  return result !== 'OK';
}

export async function isAlreadyProcessed(namespace: string, key: string): Promise<boolean> {
  const result = await redis.get(`idempotency:${namespace}:${key}`);
  return result === 'processed';
}

export async function removeIdempotencyKey(namespace: string, key: string): Promise<void> {
  await redis.del(`idempotency:${namespace}:${key}`);
}

export function buildStkIdempotencyKey(receiptNumber: string): string {
  return `stk:${receiptNumber}`;
}

export function buildB2cIdempotencyKey(conversationId: string): string {
  return `b2c:${conversationId}`;
}

export function buildPayoutIdempotencyKey(payoutId: string): string {
  return `payout:${payoutId}`;
}

export function buildEnrolmentIdempotencyKey(enrolmentId: string): string {
  return `enrol:${enrolmentId}`;
}

export function buildVerificationIdempotencyKey(trainerId: string): string {
  return `verify:${trainerId}`;
}
