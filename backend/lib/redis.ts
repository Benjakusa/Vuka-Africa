import Redis from 'ioredis';
import { env } from './env';

function createRedisInstance(): Redis {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    retryStrategy: (times: number) => {
      if (times > 10) return null;
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('error', (err: Error) => {
    console.error('Redis connection error:', err.message);
  });

  return redis;
}

export const redis = createRedisInstance();

export const redisConnection = {
  connection: redis,
};

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCached(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch (err) {
    console.error('Cache set error:', err);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('Cache invalidation error:', err);
  }
}
