# Vuka Architecture

## Overview

Vuka is a monolith designed for future extraction into microservices. It uses Next.js 14 App Router for both server-rendered pages and API routes, with BullMQ workers handling async processes. The business logic is strictly separated from the transport layer.

---

## Architecture Decision Records (ADRs)

### ADR-001: Monolith First

**Status:** Accepted  
**Context:** Speed of delivery + team size.  
**Decision:** Build as a single Next.js deployment with co-located API routes, services, and workers.  
**Consequences:** Faster iteration; extraction path preserved via `services/` separation of concerns.

### ADR-002: M-Pesa Escrow with Milestone Payouts

**Status:** Accepted  
**Context:** Trust between strangers in a skill-training marketplace.  
**Decision:** Trainee pays full amount upfront via STK Push. Funds are held notionally (M-Pesa processes immediately); the system tracks the escrow split. Payouts release in 3 milestones (25%/50%/25%).  
**Consequences:** Commission (20%, 12%, or 0%) is deducted at enrolment time. All financial changes go through `TransactionLedger`. No direct balance mutations outside worker-controlled transactions.

### ADR-003: First 100 Free

**Status:** Accepted  
**Context:** Need to attract initial trainer supply.  
**Decision:** First 100 trainers get 0% commission for life + free verification. Implemented with `Serializable` transaction isolation to prevent race conditions on the last few spots.  
**Consequences:** `PlatformConfig.trainerCount` is the source of truth. Atomic increment + row lock prevents phantom reads.

### ADR-004: Redis as Single Source of Truth for Session Data

**Status:** Accepted  
**Context:** Stateless API with JWT; need token revocation, rate limiting, idempotency.  
**Decision:** Redis holds: token version counters, blacklisted JTIs, 2FA codes, rate limit counters, idempotency keys, M-Pesa dedup receipts, query caches.  
**Consequences:** Redis failure would degrade auth and financial operations. Upstash provides HA. BullMQ queues are persisted in the same Redis.

### ADR-005: Append-Only Ledger

**Status:** Accepted  
**Context:** Financial audit trail and dispute resolution.  
**Decision:** All financial transactions go through `TransactionLedger` as immutable entries. No direct `UPDATE` on user balances outside of worker-controlled `$transaction` operations.  
**Consequences:** Complete audit trail. Read-only balance queries are fast. Ledger queries by `(userId, type, createdAt)` are indexed.

### ADR-006: Database Triggers for Denormalized Counters

**Status:** Accepted  
**Context:** Avoiding N+1 queries for trainer ratings and student counts.  
**Decision:** PostgreSQL triggers auto-update `Trainer.averageRating`, `totalReviews`, and `totalStudents`.  
**Consequences:** Immediate consistency; no stale cache problem. Verified by `EXPLAIN ANALYZE`.

---

## Escrow Flow

```
Trainee                      Vuka                    M-Pesa
  │                           │                        │
  │  POST /enrolments         │                        │
  │━━━━━━━━━━━━━━━━━━━━━━━━━▶│                        │
  │                           │  STK Push (KES n)      │
  │                           │━━━━━━━━━━━━━━━━━━━━━━▶│
  │  M-Pesa Prompt            │                        │
  │◀━━━━━━━━━━━━━━━━━━━━━━━━━│                        │
  │  Enter PIN                │                        │
  │━━━━━━━━━━━━━━━━━━━━━━━━━▶│                        │
  │                           │  Callback (receipt)     │
  │                           │◀━━━━━━━━━━━━━━━━━━━━━━│
  │                           │                        │
  │                           │  ┌─ Activate enrolment │
  │                           │  ├─ Create 3 milestones│
  │                           │  └─ Ledger entries     │
  │                           │                        │
  │  ╔═══════════════════════════════════════════╗     │
  │  ║  Milestone 1 (25%) — Trainer confirms     ║     │
  │  ║  → Trainee confirms → 24h delay → Release ║     │
  │  ╚═══════════════════════════════════════════╝     │
  │  ╔═══════════════════════════════════════════╗     │
  │  ║  Milestone 2 (50%) — same flow             ║     │
  │  ╚═══════════════════════════════════════════╝     │
  │  ╔═══════════════════════════════════════════╗     │
  │  ║  Milestone 3 (25%) → Enrolment Complete    ║     │
  │  ╚═══════════════════════════════════════════╝     │
  │                           │                        │
  │  POST /payouts/request    │                        │
  │━━━━━━━━━━━━━━━━━━━━━━━━━▶│                        │
  │  2FA code via email       │                        │
  │◀━━━━━━━━━━━━━━━━━━━━━━━━━│                        │
  │  POST /payouts/confirm    │                        │
  │━━━━━━━━━━━━━━━━━━━━━━━━━▶│                        │
  │                           │  B2C Payment           │
  │                           │━━━━━━━━━━━━━━━━━━━━━━▶│
  │                           │  Callback → Complete   │
  │                           │◀━━━━━━━━━━━━━━━━━━━━━━│
```

