# Vuka — Security Implementation Checklist

> **Status:** ✅ Implemented | 🔧 Requires Configuration | 📝 Planned
> **Last updated:** 2026-07-05

---

## 1. Authentication & Session Management

| #    | Control                                                             | Location                                           | Status |
| ---- | ------------------------------------------------------------------- | -------------------------------------------------- | ------ |
| 1.1  | Password minimum 8 chars with letter + digit                        | `services/auth.service.ts:validatePassword`        | ✅     |
| 1.2  | Bcrypt hashing with salt rounds = 12                                | `services/auth.service.ts:register`                | ✅     |
| 1.3  | JWT access tokens (15min expiry) via `Authorization: Bearer` header | `lib/jwt.ts:signAccessToken`                       | ✅     |
| 1.4  | JWT refresh tokens (7d expiry) with rotation                        | `lib/jwt.ts:signRefreshToken`                      | ✅     |
| 1.5  | Refresh token one-time use (rotated on each refresh)                | `services/auth.service.ts:refresh`                 | ✅     |
| 1.6  | Token version counter for global invalidation                       | `lib/jwt.ts:incrementTokenVersion`                 | ✅     |
| 1.7  | Redis-backed refresh token storage                                  | `lib/jwt.ts:storeRefreshToken`                     | ✅     |
| 1.8  | Refresh token blacklisting on logout                                | `lib/jwt.ts:removeRefreshToken`                    | ✅     |
| 1.9  | Access token `jti` blacklisting for immediate revocation            | `lib/jwt.ts:blacklistToken`                        | ✅     |
| 1.10 | JWT issuer and audience validation                                  | `lib/jwt.ts:verifyAccessToken`                     | ✅     |
| 1.11 | Email verification required before transactions                     | `middleware/auth.ts:requireEmailVerified`          | ✅     |
| 1.12 | Email verification token (24h expiry, one-time use)                 | `services/auth.service.ts:verifyEmailWithToken`    | ✅     |
| 1.13 | Resend verification with 60s cooldown                               | `services/auth.service.ts:resendVerificationEmail` | ✅     |
| 1.14 | Account suspension check at authentication                          | `middleware/auth.ts:authenticate`                  | ✅     |
| 1.15 | User status cache with 30s TTL                                      | `middleware/auth.ts:setCachedUser`                 | ✅     |

## 2. Authorization & IDOR Prevention

| #   | Control                                                     | Location                                  | Status |
| --- | ----------------------------------------------------------- | ----------------------------------------- | ------ |
| 2.1 | Role-based access middleware (ADMIN/TRAINER/TRAINEE)        | `middleware/auth.ts:requireRole`          | ✅     |
| 2.2 | Course ownership check on update/delete                     | `services/course.service.ts`              | ✅     |
| 2.3 | Enrolment participant check (trainee or trainer)            | `services/enrolment.service.ts`           | ✅     |
| 2.4 | Milestone ownership: trainer confirms own enrolment         | `services/milestone.service.ts`           | ✅     |
| 2.5 | Payout: trainer can only withdraw own balance               | `services/payout.service.ts`              | ✅     |
| 2.6 | Admin-only access to `/api/v1/admin/*`                      | `middleware/auth.ts:requireRole('ADMIN')` | ✅     |
| 2.7 | Unauthorized access returns 403 with no information leakage | `middleware/auth.ts`                      | ✅     |

## 3. Input Validation & XSS Prevention

| #   | Control                                                 | Location                                  | Status |
| --- | ------------------------------------------------------- | ----------------------------------------- | ------ |
| 3.1 | Zod schemas for all API inputs                          | All route files                           | ✅     |
| 3.2 | `strictObject` to reject unknown fields                 | All Zod schemas                           | ✅     |
| 3.3 | Max lengths on all string inputs (255 default)          | Zod schemas + `sanitizeString`            | ✅     |
| 3.4 | Kenyan phone number format validation                   | `services/auth.service.ts:validatePhone`  | ✅     |
| 3.5 | Email format and length validation                      | `services/auth.service.ts:validateEmail`  | ✅     |
| 3.6 | String sanitization (strip `<>` HTML tags)              | `services/auth.service.ts:sanitizeString` | ✅     |
| 3.7 | No `dangerouslySetInnerHTML` in frontend                | All React components                      | ✅     |
| 3.8 | Magic byte validation on file uploads                   | `lib/file-validation.ts:checkMagicBytes`  | ✅     |
| 3.9 | SQL injection prevented by Prisma parameterized queries | All queries                               | ✅     |

## 4. CSRF Protection

