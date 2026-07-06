# Vuka API Reference

All endpoints are prefixed with `/api/v1` unless otherwise noted. Authentication is via httpOnly cookies (`accessToken` + `refreshToken`). Responses follow a consistent format.

## Response Format

### Success (single)
```json
{ "data": { ... } }
```

### Success (paginated)
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "perPage": 20, "total": 100, "totalPages": 5 }
}
```

### Error
```json
{
  "error": { "code": "NOT_FOUND", "message": "Course not found", "details": {} }
}
```

## Auth Endpoints

### POST /auth/register
Create a new account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "Password1",
  "name": "John Doe",
  "phone": "+254708374149"
}
```

**Response:** `201` — Sets `accessToken` + `refreshToken` cookies.

### POST /auth/login
Authenticate and receive tokens.

**Body:**
```json
{ "email": "user@example.com", "password": "Password1" }
```

**Response:** `200` — `{ data: { user: { id, email, name, role }, accessToken, refreshToken } }`

### POST /auth/logout
Invalidate tokens and clear cookies.

**Response:** `200`

### POST /auth/refresh
Refresh access token using refresh token cookie.

**Response:** `200` — New tokens.

### POST /auth/verify-email
Verify email address via token.

**Body:** `{ "token": "..." }`

### POST /auth/forgot-password
Send password reset email.

**Body:** `{ "email": "..." }`

### POST /auth/reset-password
Reset password with token.

**Body:** `{ "token": "...", "password": "NewPassword1" }`

## Course Endpoints

### GET /courses
List published courses.

**Query:** `?page=1&perPage=20&category=TECHNOLOGY&mode=VIRTUAL&sort=price_asc&search=javascript&minPrice=0&maxPrice=100000`

**Response:** Paginated with `meta`.

### GET /courses/:slug
Get course details by slug.

**Response:** `{ data: { id, title, description, priceKes, trainer, milestones, ... } }`

### POST /courses (Trainer)
Create a new course.

**Body:**
```json
{
  "title": "JavaScript Masterclass",
  "description": "...",
  "category": "TECHNOLOGY",
  "mode": "VIRTUAL",
  "priceKes": 5000,
  "maxStudents": 20,
  "duration": "8 weeks",
  "sessionCount": 16,
  "learningOutcomes": ["Build apps", "Deploy to production"]
}
```

### PUT /courses/:id (Trainer)
Update course.

### DELETE /courses/:id (Trainer)
Soft-delete course.

## Enrolment Endpoints

### POST /enrolments (Trainee)
Initiate enrolment with STK Push.

**Body:** `{ "courseId": "..." }`

### GET /enrolments (Trainee/Trainer)
List user's enrolments.

**Query:** `?status=ACTIVE&page=1&perPage=20`

### GET /enrolments/:id
Get enrolment detail with milestones.

### GET /enrolments/:id/status
Poll M-Pesa payment status.

## Milestone Endpoints

### POST /milestones/:id/confirm-trainer
Trainer confirms milestone completion.

### POST /milestones/:id/confirm-trainee
Trainee confirms milestone completion.

## Payout Endpoints

### POST /payouts/request (Trainer)
Initiate payout with 2FA.

**Body:** `{ "amountKes": 5000 }`

### POST /payouts/confirm (Trainer)
Confirm payout with 2FA code.

**Body:** `{ "payoutId": "...", "code": "123456" }`

### GET /payouts (Trainer)
List payout history.

## Trainer Endpoints

### POST /trainers/apply
Apply to become a trainer. First 100 get 0% commission.

**Body:** `{ "bio": "...", "skills": ["JavaScript", "Python"], "idDocumentUrl": "..." }`

### GET /trainers/:id/profile
Public trainer profile.

### PUT /trainers/profile (Trainer)
Update profile.

### POST /trainers/verification (Trainer)
Request verification (STK Push for KES 5,000).

### GET /trainers/verification/status (Trainer)
Check verification status.

## Admin Endpoints

### GET /admin/stats
Platform-wide statistics (users, courses, revenue, etc.)

### GET /admin/verifications
List pending verification requests.

### POST /admin/verifications/:id/approve
Approve trainer verification.

### POST /admin/verifications/:id/reject
Reject trainer verification.

### GET /admin/disputes
List open disputes.

### POST /admin/disputes/:id/resolve
Resolve a dispute with resolution notes.

### GET /admin/ledger
View full transaction ledger. Paginated.

**Query:** `?type=COMMISSION&userId=...&page=1&perPage=50`

### GET /admin/users
List all users with search.

### POST /admin/users/:id/suspend
Suspend a user account.

### POST /admin/users/:id/unsuspend
Unsuspend a user account.

## Review Endpoints

### POST /reviews (Trainee)
Submit a review for a completed enrolment.

**Body:** `{ "enrolmentId": "...", "rating": 5, "comment": "Great course!" }`

### GET /trainers/:id/reviews
List public reviews for a trainer.

## Upload Endpoint

### POST /upload
Upload a file to R2.

**Headers:** `Content-Type: multipart/form-data`
**Body:** `file` (binary)

**Response:** `{ data: { url: "https://r2.dev/uuid.pdf" } }`

## Notification Endpoints

### GET /notifications (Authenticated)
List user notifications.

### PUT /notifications/:id/read
Mark notification as read.

## Webhook Endpoints (No Auth)

### POST /webhooks/mpesa/confirmation
M-Pesa STK Push callback.

### POST /webhooks/mpesa/b2c-result
M-Pesa B2C result callback.

### POST /webhooks/mpesa/b2c-timeout
M-Pesa B2C timeout callback.

## Health Endpoint

### GET /api/health
System health check.

**Response:** `{ "status": "ok", "database": "ok", "redis": "ok", "uptime": 12345 }`
