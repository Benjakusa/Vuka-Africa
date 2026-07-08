-- RLS Policies (from supabase-schema.sql)
CREATE POLICY "Anyone can view user profiles" ON "User" FOR SELECT USING (true);
CREATE POLICY "Users can insert own record" ON "User" FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own record" ON "User" FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Anyone can view trainer profiles" ON "Trainer" FOR SELECT USING (true);
CREATE POLICY "Trainers can insert own record" ON "Trainer" FOR INSERT WITH CHECK ("userId" = auth.uid());
CREATE POLICY "Trainers can update own record" ON "Trainer" FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Anyone can view published courses" ON "Course" FOR SELECT USING ("isPublished" = true AND "deletedAt" IS NULL);
CREATE POLICY "Trainers can view own courses" ON "Course" FOR SELECT USING ("trainerId" IN (SELECT id FROM "Trainer" WHERE "userId" = auth.uid()));
CREATE POLICY "Trainers can create courses" ON "Course" FOR INSERT WITH CHECK ("trainerId" IN (SELECT id FROM "Trainer" WHERE "userId" = auth.uid()));
CREATE POLICY "Trainers can update own courses" ON "Course" FOR UPDATE USING ("trainerId" IN (SELECT id FROM "Trainer" WHERE "userId" = auth.uid()));

CREATE POLICY "Trainees can view own enrolments" ON "Enrolment" FOR SELECT USING ("traineeId" = auth.uid());
CREATE POLICY "Trainers can view enrolments for their courses" ON "Enrolment" FOR SELECT USING ("trainerId" IN (SELECT id FROM "Trainer" WHERE "userId" = auth.uid()));
CREATE POLICY "Trainees can enrol" ON "Enrolment" FOR INSERT WITH CHECK ("traineeId" = auth.uid());

CREATE POLICY "Users can view own milestones" ON "Milestone" FOR SELECT USING (
  "enrolmentId" IN (SELECT id FROM "Enrolment" WHERE "traineeId" = auth.uid() OR "trainerId" IN (SELECT id FROM "Trainer" WHERE "userId" = auth.uid()))
);

CREATE POLICY "Users can view own transactions" ON "TransactionLedger" FOR SELECT USING ("userId" = auth.uid());

CREATE POLICY "Trainers can view own payouts" ON "Payout" FOR SELECT USING ("trainerId" IN (SELECT id FROM "Trainer" WHERE "userId" = auth.uid()));

CREATE POLICY "Anyone can view public reviews" ON "Review" FOR SELECT USING ("isPublic" = true);
CREATE POLICY "Users can view own reviews" ON "Review" FOR SELECT USING ("traineeId" = auth.uid());
CREATE POLICY "Trainees can create reviews" ON "Review" FOR INSERT WITH CHECK ("traineeId" = auth.uid());

CREATE POLICY "Users can view own disputes" ON "Dispute" FOR SELECT USING (
  "raisedById" = auth.uid() OR "enrolmentId" IN (
    SELECT id FROM "Enrolment" WHERE "traineeId" = auth.uid() OR "trainerId" IN (SELECT id FROM "Trainer" WHERE "userId" = auth.uid())
  )
);
CREATE POLICY "Users can create disputes" ON "Dispute" FOR INSERT WITH CHECK ("raisedById" = auth.uid());

CREATE POLICY "Users can view session logs for their enrolments" ON "SessionLog" FOR SELECT USING (
  "enrolmentId" IN (SELECT id FROM "Enrolment" WHERE "traineeId" = auth.uid() OR "trainerId" IN (SELECT id FROM "Trainer" WHERE "userId" = auth.uid()))
);

CREATE POLICY "Users can view own notifications" ON "Notification" FOR SELECT USING ("userId" = auth.uid());
CREATE POLICY "Users can update own notifications" ON "Notification" FOR UPDATE USING ("userId" = auth.uid());

CREATE POLICY "Anyone can view platform config" ON "PlatformConfig" FOR SELECT USING (true);

-- PlatformConfig migration (add missing columns)
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 12.00;
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "verificationFee" DECIMAL(12,2) NOT NULL DEFAULT 5000.00;
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "minPayoutAmount" DECIMAL(12,2) NOT NULL DEFAULT 100.00;
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "maxPayoutAmount" DECIMAL(12,2) NOT NULL DEFAULT 50000.00;
