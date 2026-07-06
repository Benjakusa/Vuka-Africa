# Bug Bash Checklist — Vuka Marketplace

## Prerequisites
- Run `npm run build` — must succeed
- Run `npm run lint` — no errors
- Run `npm run typecheck` — no type errors
- Run `npm run test` — all passing
- Run `npm run test:coverage` — ≥80% thresholds met

---

## 1. Authentication & Authorization

### Registration
- [ ] Register with valid email/password/name — redirects to verify-email page
- [ ] Register with existing email — shows 409 error
- [ ] Register with password < 8 chars — shows validation error
- [ ] Register with password without number — shows validation error
- [ ] Register as trainer — "First 100 Free" applies (0% commission if count < 100)

### Login
- [ ] Login with valid credentials — sets httpOnly cookies
- [ ] Login with wrong password — shows 401 error
- [ ] Login with unverified email — shows "Please verify your email"
- [ ] Login with suspended account — shows "Account suspended"

### Email Verification
- [ ] Click verification link from email — marks emailVerified as true

### Logout
- [ ] Logout clears accessToken/refreshToken cookies
- [ ] Accessing protected route after logout redirects to login

### Token Security
- [ ] Access token expires after 15 minutes
- [ ] Refresh token rotates on reuse (old refresh blacklisted)
- [ ] Token version increments on password change
- [ ] Old tokens are invalid after version increment

---

## 2. Public Pages

### Homepage
- [ ] Loads hero section
- [ ] Featured courses displayed (if any)
- [ ] Top trainers displayed (if any)
- [ ] Categories navigation works
- [ ] "First 100 Free" banner shown

### Course Listing
- [ ] Paginated course cards shown
- [ ] Filter by category works
- [ ] Sort by price/rating/newest works
- [ ] Search by keyword works
- [ ] Loading skeleton shown during fetch
- [ ] Empty state when no courses match
- [ ] Error state on API failure

### Course Detail
- [ ] Course info displayed (title, description, price, trainer)
- [ ] Trainer profile card shown with rating
- [ ] "Enrol Now" button visible for unauthenticated users (redirects to login)
- [ ] "Enrol Now" button visible for authenticated TRAINEE users
- [ ] "Enrol Now" hidden for TRAINER users (own course)
- [ ] 404 page for invalid course ID

### Trainer Listing
- [ ] Trainer cards with avatar, name, rating, bio
- [ ] Filter by expertise/category works
- [ ] Pagination works

### Trainer Profile
- [ ] Trainer info displayed
- [ ] Courses listed
- [ ] Reviews displayed (if any)
- [ ] "Contact" or "View Courses" CTA visible

---

## 3. Dashboard — Trainee

### Overview
- [ ] Enrolment count shown
- [ ] Active enrolments listed
- [ ] Loading/empty/error states displayed correctly

### Enrolments
- [ ] List of enrolments with status badges
- [ ] Click enrolment to see detail page
- [ ] Milestone stepper shows 3 milestones
- [ ] Confirm milestone as trainee
- [ ] Cannot confirm milestone before trainer confirms

### Enrolment Detail
- [ ] Course info displayed
- [ ] Trainer info displayed
- [ ] Milestone statuses shown
- [ ] Payment history shown

---

## 4. Dashboard — Trainer

### Overview
- [ ] Total earnings shown
- [ ] Available balance shown
- [ ] Active enrolments count
- [ ] Average rating shown

### Courses Management
- [ ] Create course form works
- [ ] Edit course form pre-populated with existing data
- [ ] Delete course confirmation dialog works
- [ ] Published/unpublished toggle works
- [ ] Validation errors shown for required fields

### Enrolments
- [ ] List of enrolled trainees
- [ ] Mark milestone as complete (trainer confirms)
- [ ] Cannot confirm milestone before trainee enrolment is active

### Earnings
- [ ] Earnings breakdown shown
- [ ] Payout history shown
- [ ] "Withdraw" button triggers 2FA modal
- [ ] 2FA code sent to email
- [ ] Withdrawal processed after valid code

