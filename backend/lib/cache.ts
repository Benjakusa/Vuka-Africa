import { redis } from './redis';
import { CACHE } from './config';

export const CacheKeys = {
  mpesaToken: () => 'mpesa:access_token',
  trainerList: (hash: string) => `trainers:list:${hash}`,
  trainerProfile: (id: string) => `trainer:${id}:profile`,
  courseList: (hash: string) => `courses:list:${hash}`,
  courseDetail: (slug: string) => `course:${slug}`,
  userBlocklist: (jti: string) => `token:blacklist:${jti}`,
  tokenVersion: (userId: string) => `token:version:${userId}`,
  payout2fa: (trainerId: string, payoutId: string) => `payout:code:${trainerId}:${payoutId}`,
  payout2faAttempts: (trainerId: string) => `payout:2fa:attempts:${trainerId}`,
  csrfToken: () => 'csrf-token',
  idempotent: (prefix: string, key: string) => `idempotent:${prefix}:${key}`,
  mpesaReceipt: (receipt: string) => `mpesa:receipt:${receipt}`,
  b2cConversation: (convId: string) => `mpesa:b2c:${convId}`,
};

export const CachePatterns = {
  trainerListAll: 'trainers:list:*',
  trainerProfile: (id: string) => `trainer:${id}:profile`,
  courseListAll: 'courses:list:*',
  courseDetail: (slug: string) => `course:${slug}`,
};

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setCached(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    console.error(`[Cache] set error for key ${key}:`, err);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Cache] invalidated ${keys.length} keys matching ${pattern}`);
    }
  } catch (err) {
    console.error(`[Cache] invalidation error for pattern ${pattern}:`, err);
  }
}

/**
 * Invalidates all trainer-related cache entries.
 * Call on trainer profile update, new course, etc.
 */
export async function invalidateTrainerCache(trainerId: string): Promise<void> {
  await Promise.all([
    invalidateCache(CachePatterns.trainerListAll),
    invalidateCache(CachePatterns.trainerProfile(trainerId)),
  ]);
}

/**
 * Invalidates all course-related cache entries.
 */
export async function invalidateCourseCache(slug?: string): Promise<void> {
  const tasks = [invalidateCache(CachePatterns.courseListAll)];
  if (slug) tasks.push(invalidateCache(CachePatterns.courseDetail(slug)));
  await Promise.all(tasks);
}
