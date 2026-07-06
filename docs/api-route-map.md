# Vuka — Full API Route Map

All endpoints are prefixed with `/api/v1`. All authenticated endpoints require JWT in httpOnly cookie (access token).

**Error format:** `{ error: { code: string, message: string, details?: any } }`
**Paginated format:** `{ data: T[], meta: { page, perPage, total, totalPages } }`

---

## Auth

| Method | Path | Auth | Zod Request Body | Success Response | Description | Notes |
|--------|------|------|-------------------|------------------|-------------|-------|
| POST | `/auth/register` | None | `{ email: z.string().email(), password: z.string().min(8), phone: z.string().regex(/^\+254\d{9}$/), fullName: z.string().min(2), role: z.nativeEnum(UserRole) }` | `{ user: User, accessToken: string, refreshToken: string }` | Register new user | Rate: 5/min per IP. Sets httpOnly cookies. |
| POST | `/auth/login` | None | `{ email: z.string().email(), password: z.string() }` | `{ user: User, accessToken: string, refreshToken: string }` | Login | Rate: 10/min per IP. Locks after 5 failed attempts for 15min (Redis). |
| POST | `/auth/refresh` | Refresh cookie | `{}` (reads cookie) | `{ accessToken: string, refreshToken: string }` | Rotate tokens | Old refresh invalidated. Theft detection on reuse. |
| POST | `/auth/logout` | JWT | `{}` | `{ message: "logged_out" }` | Invalidate session | Blacklists access token in Redis. Removes refresh token. |
| GET | `/auth/me` | JWT | — | `{ user: User }` | Current user | Returns full user object including trainer profile if exists. |

---

## Users

| Method | Path | Auth | Zod Request Body | Success Response | Description | Notes |
|--------|------|------|-------------------|------------------|-------------|-------|
| GET | `/users/me` | JWT | — | `{ user: User & { trainer?: Trainer } }` | Own profile | Includes trainer relation. |
| PATCH | `/users/me` | JWT | `{ fullName?: string, avatarUrl?: string, phone?: string }` | `{ user: User }` | Update profile | Phone change triggers re-verification. |

---

## Trainers

| Method | Path | Auth | Zod Request Body | Success Response | Description | Notes |
|--------|------|------|-------------------|------------------|-------------|-------|
| POST | `/trainers/apply` | JWT (TRAINEE) | `{ bio: string, skills: string[], idDocumentUrl?: string }` | `{ trainer: Trainer }` | Create trainer profile | Applies "First 100 Free" logic. Transactional. |
| GET | `/trainers/:id` | Optional | — | `{ trainer: TrainerPublic }` | Public profile | Only exposes: name, avatar, bio, skills, avgRating, totalReviews, totalStudents, isVerified. |
| PATCH | `/trainers/me` | JWT (TRAINER) | `{ bio?: string, skills?: string[], idDocumentUrl?: string }` | `{ trainer: Trainer }` | Update own profile | Cannot change verification-related fields. |
| POST | `/trainers/me/verify/pay` | JWT (TRAINER) | `{}` | `{ checkoutRequestID: string, amount: 5000 }` | Initiate verification fee | Calls M-Pesa STK Push. Rate: 1/min. |
| GET | `/trainers/me/verify/status` | JWT (TRAINER) | — | `{ verificationStatus: VerificationStatus, isVerified: boolean }` | Check verification status | — |
| GET | `/trainers` | Optional | — | `{ data: TrainerPublic[], meta: PaginationMeta }` | Public listing | Query: `?search=&category=&mode=&minPrice=&maxPrice=&verifiedOnly=true&sortBy=rating&page=1&perPage=20`. Cached 60s. |

---

## Courses

