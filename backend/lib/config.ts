import { env } from '@backend/lib/env';

/**
 * Vuka Platform Configuration
 * All business-level constants in one place. No hardcoded magic numbers.
 */

export const PLATFORM = {
  name: 'Vuka',
  tagline: 'U-Learn, U-Earn',
  domain: env.NEXT_PUBLIC_APP_URL,
} as const;

export const COMMISSION = {
  DEFAULT: 20,        // 20% for standard trainers
  VERIFIED: 12,       // 12% for admin-verified trainers (future)
  FOUNDING: 0,        // 0% for first 100 trainers
  FREE_TRAINER_LIMIT: 100,
} as const;

export const FEES = {
  VERIFICATION: 5000, // KES
  MIN_PAYOUT: 100,    // KES — minimum withdrawal
  MAX_PAYOUT: 50000,  // KES — maximum withdrawal per transaction
} as const;

export const MILESTONES = [
  { sequence: 1, label: 'Start', percentage: 25 },
  { sequence: 2, label: 'Midpoint', percentage: 50 },
  { sequence: 3, label: 'Completion', percentage: 25 },
] as const;

export const MILESTONE = {
  RELEASE_DELAY_MS: 86_400_000, // 24h after both confirm
  RELEASE_DELAY_HUMAN: '24 hours',
  COUNT: 3,
} as const;

export const CACHE = {
  TRAINER_LIST_TTL: 60,       // seconds
  TRAINER_PROFILE_TTL: 120,
  COURSE_LIST_TTL: 60,
  COURSE_DETAIL_TTL: 120,
  USER_SESSION_TTL: 3600,     // 1h
  MPESA_TOKEN_TTL_BUFFER: 60, // seconds before expiry
  IDEMPOTENCY_TTL: 86_400,    // 24h
  MPESA_RECEIPT_TTL: 2_592_000, // 30 days
} as const;

export const WORKER = {
  PAYOUT_CONCURRENCY: 1,
  MILESTONE_CONCURRENCY: 5,
  EMAIL_CONCURRENCY: 3,
  MPESA_CALLBACK_CONCURRENCY: 2,
  PAYOUT_MAX_RETRIES: 5,
  PAYOUT_RETRY_DELAY_MS: 5000,
  STALLED_INTERVAL_MS: 30000,
} as const;

export const PAGINATION = {
  DEFAULT_PER_PAGE: 20,
  MAX_PER_PAGE: 100,
} as const;

export const UPLOAD = {
  MAX_IMAGE_SIZE: 10_485_760,       // 10 MB
  MAX_VIDEO_SIZE: 52_428_800,       // 50 MB
  AVATAR_MAX_DIMENSION: 300,
  COURSE_IMAGE_MAX_DIMENSION: 1200,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as string[],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'] as string[],
  ALLOWED_VIDEO_TYPES: ['video/mp4'] as string[],
} as const;

export const RATE_LIMIT = {
  LOGIN: { max: 5, window: 900_000 },         // 5 per 15min
  REGISTER: { max: 3, window: 3_600_000 },     // 3 per hour
  PAYOUT: { max: 2, window: 3_600_000 },       // 2 per hour
  PAYOUT_2FA: { max: 5, window: 3_600_000 },   // 5 attempts per hour
  UPLOAD: { max: 20, window: 60_000 },         // 20 per min
  API_DEFAULT: { max: 100, window: 60_000 },   // 100 per min
  ADMIN: { max: 60, window: 60_000 },          // 60 per min
} as const;

export const MPESA = {
  SANDBOX_BASE: 'https://sandbox.safaricom.co.ke',
  PROD_BASE: 'https://api.safaricom.co.ke',
  TIMEOUT: 15_000,
  ACCOUNT_REF_PREFIX: {
    ENROLMENT: 'ENROL-',
    VERIFICATION: 'VERIFY-',
  },
} as const;
