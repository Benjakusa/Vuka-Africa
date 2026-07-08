export declare function checkAndMarkIdempotent(namespace: string, key: string, ttlSeconds?: number): Promise<boolean>;
export declare function isAlreadyProcessed(namespace: string, key: string): Promise<boolean>;
export declare function removeIdempotencyKey(namespace: string, key: string): Promise<void>;
export declare function buildStkIdempotencyKey(receiptNumber: string): string;
export declare function buildB2cIdempotencyKey(conversationId: string): string;
export declare function buildPayoutIdempotencyKey(payoutId: string): string;
export declare function buildEnrolmentIdempotencyKey(enrolmentId: string): string;
export declare function buildVerificationIdempotencyKey(trainerId: string): string;