### Verification
- [ ] "Request Verification" button triggers STK push
- [ ] Verification badge shown on profile after payment
- [ ] First 100 trainers get free verification

---

## 5. Dashboard — Admin

### Overview
- [ ] Platform stats displayed (users, courses, revenue, enrolments)
- [ ] Charts/data visualization renders properly

### Verifications
- [ ] Pending verification requests listed
- [ ] Approve/Reject buttons work
- [ ] Approval sends email notification

### Disputes
- [ ] Open disputes listed
- [ ] Resolve dispute with refund/credit options

### Ledger
- [ ] All transactions displayed with pagination
- [ ] Filter by type/date range works

### Users
- [ ] User list with search
- [ ] Suspend/unsuspend user works
- [ ] Role management works

---

## 6. M-Pesa Payments

### STK Push
- [ ] STK push sent to trainee phone on enrolment
- [ ] Loading state shown during payment processing
- [ ] Success page shown after payment confirmed
- [ ] Failure page shown after payment declined
- [ ] Timeout handled gracefully (enrolment cancelled)

### Callback Handling
- [ ] STK callback received → enrolment activated
- [ ] STK callback received → 3 milestones created
- [ ] B2C callback received → payout marked completed
- [ ] B2C failure → payout refunded to trainer balance
- [ ] Receipt deduplication prevents double-processing

### Reconciliation
- [ ] Stale PENDING_PAYMENT enrolments (30+ min) auto-cancelled
- [ ] Stuck PROCESSING payouts (2+ hrs) auto-refunded
- [ ] Duplicate transaction detection (receipt already processed)

---

## 7. Security

### CSRF
- [ ] POST/PUT/DELETE without CSRF header returns 403
- [ ] GET/HEAD/OPTIONS bypass CSRF check
- [ ] Valid CSRF token pair allows request

### Rate Limiting
- [ ] Login: 5 attempts per 15 minutes
- [ ] Register: 3 attempts per hour
- [ ] Payout: 2 requests per hour
- [ ] Upload: 20 files per minute
- [ ] Rate limit headers present (X-RateLimit-Remaining)

### File Upload
- [ ] PDF upload with correct MIME type succeeds
- [ ] JPEG upload with correct magic bytes succeeds
- [ ] Fake PDF (renamed .exe) rejected
- [ ] File > 10MB rejected
- [ ] Path traversal in filename sanitized
- [ ] Null byte in filename sanitized

### Headers
- [ ] Content-Security-Policy header present
- [ ] X-Content-Type-Options: nosniff present
- [ ] X-Frame-Options: DENY present
- [ ] Strict-Transport-Security present (production only)

### Cookies
- [ ] accessToken: httpOnly, Secure, SameSite=Strict
- [ ] refreshToken: httpOnly, Secure, SameSite=Strict
- [ ] csrf-token: SameSite=Strict, not httpOnly (accessible via JS)

---

## 8. Edge Cases

- [ ] User with no phone number tries to enrol → error message
- [ ] Enrol in course with maxStudents reached → error
- [ ] Enrol in own course → error
- [ ] Request payout with no available balance → error
- [ ] Request payout below minimum amount → error
- [ ] Verify email with expired token → error
- [ ] Access denied page for TRAINEE accessing trainer routes
- [ ] Access denied page for non-admin accessing admin routes

---

## 9. Performance

- [ ] Course listing page loads < 2s (empty cache)
- [ ] Dashboard overview loads < 1.5s
- [ ] Images lazy-loaded
- [ ] No render-blocking resources in critical path

---

## 10. Accessibility

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] ARIA landmarks present (nav, main, footer)

---

## 11. Mobile

- [ ] Responsive layout at 375px viewport
- [ ] Responsive layout at 768px viewport
- [ ] Touch targets ≥ 44px
- [ ] No horizontal scroll
- [ ] Bottom mobile navigation works

---

## 12. PWA

- [ ] Manifest.json loads with correct app name/icons
- [ ] Service worker registered
- [ ] Offline fallback page renders
- [ ] "Add to Home Screen" prompt (Android)
