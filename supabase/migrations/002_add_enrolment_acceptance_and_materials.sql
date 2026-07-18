-- Migration: Add trainer acceptance flow and course materials
-- 1. Extend EnrolmentStatus enum to add PENDING_ACCEPTANCE and REJECTED
-- 2. Add new columns to Enrolment
-- 3. Create CourseMaterial table
-- 4. Set up RLS policies

-- Step 1: Extend the EnrolmentStatus enum
ALTER TYPE "EnrolmentStatus" ADD VALUE IF NOT EXISTS 'PENDING_ACCEPTANCE';
ALTER TYPE "EnrolmentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- Step 2: Add columns to Enrolment
ALTER TABLE "Enrolment" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Enrolment" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Enrolment" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Step 3: Create CourseMaterial table
CREATE TABLE IF NOT EXISTS "CourseMaterial" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "enrolmentId" TEXT NOT NULL REFERENCES "Enrolment"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "fileUrl" TEXT,
  "fileType" TEXT NOT NULL DEFAULT 'link',
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Enable RLS
ALTER TABLE "CourseMaterial" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Trainer and trainee can view materials" ON "CourseMaterial";
DROP POLICY IF EXISTS "Trainer can add materials" ON "CourseMaterial";
DROP POLICY IF EXISTS "Uploader can delete materials" ON "CourseMaterial";

-- Create policies
CREATE POLICY "Trainer and trainee can view materials"
  ON "CourseMaterial" FOR SELECT
  USING (
    "enrolmentId" IN (
      SELECT id FROM "Enrolment" 
      WHERE "traineeId"::text = auth.uid()::text 
         OR "trainerId" IN (SELECT id FROM "Trainer" WHERE "userId"::text = auth.uid()::text)
    )
  );

CREATE POLICY "Trainer can add materials"
  ON "CourseMaterial" FOR INSERT
  WITH CHECK (
    "uploadedBy"::text = auth.uid()::text AND
    "enrolmentId" IN (
      SELECT id FROM "Enrolment" 
      WHERE "trainerId" IN (SELECT id FROM "Trainer" WHERE "userId"::text = auth.uid()::text)
    )
  );

CREATE POLICY "Uploader can delete materials"
  ON "CourseMaterial" FOR DELETE
  USING ("uploadedBy"::text = auth.uid()::text);
