# Vuka — Scalability & Failure Mode Analysis

## Throughput Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Concurrent enrolments | 100/min | Each triggers STK Push + 2 DB writes |
| Trainer listing queries | 500/min | Cached for 60s, ~10 DB queries/min |
| M-Pesa callback processing | 50/min | Async via BullMQ |
| Email sending | 200/min | Queued, rate-limited by SendGrid |
| Concurrent users | 1,000 | SSR pages, CDN for static assets |
| Database connections | 20 | Prisma connection pool |

## Single Points of Failure

### PostgreSQL
**Risk:** Database goes down → entire platform is down.
**Mitigation:**
- Managed Railway PostgreSQL with automated failover
- Connection pooling via Prisma (`connection_limit: 20`)
- Daily automated backups
- Health check at `/api/health` alerts on failure
- **Recovery:** `psql $DATABASE_URL < backup.sql` (estimated RTO: 30 min)

### Redis (Upstash)
**Risk:** Redis unavailable → rate limiting bypassed, token revocation delayed, M-Pesa dedup lost, BullMQ queues paused.
**Mitigation:**
- Upstash provides HA with automatic failover
- BullMQ uses Redis as queue backend; if Redis goes down, jobs are not lost (persisted to disk)
- Rate limiting: if Redis is down, requests are allowed through (degraded but functional)
- **Recovery:** Upstash auto-recovers. RTO: < 5 min.

### API Server
**Risk:** Single instance fails → downtime during traffic.
**Mitigation:**
- Railway runs 2+ instances behind load balancer
- Stateless (JWT auth, session in Redis)
- Health check endpoint for load balancer to drain unhealthy instances
- **Recovery:** Railway auto-restarts failed instances. RTO: < 30s.

### Worker Processes
**Risk:** Worker crashes mid-job.
**Mitigation:**
- BullMQ retries failed jobs (up to 5 times for payouts)
- Stalled job detection (30s interval) re-queues stuck jobs
- Idempotency keys prevent duplicate processing
- Graceful shutdown via `SIGTERM` handler
- **Recovery:** Worker auto-restarted by Railway. Jobs re-processed on restart.

### M-Pesa API
**Risk:** Safaricom API is slow or unavailable.
**Impact:** New enrolments and payouts blocked. Existing enrolments unaffected.
**Mitigation:**
- STK Push has 15s timeout; failure returns error to user immediately
- B2C retries 5 times with exponential backoff
- Daily reconciliation cron identifies stuck payouts and refunds
- **Recovery:** When Safaricom recovers, retries succeed automatically.

## Load Testing Plan

### Scenario 1: Normal Load
- 100 concurrent users browsing courses + 10 enrolling simultaneously
- Expected: P95 response < 500ms for reads, < 2s for writes (STK Push)

### Scenario 2: Flash Sale
- 500 concurrent users hitting course listing + 50 enrolling
- Expected: DB connection pool saturated at ~20 connections
- **Mitigation:** Increase `connection_limit` to 50, add PgBouncer

### Scenario 3: Callback Burst
- 30 M-Pesa callbacks received in 5 seconds
- BullMQ queues them; worker processes at concurrency 2
- Expected: Queue backlog cleared within 30s

## Backpressure

| Component | Backpressure Mechanism | Limit |
|-----------|----------------------|-------|
| PostgreSQL | Prisma connection pool | 20 connections |
| Redis | Maxmemory + `allkeys-lru` eviction | Upstash plan limit |
| BullMQ | Queue max size (configurable) | 10,000 jobs per queue |
| Rate Limiter | Redis counters with TTL | Per-endpoint limits |
| File Upload | `MAX_UPLOAD_SIZE` check | 10MB images, 50MB videos |

## Graceful Degradation

| Failure | User Experience | Degraded Feature |
|---------|----------------|------------------|
| Redis down | Full functionality | Rate limiting bypassed, caches stale |
| Email down | Queued emails delayed | Notifications delayed but retried |
| M-Pesa down | Enrolments fail with clear error | New payments blocked; existing OK |
| R2 down | Images fail to load | Text content still accessible |
| PostgreSQL down | Platform unavailable | Error page shown |

## Disaster Recovery

### Backup Schedule
- **Database:** Daily automated backup (Railway). Retention: 7 days.
- **Code:** GitHub repository (immutable history).
- **Uploads:** R2 bucket (versioning enabled).
- **Config:** Secrets in Railway/Vercel dashboard + `.env.example`.

### Restore Procedure
```bash
# 1. Download latest backup from Railway dashboard
# 2. Restore to new database
psql $NEW_DATABASE_URL < backup.sql
# 3. Point app to new database
railway env set DATABASE_URL="$NEW_DATABASE_URL"
# 4. Verify health
curl https://api.vuka.africa/api/health
# 5. Re-deploy
railway up
```

## Monitoring Alerts

| Alert | Threshold | Action |
|-------|-----------|--------|
| Health check failure | 3 consecutive failures | Notify admin via email + Sentry |
| Queue backlog | > 1,000 jobs in any queue | Notify admin (possible worker failure) |
| Failed STK Push rate | > 10% failure rate in 1hr | Investigate M-Pesa credentials/balance |
| Payout retry exhaustion | Any payout reaches max retries | Manual investigation |
| Database CPU | > 80% for 5 min | Scale up or add read replica |
| Sentry error rate | > 50 errors/hr | Investigate and fix |
