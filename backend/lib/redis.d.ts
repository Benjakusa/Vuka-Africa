import Redis from 'ioredis';
export declare const redis: Redis;
export declare const redisConnection: {
    connection: Redis;
};
export declare function getCached<T>(key: string): Promise<T | null>;
export declare function setCached(key: string, data: unknown, ttlSeconds: number): Promise<void>;
export declare function invalidateCache(pattern: string): Promise<void>;
