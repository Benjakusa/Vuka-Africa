/**
 * Vuka Platform Configuration
 * All business-level constants in one place. No hardcoded magic numbers.
 */
export declare const PLATFORM: {
  readonly name: 'Vuka Afrique';
  readonly tagline: 'U-Learn, U-Earn';
  readonly domain: string;
};
export declare const COMMISSION: {
  readonly DEFAULT: 20;
  readonly VERIFIED: 12;
  readonly FOUNDING: 0;
  readonly FREE_TRAINER_LIMIT: 100;
};
export declare const FEES: {
  readonly VERIFICATION: 5000;
  readonly MIN_PAYOUT: 100;
  readonly MAX_PAYOUT: 50000;
};
export declare const MILESTONES: readonly [
  {
    readonly sequence: 1;
    readonly label: 'Start';
    readonly percentage: 25;
  },
  {
    readonly sequence: 2;
    readonly label: 'Midpoint';
    readonly percentage: 50;
  },
  {
    readonly sequence: 3;
    readonly label: 'Completion';
    readonly percentage: 25;
  },
];
export declare const MILESTONE: {
  readonly RELEASE_DELAY_MS: 86400000;
  readonly RELEASE_DELAY_HUMAN: '24 hours';
  readonly COUNT: 3;
};
export declare const CACHE: {
  readonly TRAINER_LIST_TTL: 60;
  readonly TRAINER_PROFILE_TTL: 120;
  readonly COURSE_LIST_TTL: 60;
  readonly COURSE_DETAIL_TTL: 120;
  readonly USER_SESSION_TTL: 3600;
  readonly MPESA_TOKEN_TTL_BUFFER: 60;
  readonly IDEMPOTENCY_TTL: 86400;
  readonly MPESA_RECEIPT_TTL: 2592000;
};
export declare const WORKER: {
  readonly PAYOUT_CONCURRENCY: 1;
  readonly MILESTONE_CONCURRENCY: 5;
  readonly EMAIL_CONCURRENCY: 3;
  readonly MPESA_CALLBACK_CONCURRENCY: 2;
  readonly PAYOUT_MAX_RETRIES: 5;
  readonly PAYOUT_RETRY_DELAY_MS: 5000;
  readonly STALLED_INTERVAL_MS: 30000;
};
export declare const PAGINATION: {
  readonly DEFAULT_PER_PAGE: 20;
  readonly MAX_PER_PAGE: 100;
};
export declare const UPLOAD: {
  readonly MAX_IMAGE_SIZE: 10485760;
  readonly MAX_VIDEO_SIZE: 52428800;
  readonly AVATAR_MAX_DIMENSION: 300;
  readonly COURSE_IMAGE_MAX_DIMENSION: 1200;
  readonly ALLOWED_IMAGE_TYPES: string[];
  readonly ALLOWED_DOCUMENT_TYPES: string[];
  readonly ALLOWED_VIDEO_TYPES: string[];
};
export declare const RATE_LIMIT: {
  readonly LOGIN: {
    readonly max: 5;
    readonly window: 900000;
  };
  readonly REGISTER: {
    readonly max: 3;
    readonly window: 3600000;
  };
  readonly PAYOUT: {
    readonly max: 2;
    readonly window: 3600000;
  };
  readonly PAYOUT_2FA: {
    readonly max: 5;
    readonly window: 3600000;
  };
  readonly UPLOAD: {
    readonly max: 20;
    readonly window: 60000;
  };
  readonly API_DEFAULT: {
    readonly max: 100;
    readonly window: 60000;
  };
  readonly ADMIN: {
    readonly max: 60;
    readonly window: 60000;
  };
};
export declare const MPESA: {
  readonly SANDBOX_BASE: 'https://sandbox.safaricom.co.ke';
  readonly PROD_BASE: 'https://api.safaricom.co.ke';
  readonly TIMEOUT: 15000;
  readonly ACCOUNT_REF_PREFIX: {
    readonly ENROLMENT: 'ENROL-';
    readonly VERIFICATION: 'VERIFY-';
  };
};
