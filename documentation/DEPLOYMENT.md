# Vuka Deployment Guide

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                 │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Next.js App Router (SSR/SSG)                   │ │
│  │  PWA via @serwist/next                          │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│                    Railway (Backend)                  │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │ Next.js API     │  │ BullMQ Workers           │  │
│  │ (server.js)     │  │ ├─ mpesa-callbacks       │  │
│  │                 │  │ ├─ payouts               │  │
│  │ Health: /api/health│ ├─ milestone-release     │  │
│  └─────────────────┘  │ ├─ email                 │  │
│                        │ └─ reconciliation (cron) │  │
│  ┌──────────────────────────────────────────────┐  │
│  │  PostgreSQL (Railway managed) + Redis (Upstash) │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 20+
- Railway account (railway.app)
- Vercel account (vercel.com)
- Upstash Redis account (upstash.com)
- M-Pesa sandbox/production credentials
- Cloudflare R2 bucket
- SendGrid or SMTP credentials

## Environment Setup

1. Copy `.env.example` to `.env.production`
2. Fill in all variables. Key values:

```bash
# Production Database (Railway PostgreSQL)
DATABASE_URL="postgresql://user:pass@railway-host:5432/vuka"

# Redis (Upstash)
REDIS_URL="redis://default:token@upstash-host:6379"

# JWT — generate with: openssl rand -base64 64
JWT_ACCESS_SECRET="64-byte-base64-secret"
JWT_REFRESH_SECRET="different-64-byte-base64-secret"
JWT_ISSUER="vuka"

# M-Pesa Production
MPESA_ENV="production"
MPESA_CONSUMER_KEY="your-key"
MPESA_CONSUMER_SECRET="your-secret"
MPESA_PASSKEY="your-passkey"
MPESA_SHORTCODE="your-paybill"
MPESA_B2C_SHORTCODE="your-b2c-shortcode"
MPESA_CALLBACK_URL="https://api.vuka.africa/api/webhooks/mpesa/confirmation"
MPESA_B2C_RESULT_URL="https://api.vuka.africa/api/webhooks/mpesa/b2c-result"

# R2
R2_ACCESS_KEY_ID="your-r2-key"
R2_SECRET_ACCESS_KEY="your-r2-secret"
R2_BUCKET_NAME="vuka-production"

# Email
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_USER="apikey"
EMAIL_PASS="your-sendgrid-api-key"
EMAIL_FROM="Vuka <noreply@vuka.africa>"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="your-public-sentry-dsn"
```

## Railway Deployment

### 1. Create Project

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link
```

### 2. Configure Environment

```bash
railway env set DATABASE_URL="..."
railway env set REDIS_URL="..."
# ... set all env vars from .env.production
```

### 3. Deploy

```bash
git push main
# OR
railway up
```

The `Dockerfile` at project root handles the build. The `railway.json` configures health checks and start command.

### 4. Database Migration

```bash
railway run npx prisma migrate deploy
# OR for seed:
railway run npm run db:seed
```

### 5. Worker Processes

Railway supports multiple processes. In `railway.json` or via Railway dashboard, configure:

| Service | Command | Replicas |
|---------|---------|----------|
| API | `node server.js` | 2 (min) |
| M-Pesa Worker | `npx tsx workers/mpesa-worker.ts` | 1 |
| Milestone Worker | `npx tsx workers/milestone-worker.ts` | 1 |
| Payout Worker | `npx tsx workers/payout-worker.ts` | 1 |
| Email Worker | `npx tsx workers/email-worker.ts` | 1 |
| Cron Worker | `npx tsx workers/cron-worker.ts` | 1 |

## Vercel Deployment

### 1. Connect Repository

In Vercel dashboard, import the GitHub repo. Set:

- **Framework:** Next.js
- **Build Command:** `npm run build`
- **Output:** `.next`
- **Environment Variables:** Copy all `NEXT_PUBLIC_*` vars + `REDIS_URL`, `DATABASE_URL`, etc.

### 2. Domain

Configure custom domain (e.g., `vuka.africa`). Vercel handles SSL automatically.

### 3. PWA

The service worker is compiled at build time via `@serwist/next`. Ensure `manifest.json` and icons are in `/public`.

## M-Pesa Production Switch

1. Set `MPESA_ENV=production`
2. Update callback URLs to HTTPS production endpoints:
   - `https://api.vuka.africa/api/webhooks/mpesa/confirmation`
   - `https://api.vuka.africa/api/webhooks/mpesa/b2c-result`
   - `https://api.vuka.africa/api/webhooks/mpesa/b2c-timeout`
3. Whitelist Safaricom IPs in `MPESA_IP_WHITELIST`
4. Test with a small transaction in production (KES 1-10)
5. Verify HMAC signatures are being validated (sandbox bypasses this)

## Post-Deployment Checklist

- [ ] `/api/health` returns `200` with `database: "ok"` and `redis: "ok"`
- [ ] Can register a new user
- [ ] Can login and receive cookies
- [ ] Can browse courses and trainer profiles
- [ ] Create a course as a trainer
- [ ] Enrol in a course (M-Pesa sandbox mode)
- [ ] Verify callback processing works (check `Enrolment.status === 'ACTIVE'`)
- [ ] Milestone confirm + release works
- [ ] Payout request + B2C works
- [ ] Sentry reports errors correctly
- [ ] CSP headers present in response
- [ ] PWA installable on mobile
- [ ] Rate limiting activates on brute force

## Backup & Recovery

- **PostgreSQL:** Railway provides automated daily backups. Download via Railway dashboard.
- **Redis:** Upstash provides point-in-time recovery.
- **R2:** Enable versioning on the bucket.
- **Restore:** `psql $DATABASE_URL < backup.sql`

## Monitoring

- **Sentry:** Error tracking and performance monitoring
- **Railway Logs:** `railway logs` for API and worker logs
- **Health Check:** `GET /api/health` — monitoring service pings every 60s
- **Reconciliation:** Daily cron job at 2AM EAT sends admin report via email

## Scaling

- **API:** Railway auto-scales based on CPU/memory. Configure `minScale: 2` and `maxScale: 5`.
- **Workers:** Add more worker instances for higher throughput. Idempotency prevents duplicates.
- **Database:** Upgrade PostgreSQL plan or add read replicas. PgBouncer for connection pooling.
- **Redis:** Upstash scales automatically. Monitor memory usage.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Health check fails on database | PostgreSQL not accessible | Check `DATABASE_URL` and network |
| Health check fails on Redis | Redis not accessible | Check `REDIS_URL` |
| STK Push fails | Invalid M-Pesa credentials | Verify `MPESA_CONSUMER_KEY/SECRET` |
| B2C fails | Insufficient M-Pesa balance | Top up the paybill account |
| Callbacks not received | URLs not HTTPS or inaccessible | Check `MPESA_CALLBACK_URL` |
| Emails not sending | SMTP credentials wrong | Verify `EMAIL_HOST/USER/PASS` |
| PWA not installing | Missing icons or manifest | Check `public/manifest.json` |
