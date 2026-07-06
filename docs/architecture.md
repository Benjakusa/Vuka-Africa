# Vuka — System Architecture Document

## 1. High-Level Architecture

```
+-------------------------------------------------------------------+
|                         CLIENT LAYER                               |
|  PWA (React / Next.js)  |  Browser (Desktop)  |  Postman / API    |
+--------------------------------+----------------------------------+
                                 |
                          HTTPS / WSS
                                 |
+--------------------------------------------------------------------+
|                     NEXT.JS SERVER (App Router)                     |
|                                                                     |
|  +--------------------------+  +--------------------------------+   |
|  |   API Routes (REST)      |  |  Server Components (SSR/SSG)   |   |
|  |   /api/v1/*              |  |  Pages, Layouts, RSC           |   |
|  +------------+-------------+  +---------------+----------------+   |
|               |                                |                    |
|  +------------v-------------+  +---------------v----------------+   |
|  |   NextAuth / JWT         |  |  React Server Actions          |   |
|  |   (access+refresh cookie)|  |  (form handling)               |   |
|  +--------------------------+  +--------------------------------+   |
|                                                                     |
|  +--------------------------+  +--------------------------------+   |
|  |   BullMQ Workers         |  |  Upload Handler (R2 presigned) |   |
|  |   (separate CPU in proc) |  |  (via /api/upload)             |   |
|  +--------------------------+  +--------------------------------+   |
+---------------------------+----------------------------------------+
                            |
          +-----------------+-----------------+
          |                                   |
+---------v---------+             +-----------v--------+
|   REDIS (Upstash)  |             |  PostgreSQL        |
|                    |             |  (via Prisma ORM)   |
| - Session cache    |             |                    |
| - BullMQ queues    |             | - Users, Trainers  |
| - Rate limiting    |             | - Courses, Enrols  |
| - Token blacklist  |             | - Milestones       |
| - Query cache(60s) |             | - Ledger (append)  |
+--------------------+             | - Payouts, Reviews |
                                   | - Disputes, etc.  |
                                   +---------+----------+
                                             |
                                   +---------v----------+
                                   |  Cloudflare R2      |
                                   |  (avatars, docs,    |
                                   |   verification vids)|
                                   +--------------------+
```

**External Services:**

```
+------------------+       +------------------+       +------------------+
|  M-Pesa Daraja   |       |  SendGrid / SMTP |       |  Cloudflare R2   |
|  (STK Push, B2C) |       |  (email)         |       |  (file storage)  |
+--------+---------+       +--------+---------+       +--------+---------+
         |                          |                          |
         |  POST /mpesa/stkpush     |  Nodemailer SMTP         |  Presigned URLs
         |  POST /mpesa/b2c         |  (Transactional)         |  (PUT/GET)
         |  Callback to             |  - Welcome emails         |
         |  /api/webhooks/mpesa/*   |  - Verification result    |
         |                          |  - Milestone release      |
         |                          |  - Payout notifications   |
         |                          |  - 2FA codes              |
         +--------------------------+--------------------------+
```

---

## 2. Request Flows

### 2.1 Trainee Enrolment Flow

