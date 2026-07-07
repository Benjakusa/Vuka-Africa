# Vuka Platform — Security Audit Report

**Date:** 2026-07-05  
**Auditor:** Senior Application Security Engineer  
**Version:** 1.0  
**Scope:** Full-stack audit — backend (Next.js API routes, services, workers) and frontend (React/Next.js App Router)  
**Classification:** CONFIDENTIAL

---

## Executive Summary

Vuka is a two-sided Kenyan skill-training marketplace handling financial transactions via M-Pesa, including escrow-based milestone payouts and trainer verification fees. This audit covers authentication, authorization, input validation, M-Pesa integration security, rate limiting, file upload security, data protection, and infrastructure hardening.

**Overall risk rating:** MEDIUM (pre-mitigation) → LOW (post-mitigation)

**Critical findings:** 1  
**High findings:** 3  
**Medium findings:** 5  
**Low findings:** 4

All findings have been addressed with concrete code changes in this PR.

---

## Finding Register

### CRITICAL-01: M-Pesa Webhook HMAC Verification Missing

**Risk:** CRITICAL  
**Location:** `lib/mpesa.ts:validateCallbackSignature`  
**Impact:** Any attacker who can reach the webhook endpoint can forge callback payloads, potentially triggering fraudulent milestone releases or enrolment activations without actual M-Pesa payment.

**Vulnerability:** The `validateCallbackSignature` function was a no-op returning `true` in all environments. While sandbox mode is acceptable, production must verify the HMAC-SHA256 signature sent in the `X-MPESA-SIGNATURE` header.

**Remediation:** Implemented proper HMAC-SHA256 verification using `crypto.timingSafeEqual` to prevent timing attacks. The passkey is used as the HMAC secret, matching Safaricom's signing process.

**Verification:** Unit test `lib/__tests__/mpesa.test.ts` checks that valid signatures pass and invalid signatures are rejected.

---

### HIGH-01: Missing CSRF Protection for Financial Endpoints

**Risk:** HIGH  
**Location:** All `POST`/`PATCH`/`DELETE` routes  
**Impact:** Although access tokens are sent via `Authorization` header (mitigating standard CSRF), the payout endpoint triggers financial transactions. A CSRF attack could trick an authenticated trainer into submitting a payout request.

**Remediation:** Implemented double-submit cookie pattern with a server-validated CSRF token:
- `middleware/csrf.ts` — Token generation, storage in Redis, and validation using `timingSafeEqual`
- CSRF token is returned in login/refresh responses
- Client must include `X-CSRF-Token` header on mutating requests
- Payout and enrolment endpoints require CSRF validation

**Verification:** Ensure `X-CSRF-Token` header is required for `POST /api/v1/payouts/request` and `POST /api/v1/enrolments`.

---

### HIGH-02: Account Enumeration via Login Response Timing

**Risk:** HIGH  
**Location:** `services/auth.service.ts:login`  
**Impact:** The login endpoint always returned `Invalid email or password` regardless of whether the email existed, but the timing differed slightly between existing and non-existing users due to bcrypt comparison.

**Remediation:** The database lookup and bcrypt comparison are now performed with consistent timing. A constant-time string comparison wrapper has been added, and the response message is uniform.

**Verification:** Automated login timing tests confirm negligible timing difference.

---

### HIGH-03: Payout 2FA Brute-Force Protection

**Risk:** HIGH  
**Location:** `services/payout.service.ts:requestPayout`  
**Impact:** The 2FA verification code was a single-use 6-digit code with no rate limiting on validation attempts. An attacker could brute-force all 1,000,000 combinations within the 10-minute window.

**Remediation:**
- Rate limiting: max 5 incorrect 2FA attempts per hour per user (`payout_2fa_attempts:{userId}` with TTL 3600s)
- Server-generated cryptographically random codes via `crypto.randomBytes`
- Code is single-use (deleted from Redis after successful or failed attempt)
- 60-second cooldown on resending codes
- Email notification on code generation

**Verification:** Force 5 incorrect attempts; the 6th should be blocked with HTTP 429.

---

### MEDIUM-01: IDOR — Missing Resource Ownership Checks

**Risk:** MEDIUM  
**Location:** Multiple service files  
**Impact:** A user could potentially access or modify another user's courses, enrolments, or profile data by guessing UUIDs.

**Remediation:** Added `ensureOwnership` pattern in `middleware/auth.ts`. Every service function that accesses user-scoped resources now includes an explicit ownership check:
- `PATCH /courses/:id` — checks `course.trainer.userId === currentUserId`
- `DELETE /courses/:id` — same
- `GET /enrolments/:id` — checks user is trainee, trainer, or admin
- Milestone confirmations check enrolment ownership
- Payout requests check trainer ownership
- Trainer profile edits check `userId` match

**Verification:** Attempt to access another user's course via API should return 403.

---

### MEDIUM-02: Missing Email Verification Requirement

**Risk:** MEDIUM  
**Location:** `services/auth.service.ts:register`, `services/enrolment.service.ts`  
**Impact:** Users could register without verified emails and immediately enrol in courses or create courses, enabling spam accounts.

**Remediation:**
- Registration creates user with `emailVerified: false`
- Generates a 32-byte random verification token
- Sends verification email with 24-hour expiry link
- Token stored in `emailVerificationToken` field (unique, indexed)
- `requireEmailVerified()` middleware checks before enrolment and course creation
- Resend endpoint has 60-second cooldown
- New env var `REQUIRE_EMAIL_VERIFICATION` toggles enforcement

**Verification:** Register a new user and attempt to enrol without verifying email → should receive 403.

---

### MEDIUM-03: Weak Password Policy

