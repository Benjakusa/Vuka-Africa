-- Migration: Admin dashboard enhancements — payment processing, course management
-- Adds payout processing columns, admin RLS policies, and indexes

-- Add payment tracking columns to Payout
ALTER TABLE "Payout"
ADD COLUMN IF NOT EXISTS "processedBy" TEXT,
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT,
ADD COLUMN IF NOT EXISTS "adminNotes" TEXT,
ADD COLUMN IF NOT EXISTS "amountPaid" DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3);

-- Add indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_payout_status ON "Payout"("status");
CREATE INDEX IF NOT EXISTS idx_course_isPublished ON "Course"("isPublished");
CREATE INDEX IF NOT EXISTS idx_enrolment_status ON "Enrolment"("status");

-- Admin RLS policies for Payout
DROP POLICY IF EXISTS "Admins can read all payouts" ON "Payout";
CREATE POLICY "Admins can read all payouts"
  ON "Payout" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

DROP POLICY IF EXISTS "Admins can update payouts" ON "Payout";
CREATE POLICY "Admins can update payouts"
  ON "Payout" FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));

-- Admin RLS policies for Course
DROP POLICY IF EXISTS "Admins can update courses" ON "Course";
CREATE POLICY "Admins can update courses"
  ON "Course" FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'));
