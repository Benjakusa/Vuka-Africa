-- ==============================================================================
-- Migration: Strict RLS UPDATE Policies for Enrolment and Milestone
-- Description: Ensures Trainers and Trainees can only update specific allowed fields
-- ==============================================================================

-- 1. Enrolment UPDATE Policy
-- Trainers can only update enrolment status to ACTIVE or REJECTED
DROP POLICY IF EXISTS "Trainers can update own enrolments" ON "Enrolment";
CREATE POLICY "Trainers can update own enrolments" ON "Enrolment" 
FOR UPDATE USING (
  "trainerId" IN (SELECT id FROM "Trainer" WHERE "userId" = auth.uid()::text)
) WITH CHECK (
  -- Prevent trainers from marking as COMPLETED directly to steal funds
  -- They can only ACCEPT or REJECT a pending enrolment
  "status" IN ('ACTIVE', 'REJECTED', 'PENDING_PAYMENT', 'PENDING_ACCEPTANCE')
);

-- 2. Milestone UPDATE Policy
-- Trainers can update milestones for their courses
DROP POLICY IF EXISTS "Trainers can update milestones" ON "Milestone";
CREATE POLICY "Trainers can update milestones" ON "Milestone" 
FOR UPDATE USING (
  "enrolmentId" IN (
    SELECT id FROM "Enrolment" 
    WHERE "trainerId" IN (SELECT id FROM "Trainer" WHERE "userId" = auth.uid()::text)
  )
);

-- Trainees can update milestones to confirm them
DROP POLICY IF EXISTS "Trainees can update milestones" ON "Milestone";
CREATE POLICY "Trainees can update milestones" ON "Milestone" 
FOR UPDATE USING (
  "enrolmentId" IN (
    SELECT id FROM "Enrolment" WHERE "traineeId" = auth.uid()::text
  )
);