| Method | Path | Auth | Zod Request Body | Success Response | Description | Notes |
|--------|------|------|-------------------|------------------|-------------|-------|
| POST | `/courses` | JWT (TRAINER) | `{ title, description, learningOutcomes, category, mode, duration, sessionCount, priceKes, maxStudents?, location? }` | `{ course: Course }` | Create course | Auto-generates slug from title. Requires verified trainer. |
| GET | `/courses` | Optional | — | `{ data: Course[], meta: PaginationMeta }` | Published courses | Query: `?search=&category=&mode=&minPrice=&maxPrice=&sortBy=newest&page=1&perPage=20`. Cached 60s. |
| GET | `/courses/:slug` | Optional | — | `{ course: CourseDetail }` | Course detail | Includes trainer public profile. Cached 120s. |
| PATCH | `/courses/:id` | JWT (TRAINER, owner) | Partial course fields | `{ course: Course }` | Update course | Cannot change slug. |
| DELETE | `/courses/:id` | JWT (TRAINER, owner) | — | `{ message: "deleted" }` | Soft delete | Sets `deletedAt`. Fails if active enrolments exist. |
| GET | `/trainers/me/courses` | JWT (TRAINER) | — | `{ data: Course[] }` | Own courses | Includes unpublished and soft-deleted. |

---

## Enrolments

| Method | Path | Auth | Zod Request Body | Success Response | Description | Notes |
|--------|------|------|-------------------|------------------|-------------|-------|
| POST | `/enrolments` | JWT (TRAINEE) | `{ courseId: string }` | `{ enrolment: Enrolment, checkoutRequestID: string }` | Enrol in course | Validates capacity, initiates STK Push. Idempotency-Key required. |
| GET | `/enrolments` | JWT (TRAINEE or TRAINER) | — | `{ data: Enrolment[], meta: PaginationMeta }` | List enrolments | Filter: `?status=ACTIVE&page=1&perPage=20`. Trainees see own, trainers see as provider. |
| GET | `/enrolments/:id` | JWT (participant) | — | `{ enrolment: EnrolmentDetail }` | Enrolment detail | Includes milestones, course, trainer. |

---

## Milestones

| Method | Path | Auth | Zod Request Body | Success Response | Description | Notes |
|--------|------|------|-------------------|------------------|-------------|-------|
| POST | `/enrolments/:enrolmentId/milestones/:milestoneId/trainer-confirm` | JWT (TRAINER, owner) | `{}` | `{ milestone: Milestone }` | Confirm delivery | Idempotency-Key. Updates status to TRAINER_CONFIRMED. |
| POST | `/enrolments/:enrolmentId/milestones/:milestoneId/trainee-confirm` | JWT (TRAINEE, owner) | `{}` | `{ milestone: Milestone }` | Confirm attendance | Idempotency-Key. Updates to TRAINEE_CONFIRMED. Enqueues delayed release job (24h). |

---

## Payments & Payouts

| Method | Path | Auth | Zod Request Body | Success Response | Description | Notes |
|--------|------|------|-------------------|------------------|-------------|-------|
| GET | `/trainers/me/earnings` | JWT (TRAINER) | — | `{ availableBalance, pendingBalance, totalEarned, totalPayouts }` | Earnings summary | Reads from ledger + balance. |
| POST | `/payouts/request-2fa` | JWT (TRAINER) | `{}` | `{ message: "code_sent" }` | Request 2FA code | Sends email with 6-digit code. Rate: 3/day. Code expires 10min. |
| POST | `/payouts/request` | JWT (TRAINER) | `{ amount: z.number().positive(), phone: z.string().regex(/^\+254\d{9}$/), code: z.string().length(6) }` | `{ payout: Payout }` | Withdraw earnings | Requires 2FA code. Idempotency-Key. Deducts balance, enqueues payout job. |
| GET | `/payouts` | JWT (TRAINER) | — | `{ data: Payout[], meta: PaginationMeta }` | Payout history | Filter: `?status=COMPLETED&page=1&perPage=20`. |

---

## Reviews

| Method | Path | Auth | Zod Request Body | Success Response | Description | Notes |
|--------|------|------|-------------------|------------------|-------------|-------|
| POST | `/enrolments/:enrolmentId/review` | JWT (TRAINEE, owner) | `{ rating: z.number().int().min(1).max(5), comment?: z.string().max(1000) }` | `{ review: Review }` | Submit review | One per enrolment, must be COMPLETED. Triggers rating recalc. |
| GET | `/trainers/:trainerId/reviews` | Optional | — | `{ data: Review[], meta: PaginationMeta }` | Trainer reviews | `?page=1&perPage=10`. Only public reviews. |

