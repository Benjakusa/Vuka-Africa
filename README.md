# Vuka Africa

Vuka is a modern, comprehensive learning and training management platform designed to connect trainees with expert trainers. It provides robust tools for course management, enrolment, milestone tracking, and secure M-Pesa payments.

## Features

- **Trainee Portal:** Browse courses, enrol seamlessly with M-Pesa integration, and track learning milestones.
- **Trainer Dashboard:** Create courses, manage enrolments, track student progress, and monitor earnings/payouts.
- **Admin Panel:** Platform oversight, user management, and dispute resolution.
- **M-Pesa Integration:** Fully automated STK Push for payments and B2C for payouts.
- **Background Processing:** Reliable job queues using BullMQ and Redis for payments, emails, and milestones.
- **Real-time Database:** Powered by Supabase for high-performance, secure Row-Level Security (RLS) data access.

## Tech Stack

- **Frontend:** React (Vite), React Router, Tailwind CSS, Zustand, TanStack Query.
- **Backend Workers:** Node.js, BullMQ, Redis, ioredis.
- **Database & Auth:** Supabase (PostgreSQL).

## Environment Setup

1. Copy `.env.example` to `.env` and fill in the required variables:
   - Supabase URL and Keys
   - Redis Connection URL
   - M-Pesa Credentials
2. Run `npm install` to install dependencies.
3. Start the frontend dev server:
   ```bash
   npm run dev
   ```
4. Start backend workers in separate terminals (e.g., M-Pesa worker):
   ```bash
   npm run worker:mpesa
   ```

## Contact & Ownership

**Author:** Benard Oloo Ochieng  
**Email:** [ben@opendesk.co.ke](mailto:ben@opendesk.co.ke)  
**Phone:** 0722839617

## License

This software is **Proprietary**. All rights reserved.
Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without explicit permission from the author.
