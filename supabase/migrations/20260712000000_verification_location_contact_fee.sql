-- Add location, alternativeContact, and mpesaCheckoutRequestId to Trainer
-- Change verification fee default from 5000 to 2000

ALTER TABLE "Trainer"
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "alternativeContact" TEXT,
  ADD COLUMN IF NOT EXISTS "mpesaCheckoutRequestId" TEXT;

ALTER TABLE "Trainer"
  ALTER COLUMN "verificationFeeAmount" SET DEFAULT 2000.00;

-- Update existing rows that still have the old default
UPDATE "Trainer" SET "verificationFeeAmount" = 2000.00 WHERE "verificationFeeAmount" = 5000.00;

-- Update PlatformConfig default fee
UPDATE "PlatformConfig" SET "verificationFee" = 2000.00 WHERE "verificationFee" = 5000.00;
