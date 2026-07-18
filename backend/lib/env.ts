import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CSRF_SECRET: z.string().min(32).default(''),

  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be 32 bytes (base64)').default(''),

  EMAIL_HOST: z.string(),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_USER: z.string(),
  EMAIL_PASS: z.string(),
  EMAIL_FROM: z.string().default('Vuka Afrique <noreply@vukaafrique.com>'),

  MPESA_CONSUMER_KEY: z.string(),
  MPESA_CONSUMER_SECRET: z.string(),
  MPESA_PASSKEY: z.string(),
  MPESA_SHORTCODE: z.string().default('174379'),
  MPESA_B2C_SHORTCODE: z.string().default('600000'),
  MPESA_B2C_INITIATOR_NAME: z.string().default('apitest'),
  MPESA_B2C_SECURITY_CREDENTIAL: z.string().default(''),
  MPESA_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  MPESA_CALLBACK_URL: z.string().url().optional(),
  MPESA_B2C_RESULT_URL: z.string().url().optional(),
  MPESA_B2C_TIMEOUT_URL: z.string().url().optional(),
  MPESA_IP_WHITELIST: z
    .string()
    .default(
      '196.201.214.200,196.201.214.206,196.201.213.114,196.201.214.208,196.201.213.44,196.201.212.127,196.201.212.138,196.201.212.129,196.201.212.136,196.201.212.74,196.201.212.69',
    ),

  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default('vuka-uploads'),
  R2_ENDPOINT: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().default('/api/v1'),

  SESSION_ENCRYPTION_KEY: z.string().optional(),
  BULLMQ_PREFIX: z.string().default('{vuka-queues}'),

  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(5),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  PAYOUT_RATE_LIMIT_MAX: z.coerce.number().default(2),
  PAYOUT_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(3600000),
  ADMIN_RATE_LIMIT_MAX: z.coerce.number().default(60),
  ADMIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  MAX_UPLOAD_SIZE: z.coerce.number().default(10485760),
  MAX_VIDEO_UPLOAD_SIZE: z.coerce.number().default(52428800),
  ALLOWED_MIME_TYPES: z.string().default('image/jpeg,image/png,image/webp,application/pdf,video/mp4'),

  MAINTENANCE_MODE: z.enum(['true', 'false']).default('false'),
  DISABLE_SIGNUPS: z.enum(['true', 'false']).default('false'),
  REQUIRE_EMAIL_VERIFICATION: z.enum(['true', 'false']).default('true'),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SENTRY_DSN: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  CSP_REPORT_URI: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  const flat = parsed.error.flatten();
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    console.error(`  ${key}: ${messages?.join(', ')}`);
  }
  if (flat.formErrors.length > 0) {
    console.error(`  Form errors: ${flat.formErrors.join(', ')}`);
  }
  process.exit(1);
}

export const env = parsed.data;
