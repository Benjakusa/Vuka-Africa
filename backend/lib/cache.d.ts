export declare const CacheKeys: {
    mpesaToken: () => string;
    trainerList: (hash: string) => string;
    trainerProfile: (id: string) => string;
    courseList: (hash: string) => string;
    courseDetail: (slug: string) => string;
    userBlocklist: (jti: string) => string;
    tokenVersion: (userId: string) => string;
    payout2fa: (trainerId: string, payoutId: string) => string;
    payout2faAttempts: (trainerId: string) => string;
    csrfToken: () => string;
    idempotent: (prefix: string, key: string) => string;
    mpesaReceipt: (receipt: string) => string;
    b2cConversation: (convId: string) => string;
};
export declare const CachePatterns: {
    trainerListAll: string;
    trainerProfile: (id: string) => string;
    courseListAll: string;
    courseDetail: (slug: string) => string;
};
export declare function getCached<T>(key: string): Promise<T | null>;
export declare function setCached(key: string, data: unknown, ttlSeconds: number): Promise<void>;
export declare function invalidateCache(pattern: string): Promise<void>;
/**
 * Invalidates all trainer-related cache entries.
 * Call on trainer profile update, new course, etc.
 */
export declare function invalidateTrainerCache(trainerId: string): Promise<void>;
/**
 * Invalidates all course-related cache entries.
 */
export declare function invalidateCourseCache(slug?: string): Promise<void>;