```
Trainee                       Next.js                     M-Pesa                 Redis/Worker
  |                             |                           |                       |
  | POST /api/v1/enrolments     |                           |                       |
  | { courseId }                |                           |                       |
  |---------------------------->|                           |                       |
  |                             | Validate course, capacity |                       |
  |                             | Create Enrolment          |                       |
  |                             | (status=PENDING_PAYMENT)  |                       |
  |                             | Generate checkout req ID  |                       |
  |                             |                           |                       |
  |                             | POST /mpesa/stkpush       |                       |
  |                             |-------------------------->|                       |
  |                             | { Amount, Phone, Ref }    |                       |
  |                             |                           |                       |
  |                             |  { CheckoutRequestID,     |                       |
  |    { checkoutRequestID }    |    ResponseCode:0 }       |                       |
  |<----------------------------|---------------------------|                       |
  |                             |                           |                       |
  |   [User enters M-Pesa PIN]  |                           |                       |
  |                             |                           |                       |
  |                             |                           |  [Async] POST Callback |
  |                             |  POST /webhooks/mpesa/    |  /confirmation        |
  |                             |  confirmation             |---------------------->|
  |                             |<--------------------------|                       |
  |                             |                           |                       |
  |                             | Validate Origin + Signature                      |
  |                             | Enqueue job:              |                       |
  |                             | mpesa-callbacks:          |                       |
  |                             | process-stk-callback      |                      |
  |                             |-------------------------------------------------->|
  |                             |                           |                       |
  |                             |                           |           Worker processes:
  |                             |                           |           1. Idempotency check
  |                             |                           |           2. Update enrolment
  |                             |                           |              -> ACTIVE
  |                             |                           |           3. Create 3 milestones
  |                             |                           |              (25%, 50%, 25%)
  |                             |                           |           4. Insert ledger entry
  |                             |                           |           5. Enqueue email job
  |                             |                           |           6. Send confirmation
  |                             |                           |<----------------------|
  |                             |                           |                       |
  |  [Poll or WS] Check status  |                           |                       |
  |---------------------------->|                           |                       |
  |   { status: ACTIVE,         |                           |                       |
  |     milestones: [...] }     |                           |                       |
  |<----------------------------|                           |                       |
```

### 2.2 Milestone Release Flow

```
Trainer                    Trainee                   Backend                   Worker (24h delay)
  |                          |                          |                          |
  | POST .../milestone/      |                          |                          |
  | trainer-confirm          |                          |                          |
  |------------------------->|                          |                          |
  |                          | Update milestone         |                          |
  |                          | TRAINER_CONFIRMED         |                          |
  |                          |                          |                          |
  |                          | POST .../milestone/      |                          |
  |                          | trainee-confirm          |                          |
  |                          |------------------------->|                          |
  |                          |                          | Enqueue delayed job:     |
  |                          |                          | milestone-release:       |
  |                          |                          | release-milestone        |
  |                          |                          | (delay=86400000ms)       |
  |                          |                          |------------------------->|
  |                          |                          |                          |
  |                          |                          |             [After 24h]
  |                          |                          |             1. Verify still
  |                          |                          |                TRAINEE_CONFIRMED
  |                          |                          |             2. Update -> RELEASED
  |                          |                          |             3. Update trainer
  |                          |                          |                available_balance
  |                          |                          |             4. Insert ledger entry
  |                          |                          |             5. Increment
  |                          |                          |                currentMilestone
  |                          |                          |             6. Check if all 3
  |                          |                          |                done -> COMPLETED
  |                          |                          |             7. Enqueue email job
  |                          |                          |<-------------------------|
```

### 2.3 Payout Flow

```
Trainer                    Backend                    Worker (payouts)         M-Pesa
  |                          |                          |                       |
  | POST /payouts/request-2fa|                          |                       |
  |------------------------->|                          |                       |
  |  { email code }          | Generate & send 2FA code |                       |
  |<-------------------------|                          |                       |
  |                          |                          |                       |
  | POST /payouts/request    |                          |                       |
  | { amount, phone, code }  |                          |                       |
  |------------------------->|                          |                       |
  |                          | Validate 2FA code        |                       |
  |                          | Idempotency key check    |                       |
  |                          | Atomically deduct        |                       |
  |                          | available_balance        |                       |
  |                          | Create Payout (PENDING)  |                       |
  |                          | Enqueue job              |                       |
  |                          |------------------------->|                       |
  |                          |                          | Deduct balance         |
  |                          |                          | (safety check)         |
  |                          |                          | POST /mpesa/b2c        |
  |                          |                          |----------------------->|
  |                          |                          |                       |
  |                          |                          |   { ResponseCode:0,    |
  |                          |                          |     ConversationID }   |
  |                          |                          |<-----------------------|
  |                          |                          |                       |
  |                          |                          | [Async] B2C Result    |
  |                          |  POST /webhooks/mpesa/   |----------------------->|
  |                          |  b2c-result              |                       |
  |                          |<-------------------------|                       |
  |                          | Enqueue callback job     |                       |
  |                          |                          |  Worker processes:     |
  |                          |                          |  1. Mark payout COMPLETED
  |                          |                          |  2. Insert ledger      |
  |                          |                          |  3. Send email         |
  |                          |                          |                       |
  |                          | On failure (retry x3):   |                       |
  |                          |  - Refund balance        |                       |
  |                          |  - Mark payout FAILED    |                       |
  |                          |  - Notify trainer        |                       |
```

