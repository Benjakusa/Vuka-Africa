# Vuka Afrique

Vuka Afrique is a modern, comprehensive learning and training management platform designed to connect trainees with expert trainers. It provides robust tools for course management, secure enrolment, milestone tracking, real-time payouts, and dispute resolution.

---

## 🌟 Key Features

### Trainee Portal

- **Course Discovery:** Browse a catalog of physical, virtual, and hybrid courses.
- **Seamless Enrolment:** One-click enrolments with fully automated M-Pesa STK Push payments.
- **Milestone Tracking:** Track learning progress and confirm milestones to release funds to trainers.
- **Reviews & Ratings:** Leave transparent feedback for completed courses.

### Trainer Dashboard

- **Course Management:** Create, publish, and manage detailed course listings including prerequisites and session counts.
- **Earnings & Payouts:** Real-time wallet tracking and automated M-Pesa B2C payouts.
- **Student Management:** View active enrolments and track student progress.
- **Profile Verification:** Tiered verification system to establish trust and credibility on the platform.

### Administrator Panel

- **Platform Oversight:** Monitor all platform activity, active users, and system health.
- **Dispute Resolution:** Handle and resolve conflicts between trainees and trainers regarding milestones or payments.
- **Financial Controls:** Manage global platform configurations, commission rates, and payout limits.

### DevOps & Infrastructure

- **Automated Payments:** Webhook processing for Safaricom M-Pesa (B2C & STK Push).
- **Background Jobs:** Resilient task processing using BullMQ for emails, payouts, and scheduled reconciliation.

---

## 🛠 Tech Stack & Architecture

### Frontend

- **Framework:** React 18 with Vite
- **Routing:** React Router v7
- **State Management:** Zustand (global state) & TanStack Query (server state & caching)
- **Styling:** Tailwind CSS with a custom modern UI design system (Tailwind Merge, clsx)
- **Icons & Components:** Lucide React, Headless UI patterns

### Backend & Background Processing

- **Runtime:** Node.js (via `tsx`)
- **Task Queue:** BullMQ powered by Redis (`ioredis`)
- **Workers:**
  - `mpesa-worker.ts`: Handles async M-Pesa callbacks and payment verifications.
  - `milestone-worker.ts`: Manages time-based funds release after the 24-hour cooling-off period.
  - `payout-worker.ts`: Executes M-Pesa B2C payout disbursements.
  - `email-worker.ts`: Reliable transactional email delivery using Nodemailer.
  - `cron-worker.ts`: Daily scheduled reconciliation for stale pending payments.

### Database & Authentication

- **Provider:** Supabase (PostgreSQL)
- **Security:** Row-Level Security (RLS) ensuring strict data privacy and isolation.
- **Database Schema:** Defined in pure SQL (`supabase-schema.sql`) and managed through Supabase dashboard.

---

## 📂 Project Structure

```text
├── backend/
│   ├── lib/              # Shared backend utilities (Redis, DB clients, M-Pesa logic)
│   ├── services/         # Business logic modules (Admin, Course, Payouts)
│   └── workers/          # BullMQ queue processors
├── src/
│   ├── components/       # Reusable React UI components (layout, shared, forms)
│   ├── lib/              # Frontend utilities and Supabase client
│   ├── pages/            # Routable page components grouped by user role
│   ├── services/         # API wrappers interacting with Supabase
│   └── stores/           # Zustand state containers
├── supabase/
│   └── functions/        # Supabase Edge Functions (e.g., M-Pesa webhook handler)
├── migrate.sql           # Active database migration scripts
├── supabase-schema.sql   # Primary database schema definition
└── package.json          # Project dependencies and npm scripts
```

---

## 🚀 Local Development Setup

### Prerequisites

- **Node.js** (v18+ recommended)
- **Redis Server** (running locally on port 6379, or a remote Redis instance)
- **Supabase Account** (or local Supabase CLI setup)

### 1. Clone & Install

```bash
git clone https://github.com/Benjakusa/Vuka-Africa.git
cd Vuka-Africa
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` (or create one) and configure the following required variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis Configuration (for BullMQ)
REDIS_URL=redis://localhost:6379

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_PASSKEY=your-passkey
MPESA_SHORTCODE=your-shortcode
MPESA_B2C_SHORTCODE=your-b2c-shortcode
```

### 3. Database Initialization

Execute the SQL commands found in `supabase-schema.sql` within your Supabase project's SQL editor to generate all required tables, enums, relationships, and RLS policies.

### 4. Start the Application

You will need multiple terminal windows to run the frontend and the background workers simultaneously.

**Terminal 1: Frontend Dev Server**

```bash
npm run dev
```

**Terminal 2: Payment Webhook Worker**

```bash
npm run worker:mpesa
```

**Terminal 3: Payout Disbursement Worker**

```bash
npm run worker:payout
```

_(You can also run `npm run worker:email`, `worker:milestone`, and `worker:cron` depending on the features you are testing)._

---

## 📜 Available NPM Scripts

| Script                     | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| `npm run dev`              | Starts the Vite development server.                               |
| `npm run build`            | Compiles TypeScript and builds the production bundle via Vite.    |
| `npm run typecheck`        | Validates TypeScript compilation without emitting files.          |
| `npm run lint`             | Runs ESLint across the `src/` directory.                          |
| `npm run worker:mpesa`     | Starts the background worker for processing M-Pesa STK callbacks. |
| `npm run worker:payout`    | Starts the background worker for executing B2C trainer payouts.   |
| `npm run worker:email`     | Starts the transactional email worker.                            |
| `npm run worker:milestone` | Starts the milestone funds release worker.                        |

---

## 📞 Contact & Ownership

**Author:** Benard Oloo Ochieng  
**Email:** [ben@opendesk.co.ke](mailto:ben@opendesk.co.ke)  
**Phone:** 0722839617

## ⚖️ License

This software is **Proprietary**. All rights reserved.
Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without explicit written permission from the author.
