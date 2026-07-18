-- Migration: Redesign milestones for training progress tracking
-- Adds session tracking columns and new status values

-- Add new statuses to MilestoneStatus enum
ALTER TYPE "MilestoneStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';
ALTER TYPE "MilestoneStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';

-- Add session tracking columns to Milestone
ALTER TABLE "Milestone"
ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "startedBy" TEXT,
ADD COLUMN IF NOT EXISTS "completedBy" TEXT,
ADD COLUMN IF NOT EXISTS "notes" TEXT;
