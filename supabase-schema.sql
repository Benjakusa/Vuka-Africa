-- Generated from Prisma schema — run this in Supabase SQL Editor
-- 1. Go to https://supabase.com/dashboard/project/yghndmkuogaepegibxhd/sql/new
-- 2. Paste and run

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TRAINEE', 'TRAINER', 'ADMIN');
CREATE TYPE "VerificationStatus" AS ENUM ('UNSUBMITTED', 'PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "CourseMode" AS ENUM ('PHYSICAL', 'VIRTUAL', 'HYBRID');
CREATE TYPE "EnrolmentStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED');
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'TRAINER_CONFIRMED', 'TRAINEE_CONFIRMED', 'RELEASED', 'DISPUTED');
CREATE TYPE "LedgerEntryType" AS ENUM ('TRAINEE_PAYMENT', 'TRAINER_PAYOUT', 'COMMISSION', 'VERIFICATION_FEE', 'REFUND');
CREATE TYPE "LedgerDirection" AS ENUM ('CREDIT', 'DEBIT');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_TRAINER', 'RESOLVED_TRAINEE', 'RESOLVED_SPLIT');
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TRAINEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Trainer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "skills" TEXT[],
    "idDocumentUrl" TEXT,
    "verificationVideoUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNSUBMITTED',
    "verificationFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "verificationFeeAmount" DECIMAL(12,2) NOT NULL DEFAULT 5000.00,
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "availableBalance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Trainer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "learningOutcomes" TEXT[],
    "prerequisites" TEXT,
    "category" TEXT NOT NULL,
    "mode" "CourseMode" NOT NULL,
    "location" TEXT,
    "duration" TEXT NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "priceKes" DECIMAL(12,2) NOT NULL,
    "maxStudents" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Enrolment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "status" "EnrolmentStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "pricePaidKes" DECIMAL(12,2) NOT NULL,
    "commissionKes" DECIMAL(12,2) NOT NULL,
    "trainerPayoutKes" DECIMAL(12,2) NOT NULL,
    "mpesaTransactionId" TEXT,
    "mpesaCheckoutRequestId" TEXT,
    "mpesaReceiptNumber" TEXT,
    "currentMilestone" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Enrolment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "amountKes" DECIMAL(12,2) NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "trainerConfirmedAt" TIMESTAMP(3),
    "traineeConfirmedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "payoutTransactionId" TEXT,
    "disputeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TransactionLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amountKes" DECIMAL(12,2) NOT NULL,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "mpesaTransactionId" TEXT,
    "mpesaReceiptNumber" TEXT,
    "description" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransactionLedger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "amountKes" DECIMAL(12,2) NOT NULL,
    "mpesaPhone" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "mpesaTransactionId" TEXT,
    "mpesaReceiptNumber" TEXT,
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "mpesaConversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "raisedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNotes" TEXT,
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SessionLog" (
    "id" TEXT NOT NULL,
    "enrolmentId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "mode" "CourseMode" NOT NULL,
    "gpsCoordinates" TEXT,
    "videoRoomId" TEXT,
    "trainerCheckedIn" BOOLEAN NOT NULL DEFAULT false,
    "traineeCheckedIn" BOOLEAN NOT NULL DEFAULT false,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EMAIL',
    "channel" TEXT NOT NULL DEFAULT 'email',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "meta" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "trainerCount" INTEGER NOT NULL DEFAULT 0,
    "freeTrainerLimit" INTEGER NOT NULL DEFAULT 100,
    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "Trainer_userId_key" ON "Trainer"("userId");
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");
CREATE UNIQUE INDEX "Enrolment_traineeId_courseId_key" ON "Enrolment"("traineeId", "courseId");
CREATE UNIQUE INDEX "Milestone_disputeId_key" ON "Milestone"("disputeId");
CREATE UNIQUE INDEX "Payout_idempotencyKey_key" ON "Payout"("idempotencyKey");
CREATE UNIQUE INDEX "Review_enrolmentId_key" ON "Review"("enrolmentId");
CREATE UNIQUE INDEX "Dispute_milestoneId_key" ON "Dispute"("milestoneId");
CREATE UNIQUE INDEX "SessionLog_milestoneId_key" ON "SessionLog"("milestoneId");

-- Foreign keys
ALTER TABLE "Trainer" ADD CONSTRAINT "Trainer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE;
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT;
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE RESTRICT;
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE RESTRICT;
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "Enrolment"("id") ON DELETE CASCADE;
ALTER TABLE "TransactionLedger" ADD CONSTRAINT "TransactionLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT;
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE RESTRICT;
ALTER TABLE "Review" ADD CONSTRAINT "Review_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "Enrolment"("id") ON DELETE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE RESTRICT;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "Enrolment"("id") ON DELETE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "SessionLog" ADD CONSTRAINT "SessionLog_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "Enrolment"("id") ON DELETE CASCADE;
ALTER TABLE "SessionLog" ADD CONSTRAINT "SessionLog_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Enable RLS on all tables (user manages their own data)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trainer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrolment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Milestone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Dispute" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SessionLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TransactionLedger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlatformConfig" ENABLE ROW LEVEL SECURITY;