---

## 3. Authentication Flow

```
1. Register / Login
   - Server validates credentials
   - Creates JWT access token (15m) + refresh token (7d)
   - Sets httpOnly, secure, SameSite=Strict cookies
   - Refresh token hash stored in Redis with expiry

2. Request lifecycle
   - Middleware reads access token from cookie
   - Validates signature + expiry
   - Attaches user to request context
   - On expiry, middleware calls /auth/refresh

3. Refresh rotation
   - Old refresh token invalidated (removed from Redis)
   - New access + refresh tokens issued
   - If refresh token is reused after rotation -> revoke all (theft detection)

4. Logout
   - Blacklist access token in Redis until original expiry
   - Remove refresh token from Redis
```

---

## 4. Caching Strategy

| Cache Key Pattern | TTL | Purpose |
|---|---|---|
| `trainers:list:{query_hash}` | 60s | Public trainer listings |
| `courses:list:{query_hash}` | 60s | Published course listings |
| `trainer:{id}:profile` | 120s | Public trainer profile |
| `user:{id}:session` | Until logout | Session data |
| `rate:limit:{ip}:{route}` | Variable | Rate limiting (sliding window) |
| `token:blacklist:{jti}` | Until access token expiry | Revoked tokens |

**Invalidation:** On trainer/course update, delete the corresponding cache key. On enrolment/payout/balance change, invalidate all trainer-list caches.

---

## 5. Data Separation & Ledger Integrity

**Core Principle:** No application code directly updates a user's financial balance outside of BullMQ worker transactions. All balance-affecting operations go through the append-only `TransactionLedger`.

**Flow for every financial mutation:**

```
1. API handler creates ledger entry (type, direction, amount, balanceBefore, balanceAfter)
2. Worker recalculates balance from ledger SELECT SUM(...) WHERE userId = ?
3. Worker updates user's available_balance
4. If worker crashes mid-flight, the ledger is the source of truth for reconciliation
```

**Reconciliation job (cron nightly):** Compares M-Pesa statements against `mpesaTransactionId` in the ledger, flags any discrepancies.

---

## 6. Error Handling Conventions

All API responses follow:

```typescript
// Success
{ data: T, meta?: PaginationMeta }

// Error
{ error: { code: string, message: string, details?: any } }

// Pagination
{ data: T[], meta: { page: number, perPage: number, total: number, totalPages: number } }

// HTTP status codes
200 OK          - Success
201 Created     - Resource created
400 Bad Request - Validation error
401 Unauthorized- No/invalid token
403 Forbidden   - Insufficient role
404 Not Found   - Resource not found
409 Conflict    - Duplicate / state conflict
422 Unprocessable - Business logic rejection
429 Too Many Requests - Rate limited
500 Internal Server Error - Unhandled
```

---

## 7. Security Considerations

- **M-Pesa Webhooks:** Validate origin IP range (published by Safaricom), verify payload signature with passkey, require mutual TLS in production.
- **Rate Limiting:** 10 req/s per IP on auth endpoints, 100 req/s on read endpoints, 30 req/s on write endpoints.
- **Idempotency:** All payment/payout endpoints require `Idempotency-Key` header. Rejected on repeat with same key within 24h.
- **Upload Validation:** Files scanned for malware, limited to 10MB, only PDF/JPEG/PNG/MP4 for verification docs.
- **CORS:** Strict origin whitelist, no wildcard in production.
- **Data Privacy:** Phone numbers and emails never exposed in public API responses. Trainer's `idDocumentUrl` and `verificationVideoUrl` are admin-only.
