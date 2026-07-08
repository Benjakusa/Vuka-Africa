export declare class AppError extends Error {
    statusCode: number;
    code: string;
    details?: unknown | undefined;
    constructor(statusCode: number, code: string, message: string, details?: unknown | undefined);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class ValidationError extends AppError {
    constructor(details: unknown);
}
export declare class InsufficientBalanceError extends AppError {
    constructor();
}
export declare class RateLimitError extends AppError {
    constructor(retryAfter?: number);
}
export declare class IdempotencyError extends AppError {
    constructor();
}
export declare class CsrfError extends AppError {
    constructor();
}
export declare class AccountSuspendedError extends AppError {
    constructor(reason?: string);
}
export declare class EmailNotVerifiedError extends AppError {
    constructor();
}
export declare class MfaRequiredError extends AppError {
    constructor();
}