---

## Disputes

| Method | Path | Auth | Zod Request Body | Success Response | Description | Notes |
|--------|------|------|-------------------|------------------|-------------|-------|
| POST | `/enrolments/:enrolmentId/disputes` | JWT (participant) | `{ reason: z.string().min(10), milestoneId?: string }` | `{ dispute: Dispute }` | Raise dispute | Only if enrolment ACTIVE. Locks milestone from release. |
| GET | `/enrolments/:enrolmentId/disputes` | JWT (participant) | — | `{ data: Dispute[] }` | Enrolment disputes | — |

---

## Admin

| Method | Path | Auth | Request / Body | Success Response | Description | Notes |
|--------|------|------|----------------|------------------|-------------|-------|
| GET | `/admin/stats` | JWT (ADMIN) | — | `{ totalUsers, totalTrainers, totalCourses, totalEnrolments, totalRevenue, pendingVerifications, openDisputes }` | Dashboard stats | Cached 60s. |
| GET | `/admin/verifications` | JWT (ADMIN) | — | `{ data: Trainer[], meta: PaginationMeta }` | Pending verifications | `?status=PENDING&page=1`. |
| POST | `/admin/verifications/:trainerId/approve` | JWT (ADMIN) | `{}` | `{ trainer: Trainer }` | Approve verification | Sets isVerified=true, verificationStatus=APPROVED. |
| POST | `/admin/verifications/:trainerId/reject` | JWT (ADMIN) | `{ reason: z.string() }` | `{ trainer: Trainer }` | Reject verification | Sets verificationStatus=REJECTED. Sends email. |
| GET | `/admin/disputes` | JWT (ADMIN) | — | `{ data: Dispute[], meta: PaginationMeta }` | List disputes | `?status=OPEN&page=1`. |
| POST | `/admin/disputes/:id/resolve` | JWT (ADMIN) | `{ resolution: z.nativeEnum(DisputeResolution), notes?: string }` | `{ dispute: Dispute }` | Resolve dispute | May trigger fund release or refund. |
| GET | `/admin/transactions` | JWT (ADMIN) | — | `{ data: TransactionLedger[], meta: PaginationMeta }` | View ledger | `?type=TRAINEE_PAYMENT&userId=&from=&to=&page=1`. |
| GET | `/admin/users` | JWT (ADMIN) | — | `{ data: User[], meta: PaginationMeta }` | User management | `?search=&role=&isActive=&page=1`. |
| POST | `/admin/users/:id/suspend` | JWT (ADMIN) | `{}` | `{ user: User }` | Suspend user | Sets isActive=false. Cancels pending enrolments. |
| POST | `/admin/users/:id/activate` | JWT (ADMIN) | `{}` | `{ user: User }` | Activate user | Sets isActive=true. |

---

## Webhooks (no JWT — IP/ HMAC validated)

| Method | Path | Auth | Request Body | Success Response | Description | Notes |
|--------|------|------|----------------|------------------|-------------|-------|
| POST | `/webhooks/mpesa/confirmation` | IP whitelist + HMAC | Raw M-Pesa STK callback JSON | `{ ResultCode: 0, ResultDesc: "success" }` | STK Push result | Enqueues `mpesa-callbacks:process-stk-callback`. Must respond quickly. |
| POST | `/webhooks/mpesa/b2c-result` | IP whitelist + HMAC | Raw M-Pesa B2C result JSON | `{ ResultCode: 0, ResultDesc: "success" }` | B2C transaction result | Enqueues `mpesa-callbacks:process-b2c-result`. |

---

## Miscellaneous

| Method | Path | Auth | Request Body | Success Response | Description | Notes |
|--------|------|------|----------------|------------------|-------------|-------|
| POST | `/misc/request-email-verification` | JWT | `{}` | `{ message: "code_sent" }` | Resend verification email | Rate: 3/day per user. |
| GET | `/misc/platform-config` | None | — | `{ freeTrainerLimit: 100, trainerCount: 42, remainingFreeSpots: 58 }` | Public config | Used by frontend to show "X free spots left". Cached 300s. |