**Risk:** MEDIUM  
**Location:** `services/auth.service.ts:register`  
**Impact:** No minimum password complexity requirements.

**Remediation:** Zod regex enforces: minimum 8 characters, at least one letter and one digit. Bcrypt salt rounds remain at 12.

**Verification:** Register with password `abc123` → should be accepted (meets criteria). Register with `abcdefgh` → rejected (no digit). Register with `12345678` → rejected (no letter). Register with `short` → rejected (too short).

---

### MEDIUM-04: No File Upload Magic Byte Validation

**Risk:** MEDIUM  
**Location:** `app/api/upload/route.ts`  
**Impact:** A malicious user could upload a PHP/script file with a `.jpg` extension, bypassing MIME type checks.

**Remediation:** Added `checkMagicBytes()` in `lib/file-validation.ts` that validates the file's magic bytes (signature) against known formats before accepting the upload. JPEG, PNG, WebP, PDF, MP4, and WebM signatures are checked.

**Verification:** Upload a text file renamed to `image.jpg` → rejected. Upload a real JPEG → accepted.

---

### MEDIUM-05: Sensitive Data in M-Pesa Logs

**Risk:** MEDIUM  
**Location:** `workers/*`, `lib/mpesa.ts`  
**Impact:** M-Pesa callbacks contain phone numbers. If logged in plaintext, this exposes PII.

**Remediation:** Added `sanitizeMpesaLog()` and `maskPhone()` functions. Phone numbers are masked (e.g., `2547****1234`) before logging. The `meta` JSON field in `TransactionLedger` is sanitized.

**Verification:** Run a test callback and check logs; phone numbers should be masked.

---

### LOW-01: Missing Security Headers (CSP, COOP, CORP)

**Risk:** LOW  
**Location:** `next.config.js`  
**Impact:** Without a Content-Security-Policy, an XSS vulnerability could be exploited to exfiltrate data.

**Remediation:** Implemented strict CSP with report-uri, along with Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy, and Cross-Origin-Embedder-Policy headers.

**Verification:** Running `curl -I https://vuka.africa` should show all security headers.

---

### LOW-02: JWT Token Version Not Tracked

**Risk:** LOW  
**Location:** `lib/jwt.ts`  
**Impact:** Refresh tokens could not be globally revoked without clearing all tokens via `removeAllRefreshTokens`.

**Remediation:** Added `tokenVersion` field to `Redis` (stored as `token_version:{userId}`). On password change or suspicious activity, incrementing this version invalidates all existing refresh tokens. The `validateRefreshToken` function checks the stored version against the token's claim.

**Verification:** After calling the password change endpoint, existing refresh tokens should fail validation.

---

### LOW-03: No Rate Limiting on Sensitive Endpoints

**Risk:** LOW  
**Location:** All API routes  
**Impact:** Brute-force attacks on login, registration, and 2FA validation were possible.

**Remediation:** Redis-backed rate limiting with per-endpoint configurations:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/v1/auth/login` | 5/IP | 15 min |
| `POST /api/v1/auth/register` | 3/IP | 1 hour |
| `POST /api/v1/auth/refresh` | 10/user | 1 min |
| `POST /api/v1/payouts/request` | 2/user | 1 hour |
| `POST /api/v1/payouts/request-2fa` | 3/user | 1 hour |
| `POST /api/v1/enrolments` | 5/user | 1 min |
| `GET /api/v1/admin/*` | 60/admin | 1 min |

Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) are included in responses.

**Verification:** Send 6 rapid login requests; the 6th should return 429.

---

### LOW-04: Missing Password Change Email Notification

**Risk:** LOW  
**Location:** `services/auth.service.ts`  
**Impact:** Users are not notified when their password is changed, which could indicate account compromise.

**Remediation:** Password change now triggers an email notification to the account's primary email. Additionally, `tokenVersion` is incremented to invalidate all existing sessions.

**Verification:** Change password; email should be sent to the account email.

---

## Environment & Configuration Review

### Secrets Management
- ✅ All secrets are server-side only (no `NEXT_PUBLIC_` prefix on sensitive vars)
- ✅ `.env` files in `.gitignore`
- ✅ Environment validation at startup via `lib/env.ts` with detailed error messages
- ✅ Sensible defaults for development, no defaults for secrets

### CORS Configuration
- ✅ Restricted to specific origins via `CORS_ORIGINS` env var
- ✅ Credentials allowed only for trusted origins
- ✅ Webhook endpoints have relaxed CORS (no origin check needed)

### Remaining Risks (Accepted for MVP)

1. **Distributed Denial of Service (DDoS):** No WAF or CDN-based rate limiting in MVP. Relies on Redis rate limiting only. **Mitigation:** Deploy behind Cloudflare in production.
2. **Dependency vulnerabilities:** No automated SCA (Software Composition Analysis) in CI/CD. **Mitigation:** Run `npm audit` weekly; subscribe to GitHub Dependabot alerts.
3. **Virus scanning on uploads:** No ClamAV integration. **Mitigation:** Documented in `lib/file-validation.ts` as a future enhancement; file type validation via magic bytes provides basic protection.
4. **Application-level encryption for PII:** Phone numbers and ID document URLs are stored in plaintext (encrypted at rest by PostgreSQL). **Mitigation:** `lib/encryption.ts` provides AES-256-GCM utility ready for integration.
5. **No penetration testing:** This audit is code-review only. A third-party penetration test is recommended before handling real funds.

---

## Conclusion

All CRITICAL and HIGH findings have been remediated with concrete code changes. The platform is ready for pilot launch with the implemented security controls. A penetration test is recommended before processing significant transaction volume.

**Sign-off readiness:** ✅ GREEN
