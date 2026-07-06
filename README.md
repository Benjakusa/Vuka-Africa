# Vuka — U-Learn, U-Earn

A two-sided Kenyan skill-training marketplace connecting trainees with verified trainers. Milestone-based escrow payments via M-Pesa ensure trainers get paid only when students learn.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Prisma ORM, PostgreSQL, Redis (Upstash)
- **Payments:** M-Pesa Daraja API (STK Push & B2C) with escrow milestone releases
- **Queue:** BullMQ for email, payment, and milestone release jobs
- **Storage:** Cloudflare R2 (S3-compatible)
- **Auth:** JWT access/refresh tokens (httpOnly cookies)
- **Testing:** Vitest (unit/integration), Playwright (E2E)
- **Deployment:** Railway (API + workers), Vercel (frontend)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Lint code |
| `npm test` | Run unit/integration tests |
| `npm run test:e2e` | Run E2E tests |
| `npx prisma studio` | Open database GUI |
