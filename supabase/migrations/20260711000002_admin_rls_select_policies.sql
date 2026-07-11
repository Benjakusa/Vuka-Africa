-- ==============================================================================
-- Migration: Add missing Admin SELECT RLS policies
-- ==============================================================================

-- 1. Course
DROP POLICY IF EXISTS "Admins can view all courses" ON "Course";
CREATE POLICY "Admins can view all courses" ON "Course" FOR SELECT
USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

-- 2. Enrolment
DROP POLICY IF EXISTS "Admins can view all enrolments" ON "Enrolment";
CREATE POLICY "Admins can view all enrolments" ON "Enrolment" FOR SELECT
USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

-- 3. Milestone
DROP POLICY IF EXISTS "Admins can view all milestones" ON "Milestone";
CREATE POLICY "Admins can view all milestones" ON "Milestone" FOR SELECT
USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

-- 4. Review
DROP POLICY IF EXISTS "Admins can view all reviews" ON "Review";
CREATE POLICY "Admins can view all reviews" ON "Review" FOR SELECT
USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

-- 5. Dispute
DROP POLICY IF EXISTS "Admins can view all disputes" ON "Dispute";
CREATE POLICY "Admins can view all disputes" ON "Dispute" FOR SELECT
USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

-- 6. SessionLog
DROP POLICY IF EXISTS "Admins can view all session logs" ON "SessionLog";
CREATE POLICY "Admins can view all session logs" ON "SessionLog" FOR SELECT
USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

-- 7. Notification
DROP POLICY IF EXISTS "Admins can view all notifications" ON "Notification";
CREATE POLICY "Admins can view all notifications" ON "Notification" FOR SELECT
USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

-- 8. TransactionLedger
DROP POLICY IF EXISTS "Admins can view all transactions" ON "TransactionLedger";
CREATE POLICY "Admins can view all transactions" ON "TransactionLedger" FOR SELECT
USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

-- 9. Payout (Redundant if 004 exists, but safe to ensure it's there)
DROP POLICY IF EXISTS "Admins can read all payouts" ON "Payout";
CREATE POLICY "Admins can read all payouts" ON "Payout" FOR SELECT
USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));