| #   | Control                                                                  | Location                                   | Status |
| --- | ------------------------------------------------------------------------ | ------------------------------------------ | ------ |
| 4.1 | CSRF token generated on login/refresh                                    | `middleware/csrf.ts:generateCsrfToken`     | ✅     |
| 4.2 | CSRF token stored in Redis with 24h TTL                                  | `middleware/csrf.ts:storeCsrfToken`        | ✅     |
| 4.3 | `X-CSRF-Token` header required on mutating requests                      | `middleware/csrf.ts:validateCsrfToken`     | ✅     |
| 4.4 | Timing-safe comparison of CSRF tokens                                    | `middleware/csrf.ts` via `timingSafeEqual` | ✅     |
| 4.5 | CSRF token cleared on logout                                             | `services/auth.service.ts:logout`          | ✅     |
| 4.6 | Refresh token cookie is `httpOnly` + `SameSite=strict` + path-restricted | Cookie configuration                       | ✅     |

## 5. Security Headers & CSP

| #    | Control                                            | Location         | Status |
| ---- | -------------------------------------------------- | ---------------- | ------ |
| 5.1  | `Strict-Transport-Security` (2 years, preload)     | `next.config.js` | ✅     |
| 5.2  | `X-Content-Type-Options: nosniff`                  | `next.config.js` | ✅     |
| 5.3  | `X-Frame-Options: DENY`                            | `next.config.js` | ✅     |
| 5.4  | `Referrer-Policy: strict-origin-when-cross-origin` | `next.config.js` | ✅     |
| 5.5  | `Permissions-Policy` restricted                    | `next.config.js` | ✅     |
| 5.6  | `Content-Security-Policy` with strict directives   | `next.config.js` | ✅     |
| 5.7  | CSP `report-uri` for violation monitoring          | `next.config.js` | 🔧     |
| 5.8  | `Cross-Origin-Opener-Policy: same-origin`          | `next.config.js` | ✅     |
| 5.9  | `Cross-Origin-Resource-Policy: same-origin`        | `next.config.js` | ✅     |
| 5.10 | `Cross-Origin-Embedder-Policy: require-corp`       | `next.config.js` | ✅     |
| 5.11 | `X-Powered-By` header removed                      | `next.config.js` | ✅     |
| 5.12 | Source maps disabled in production                 | `next.config.js` | ✅     |

## 6. M-Pesa Webhook Security

| #   | Control                                                   | Location                                 | Status |
| --- | --------------------------------------------------------- | ---------------------------------------- | ------ |
| 6.1 | Source IP whitelist validation                            | `lib/mpesa.ts:validateCallbackIp`        | ✅     |
| 6.2 | HMAC-SHA256 signature verification                        | `lib/mpesa.ts:validateCallbackSignature` | ✅     |
| 6.3 | Timing-safe signature comparison                          | `lib/mpesa.ts` via `timingSafeEqual`     | ✅     |
| 6.4 | Replay attack prevention (transaction receipt uniqueness) | `lib/mpesa.ts:checkReplayAttack`         | ✅     |
| 6.5 | Idempotency key on B2C payouts                            | `services/payout.service.ts`             | ✅     |
| 6.6 | STK Push request timeout (15s)                            | `lib/mpesa.ts` axios config              | ✅     |
| 6.7 | Callback deduplication (7-day window)                     | `lib/mpesa.ts:markCallbackProcessed`     | ✅     |
| 6.8 | Phone number masking in logs                              | `lib/mpesa.ts:sanitizeMpesaLog`          | ✅     |

## 7. Payout 2FA Hardening

| #   | Control                                          | Location                                            | Status |
| --- | ------------------------------------------------ | --------------------------------------------------- | ------ |
| 7.1 | Cryptographically random 6-digit code            | `services/payout.service.ts:generate2faCode`        | ✅     |
| 7.2 | Code stored in Redis with 10min TTL              | `services/payout.service.ts`                        | ✅     |
| 7.3 | Max 5 incorrect attempts per hour                | `services/payout.service.ts:check2faRateLimit`      | ✅     |
| 7.4 | Code deleted after single use                    | `services/payout.service.ts`                        | ✅     |
| 7.5 | 60s cooldown on code resend                      | `services/payout.service.ts:check2faResendCooldown` | ✅     |
| 7.6 | Code sent via email only (never in API response) | `services/payout.service.ts`                        | ✅     |
| 7.7 | Rate limit headers returned                      | `middleware/rate-limit.ts`                          | ✅     |

## 8. Rate Limiting

| #   | Control                                             | Location                                                | Status |
| --- | --------------------------------------------------- | ------------------------------------------------------- | ------ |
| 8.1 | Redis-backed rate limiting middleware               | `middleware/rate-limit.ts`                              | ✅     |
| 8.2 | Per-IP limits for unauthenticated endpoints         | `middleware/rate-limit.ts:rateLimitByIp`                | ✅     |
| 8.3 | Per-user limits for authenticated endpoints         | `middleware/rate-limit.ts:rateLimitByUser`              | ✅     |
| 8.4 | Per-email limits for credential stuffing protection | `middleware/rate-limit.ts:rateLimitByEmail`             | ✅     |
| 8.5 | Differentiated limits per endpoint category         | See env vars `AUTH_RATE_LIMIT_*`, `PAYOUT_RATE_LIMIT_*` | ✅     |
| 8.6 | Rate limit headers in response                      | `middleware/rate-limit.ts`                              | ✅     |

