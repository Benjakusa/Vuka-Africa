export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'AUTHENTICATION_REQUIRED', message);
    this.name = 'AuthenticationError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super(422, 'VALIDATION_ERROR', 'Validation failed', details);
    this.name = 'ValidationError';
  }
}

export class InsufficientBalanceError extends AppError {
  constructor() {
    super(422, 'INSUFFICIENT_BALANCE', 'Insufficient balance for this transaction');
    this.name = 'InsufficientBalanceError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', retryAfter);
    this.name = 'RateLimitError';
  }
}

export class IdempotencyError extends AppError {
  constructor() {
    super(409, 'IDEMPOTENCY_REUSE', 'This request has already been processed');
    this.name = 'IdempotencyError';
  }
}

export class CsrfError extends AppError {
  constructor() {
    super(403, 'CSRF_TOKEN_INVALID', 'CSRF token validation failed');
    this.name = 'CsrfError';
  }
}

export class AccountSuspendedError extends AppError {
  constructor(reason?: string) {
    super(403, 'ACCOUNT_SUSPENDED', reason || 'Account is suspended. Contact support.');
    this.name = 'AccountSuspendedError';
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor() {
    super(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email address before performing this action');
    this.name = 'EmailNotVerifiedError';
  }
}

export class MfaRequiredError extends AppError {
  constructor() {
    super(403, 'MFA_REQUIRED', 'Multi-factor authentication is required for this action');
    this.name = 'MfaRequiredError';
  }
}