## Caching Strategy

| Cache Key                            | TTL                          | Invalidation                             |
| ------------------------------------ | ---------------------------- | ---------------------------------------- |
| `mpesa:access_token`                 | 3599s (expires - 60s buffer) | Auto-expiry                              |
| `trainers:list:{hash}`               | 60s                          | On trainer profile update, course create |
| `trainer:{id}:profile`               | 120s                         | On trainer profile update                |
| `courses:list:{hash}`                | 60s                          | On course create/update                  |
| `course:{slug}`                      | 120s                         | On course update                         |
| `token:blacklist:{jti}`              | Var (JWT expiry)             | Auto-expiry                              |
| `token:version:{userId}`             | Permanent                    | Incremented on password change/logout    |
| `payout:code:{trainerId}:{payoutId}` | 600s                         | Deleted after use                        |
| `idempotent:{prefix}:{key}`          | 86400s                       | Auto-expiry                              |
| `mpesa:receipt:{receipt}`            | 30 days                      | Auto-expiry                              |
| `mpesa:b2c:{convId}`                 | 30 days                      | Auto-expiry                              |

## Queue Architecture

| Queue               | Concurrency | Retries         | Purpose                       |
| ------------------- | ----------- | --------------- | ----------------------------- |
| `mpesa-callbacks`   | 2           | 3               | Process STK/B2C callbacks     |
| `payouts`           | 1           | 5 (exponential) | Initiate B2C payments         |
| `milestone-release` | 5           | 3               | 24h delayed milestone release |
| `email`             | 3           | 5               | Send transactional emails     |
| `reconciliation`    | 1           | 1               | Daily cron tasks              |

## Security

- **Auth:** JWT access (15m) + refresh (7d) tokens in httpOnly, Secure, SameSite=Strict cookies
- **CSRF:** Double-submit cookie pattern with `timingSafeEqual`
- **Rate Limiting:** Redis-backed per-IP/user/email (login 5/15min, register 3/hr, payout 2/hr)
- **Encryption:** AES-256-GCM for PII at rest (phone, email masking)
- **File Validation:** Magic byte detection (PDF: `%PDF`, JPEG: `FFD8`, PNG: `89PNG`)
- **M-Pesa Webhooks:** IP whitelist + HMAC-SHA256 signature verification
- **CSP:** Strict Content-Security-Policy, COOP, CORP, COEP headers

## Scaling

- **Database:** Connection pooling via Prisma (connection_limit=20). PgBouncer recommended for production.
- **Caching:** Redis LRU eviction with `allkeys-lru` policy.
- **Workers:** Scale by adding instances; idempotency prevents duplicate processing.
- **CDN:** Cloudflare R2 with public CDN for static assets. Cache-Control: immutable for versioned files.
- **Monitoring:** Sentry for errors, health endpoint (`/api/health`) for uptime, daily reconciliation alerts via email.

## Future Extraction Path

| Module                                                         | Extraction Target       | Communication             |
| -------------------------------------------------------------- | ----------------------- | ------------------------- |
| `services/auth.service.ts`                                     | Standalone auth service | JWT verification + Redis  |
| `lib/mpesa.ts` + `services/payout.service.ts`                  | Payment service         | Event bus (Redis Pub/Sub) |
| `workers/email-worker.ts`                                      | Notification service    | BullMQ queue              |
| `services/course.service.ts` + `services/enrolment.service.ts` | Course service          | REST/gRPC                 |
