-- Add indexes for frequently filtered columns to improve query performance

-- Course: isPublished is used to filter published courses
CREATE INDEX IF NOT EXISTS "Course_isPublished_idx" ON "Course"("isPublished");

-- Enrolment: status is frequently used in dashboards
CREATE INDEX IF NOT EXISTS "Enrolment_status_idx" ON "Enrolment"("status");

-- Milestone: status is used to find active sessions
CREATE INDEX IF NOT EXISTS "Milestone_status_idx" ON "Milestone"("status");
