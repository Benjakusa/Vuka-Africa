-- Vuka Database Schema for Supabase
-- Run this in Supabase Dashboard > SQL Editor

-- Enums as TEXT check constraints for Supabase Data API compatibility

CREATE TABLE "User" (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    role TEXT NOT NULL DEFAULT 'TRAINEE' CHECK (role IN ('TRAINEE', 'TRAINER', 'ADMIN')),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "suspendedAt" TIMESTAMPTZ,
    "suspensionReason" TEXT,
    "lastLoginAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_phone ON "User"(phone);
CREATE INDEX idx_user_role ON "User"(role);

CREATE TABLE "Trainer" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"(id) ON DELETE CASCADE,
    bio TEXT,
    skills TEXT[],
    "idDocumentUrl" TEXT,
    "verificationVideoUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNSUBMITTED' CHECK ("verificationStatus" IN ('UNSUBMITTED', 'PENDING', 'APPROVED', 'REJECTED')),
    "verificationFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "verificationFeeAmount" DECIMAL(12,2) NOT NULL DEFAULT 5000.00,
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "averageRating" REAL NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "availableBalance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trainer_userId ON "Trainer"("userId");
CREATE INDEX idx_trainer_isVerified ON "Trainer"("isVerified");
CREATE INDEX idx_trainer_averageRating ON "Trainer"("averageRating");
CREATE INDEX idx_trainer_verified_rating ON "Trainer"("isVerified", "averageRating" DESC);

CREATE TABLE "Course" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "trainerId" UUID NOT NULL REFERENCES "Trainer"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    "learningOutcomes" TEXT[],
    prerequisites TEXT,
    category TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('PHYSICAL', 'VIRTUAL', 'HYBRID')),
    location TEXT,
    duration TEXT NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "priceKes" DECIMAL(12,2) NOT NULL,
    "maxStudents" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_trainerId ON "Course"("trainerId");
CREATE INDEX idx_course_category ON "Course"(category);
CREATE INDEX idx_course_mode ON "Course"(mode);
CREATE INDEX idx_course_isPublished ON "Course"("isPublished");
CREATE INDEX idx_course_slug ON "Course"(slug);
CREATE INDEX idx_course_category_mode_price ON "Course"(category, mode, "priceKes");
CREATE INDEX idx_course_published_category_mode ON "Course"("isPublished", category, mode);

CREATE TABLE "Enrolment" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "courseId" UUID NOT NULL REFERENCES "Course"(id) ON DELETE RESTRICT,
    "traineeId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
    "trainerId" UUID NOT NULL REFERENCES "Trainer"(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN ('PENDING_PAYMENT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
    "pricePaidKes" DECIMAL(12,2) NOT NULL,
    "commissionKes" DECIMAL(12,2) NOT NULL,
    "trainerPayoutKes" DECIMAL(12,2) NOT NULL,
    "mpesaTransactionId" TEXT,
    "mpesaCheckoutRequestId" TEXT,
    "mpesaReceiptNumber" TEXT,
    "currentMilestone" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "cancelledAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE("traineeId", "courseId")
);

CREATE INDEX idx_enrolment_traineeId ON "Enrolment"("traineeId");
CREATE INDEX idx_enrolment_trainerId ON "Enrolment"("trainerId");
CREATE INDEX idx_enrolment_status ON "Enrolment"(status);
CREATE INDEX idx_enrolment_courseId ON "Enrolment"("courseId");
CREATE INDEX idx_enrolment_checkoutRequest ON "Enrolment"("mpesaCheckoutRequestId");
CREATE INDEX idx_enrolment_receipt ON "Enrolment"("mpesaReceiptNumber");
CREATE INDEX idx_enrolment_trainee_status ON "Enrolment"("traineeId", status);
CREATE INDEX idx_enrolment_trainer_status ON "Enrolment"("trainerId", status);
CREATE INDEX idx_enrolment_course_status_created ON "Enrolment"("courseId", status, "createdAt" DESC);

CREATE TABLE "Milestone" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "enrolmentId" UUID NOT NULL REFERENCES "Enrolment"(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    label TEXT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    "amountKes" DECIMAL(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'TRAINER_CONFIRMED', 'TRAINEE_CONFIRMED', 'RELEASED', 'DISPUTED')),
    "trainerConfirmedAt" TIMESTAMPTZ,
    "traineeConfirmedAt" TIMESTAMPTZ,
    "releasedAt" TIMESTAMPTZ,
    "payoutTransactionId" TEXT,
    "disputeId" TEXT UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestone_enrolmentId ON "Milestone"("enrolmentId");
CREATE INDEX idx_milestone_status ON "Milestone"(status);
CREATE INDEX idx_milestone_enrolment_sequence ON "Milestone"("enrolmentId", sequence);

CREATE TABLE "TransactionLedger" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('TRAINEE_PAYMENT', 'TRAINER_PAYOUT', 'COMMISSION', 'VERIFICATION_FEE', 'REFUND')),
    direction TEXT NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
    "amountKes" DECIMAL(12,2) NOT NULL,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "mpesaTransactionId" TEXT,
    "mpesaReceiptNumber" TEXT,
    description TEXT,
    meta JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ledger_user_created ON "TransactionLedger"("userId", "createdAt");
