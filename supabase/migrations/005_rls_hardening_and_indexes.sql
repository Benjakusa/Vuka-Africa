-- Migration 005: RLS hardening + missing indexes
-- Addresses audit items:
--   6.1 Missing UPDATE RLS policy on Enrolment (accept/reject)
--   6.2 Missing admin UPDATE/INSERT policies (User, Trainer, Dispute, TransactionLedger, PlatformConfig)
--   6.4 / 7.4 "Anyone can view user profiles" over-broad PII exposure
--   6.11 Missing indexes for common query patterns
-- Written to be idempotent (safe to re-run) and additive — does not touch
-- any existing policy that the app currently depends on.

-- ── 1. Enrolment: allow trainer to accept/reject enrolments for their courses ──
-- Fixes acceptEnrolment()/rejectEnrolment() in enrolmentService.ts, which call
-- .update() from the browser with no matching UPDATE policy today.
DROP POLICY IF EXISTS "Trainers can update enrolments for their courses" ON "Enrolment";
CREATE POLICY "Trainers can update enrolments for their courses"
  ON "Enrolment" FOR UPDATE
  USING ("trainerId" IN (SELECT id FROM "Trainer" WHERE "userId" = auth.uid()));

-- ── 2. Admin UPDATE policy on User (suspend/activate) ──
DROP POLICY IF EXISTS "Admins can update users" ON "User";
CREATE POLICY "Admins can update users"
  ON "User" FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "User" u WHERE u.id::text = auth.uid()::text AND u.role = 'ADMIN'));

-- ── 3. Admin UPDATE policy on Trainer (approve/reject verification) ──
DROP POLICY IF EXISTS "Admins can update trainers" ON "Trainer";
CREATE POLICY "Admins can update trainers"
  ON "Trainer" FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

-- ── 4. Admin UPDATE policy on Dispute (resolve) ──
DROP POLICY IF EXISTS "Admins can update disputes" ON "Dispute";
CREATE POLICY "Admins can update disputes"
  ON "Dispute" FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

-- ── 5. Admin INSERT policy on TransactionLedger (processTrainerPayment) ──
DROP POLICY IF EXISTS "Admins can insert transactions" ON "TransactionLedger";
CREATE POLICY "Admins can insert transactions"
  ON "TransactionLedger" FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

-- ── 6. Admin INSERT + UPDATE policy on PlatformConfig (upsert in updatePlatformConfig) ──
DROP POLICY IF EXISTS "Admins can insert platform config" ON "PlatformConfig";
CREATE POLICY "Admins can insert platform config"
  ON "PlatformConfig" FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

DROP POLICY IF EXISTS "Admins can update platform config" ON "PlatformConfig";
CREATE POLICY "Admins can update platform config"
  ON "PlatformConfig" FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

-- ── 7. PII lockdown: block anonymous (unauthenticated) scraping of User table ──
-- No public/anonymous page in the app reads email or phone (verified against
-- every `.from('User')` / `User!userId(...)` call site) — all such reads happen
-- inside routes that require login. Revoking these columns from `anon` closes
-- off the most severe version of the exposure (curl-able with just the public
-- anon key, no account needed) with zero impact on current functionality.
--
-- IMPORTANT: the row-level "Anyone can view user profiles" policy is left
-- USING (true) and open to both anon + authenticated on purpose — the public
-- Trainers/TrainerProfile pages (see step #4 fix in trainerService.ts) rely on
-- anon-key access to User.fullName/avatarUrl for logged-out visitors. Narrowing
-- that policy to `TO authenticated` would break those public pages. This column
-- revoke gives PII protection without touching row-level access.
REVOKE SELECT ("email", "phone") ON "User" FROM anon;
-- NOTE: this blocks anonymous/logged-out scraping of email+phone, the most
-- severe version of the exposure (no account needed, just the public anon key).
-- It does NOT stop one logged-in user from reading another logged-in user's
-- email/phone by querying the User table directly — several legitimate in-app
-- flows need cross-user email/phone while authenticated (admin dashboard,
-- enrolment/dispute counterparty contact info) and RLS row policies can't
-- restrict by column. Fully closing that gap needs either a relationship-aware
-- policy per table or the API-layer described in the audit's Phase 2
-- recommendation — flagging as a follow-up, not claiming it's fully closed here.

-- ── 8. Missing indexes for common query patterns (audit 6.11) ──
CREATE INDEX IF NOT EXISTS idx_course_trainer_published
  ON "Course"("trainerId", "isPublished") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrolment_trainee_status
  ON "Enrolment"("traineeId", "status");
CREATE INDEX IF NOT EXISTS idx_enrolment_trainer_status
  ON "Enrolment"("trainerId", "status");
CREATE INDEX IF NOT EXISTS idx_transaction_user_created
  ON "TransactionLedger"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_payout_trainer_created
  ON "Payout"("trainerId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_review_trainer_created
  ON "Review"("trainerId", "createdAt" DESC);