## 9. File Upload Security

| #   | Control                                          | Location                                   | Status |
| --- | ------------------------------------------------ | ------------------------------------------ | ------ |
| 9.1 | MIME type whitelist                              | `lib/file-validation.ts:ALLOWED_ALL_TYPES` | ✅     |
| 9.2 | File extension whitelist                         | `lib/file-validation.ts`                   | ✅     |
| 9.3 | Size limits (images: 5MB, videos: 50MB)          | `lib/file-validation.ts`                   | ✅     |
| 9.4 | Magic byte signature validation                  | `lib/file-validation.ts:checkMagicBytes`   | ✅     |
| 9.5 | UUID-based filename sanitization                 | `lib/file-validation.ts:sanitizeFilename`  | ✅     |
| 9.6 | Metadata (uploader, timestamp) on stored objects | `app/api/upload/route.ts`                  | ✅     |
| 9.7 | File upload rate limit (20/min per user)         | `app/api/upload/route.ts`                  | ✅     |
| 9.8 | Virus scanning                                   | `lib/file-validation.ts`                   | 📝     |

## 10. Data Protection & Encryption

| #    | Control                                | Location                        | Status |
| ---- | -------------------------------------- | ------------------------------- | ------ |
| 10.1 | HTTPS enforced via HSTS                | `next.config.js`                | ✅     |
| 10.2 | AES-256-GCM encryption utility for PII | `lib/encryption.ts`             | ✅     |
| 10.3 | Phone number masking in logs           | `lib/encryption.ts:maskPhone`   | ✅     |
| 10.4 | Email masking in logs                  | `lib/encryption.ts:maskEmail`   | ✅     |
| 10.5 | M-Pesa callback log sanitization       | `lib/mpesa.ts:sanitizeMpesaLog` | ✅     |

## 11. Secrets Management

| #    | Control                                            | Location       | Status |
| ---- | -------------------------------------------------- | -------------- | ------ |
| 11.1 | Environment validation at startup                  | `lib/env.ts`   | ✅     |
| 11.2 | Detailed error messages for missing env vars       | `lib/env.ts`   | ✅     |
| 11.3 | `.env` in `.gitignore`                             | `.gitignore`   | ✅     |
| 11.4 | `.env.example` with placeholders (no real secrets) | `.env.example` | ✅     |
| 11.5 | No `NEXT_PUBLIC_` on server secrets                | All env vars   | ✅     |
| 11.6 | Strong default values for dev (but no secrets)     | `.env.example` | ✅     |

## 12. Additional Hardening

| #    | Control                                              | Location                   | Status |
| ---- | ---------------------------------------------------- | -------------------------- | ------ |
| 12.1 | Redis connection with retry strategy                 | `lib/redis.ts`             | ✅     |
| 12.2 | Prisma query logging limited in production           | `lib/prisma.ts`            | ✅     |
| 12.3 | BullMQ queue prefix for multi-tenant Redis isolation | `.env.example`             | ✅     |
| 12.4 | Maintenance mode toggle                              | `lib/env.ts`               | ✅     |
| 12.5 | Signup disable toggle for beta                       | `lib/env.ts`               | ✅     |
| 12.6 | Account suspension reason stored                     | `prisma/schema.prisma`     | ✅     |
| 12.7 | Last login timestamp tracking                        | `services/auth.service.ts` | ✅     |

---

## Remediation Summary

| Severity | Count | Status   |
| -------- | ----- | -------- |
| CRITICAL | 1     | ✅ Fixed |
| HIGH     | 3     | ✅ Fixed |
| MEDIUM   | 5     | ✅ Fixed |
| LOW      | 4     | ✅ Fixed |

## Verification Steps (Pre-Launch)

1. Run `npm audit` and resolve any critical vulnerabilities
2. Verify all security headers via `curl -I https://[app-url]`
3. Test rate limiting: send 6 login requests in 15 seconds, expect 429 on 6th
4. Test CSRF: send `POST /api/v1/payouts/request` without `X-CSRF-Token` header, expect 403
5. Test IDOR: create two accounts, attempt to access each other's courses/enrolments
6. Test file upload: attempt to upload a `.txt` file renamed to `.jpg`
7. Test email verification: register, enrol without verifying, expect 403
8. Test M-Pesa webhook: send a forged callback, expect HMAC rejection
9. Test account suspension: suspend a user, verify they cannot authenticate
10. Test 2FA brute force: submit 6 incorrect codes, expect 429 on 6th

---

_This checklist should be reviewed and signed off before each production deployment._