CREATE INDEX idx_ledger_created ON "TransactionLedger"("createdAt");
CREATE INDEX idx_ledger_mpesaTransaction ON "TransactionLedger"("mpesaTransactionId");
CREATE INDEX idx_ledger_reference ON "TransactionLedger"("referenceType", "referenceId");
CREATE INDEX idx_ledger_type_direction ON "TransactionLedger"(type, direction);
CREATE INDEX idx_ledger_user_type_created ON "TransactionLedger"("userId", type, "createdAt" DESC);

CREATE TABLE "Payout" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "trainerId" UUID NOT NULL REFERENCES "Trainer"(id) ON DELETE RESTRICT,
    "amountKes" DECIMAL(12,2) NOT NULL,
    "mpesaPhone" TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    "mpesaTransactionId" TEXT,
    "mpesaReceiptNumber" TEXT,
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL UNIQUE,
    "mpesaConversationId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "completedAt" TIMESTAMPTZ
);

CREATE INDEX idx_payout_trainerId ON "Payout"("trainerId");
CREATE INDEX idx_payout_status ON "Payout"(status);
CREATE INDEX idx_payout_idempotencyKey ON "Payout"("idempotencyKey");
CREATE INDEX idx_payout_trainer_status_created ON "Payout"("trainerId", status, "createdAt" DESC);

CREATE TABLE "Review" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "enrolmentId" UUID NOT NULL UNIQUE REFERENCES "Enrolment"(id) ON DELETE CASCADE,
    "trainerId" UUID NOT NULL REFERENCES "Trainer"(id) ON DELETE CASCADE,
    "traineeId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
    rating INTEGER NOT NULL,
    comment TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_trainerId ON "Review"("trainerId");
CREATE INDEX idx_review_enrolmentId ON "Review"("enrolmentId");
CREATE INDEX idx_review_trainer_rating ON "Review"("trainerId", rating);

CREATE TABLE "Dispute" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "enrolmentId" UUID NOT NULL REFERENCES "Enrolment"(id) ON DELETE CASCADE,
    "milestoneId" TEXT UNIQUE,
    "raisedById" TEXT NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED_TRAINER', 'RESOLVED_TRAINEE', 'RESOLVED_SPLIT')),
    "resolutionNotes" TEXT,
    "resolvedById" TEXT REFERENCES "User"(id),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dispute_enrolmentId ON "Dispute"("enrolmentId");
CREATE INDEX idx_dispute_status ON "Dispute"(status);

CREATE TABLE "SessionLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "enrolmentId" UUID NOT NULL REFERENCES "Enrolment"(id) ON DELETE CASCADE,
    "milestoneId" UUID NOT NULL UNIQUE REFERENCES "Milestone"(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('PHYSICAL', 'VIRTUAL', 'HYBRID')),
    "gpsCoordinates" TEXT,
    "videoRoomId" TEXT,
    "trainerCheckedIn" BOOLEAN NOT NULL DEFAULT false,
    "traineeCheckedIn" BOOLEAN NOT NULL DEFAULT false,
    "sessionDate" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessionlog_enrolmentId ON "SessionLog"("enrolmentId");
CREATE INDEX idx_sessionlog_milestoneId ON "SessionLog"("milestoneId");

CREATE TABLE "Notification" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'EMAIL',
    channel TEXT NOT NULL DEFAULT 'email',
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'FAILED')),
    meta JSONB,
    "sentAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_user_status ON "Notification"("userId", status);
CREATE INDEX idx_notification_status ON "Notification"(status);

CREATE TABLE "PlatformConfig" (
    id INTEGER PRIMARY KEY DEFAULT 1,
    "trainerCount" INTEGER NOT NULL DEFAULT 0,
    "freeTrainerLimit" INTEGER NOT NULL DEFAULT 100,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default PlatformConfig row
INSERT INTO "PlatformConfig" (id, "trainerCount", "freeTrainerLimit")
VALUES (1, 0, 100)
ON CONFLICT (id) DO NOTHING;
