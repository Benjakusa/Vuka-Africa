-- Migration 006: Database triggers for computed columns
-- Replaces broken application-level increment logic with reliable DB triggers.
-- Safe to re-run (idempotent).

-- ── 1. Trigger to update Trainer.totalStudents when an enrolment's status
--    changes to PENDING_ACCEPTANCE (payment confirmed via M-Pesa callback) ──

CREATE OR REPLACE FUNCTION increment_trainer_students()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."status" = 'PENDING_ACCEPTANCE' AND (OLD."status" IS NULL OR OLD."status" != 'PENDING_ACCEPTANCE') THEN
    UPDATE "Trainer"
    SET "totalStudents" = "totalStudents" + 1,
        "updatedAt" = NOW()
    WHERE "id" = NEW."trainerId";
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrolment_increment_students ON "Enrolment";
CREATE TRIGGER trg_enrolment_increment_students
  AFTER INSERT OR UPDATE OF "status" ON "Enrolment"
  FOR EACH ROW
  EXECUTE FUNCTION increment_trainer_students();

-- ── 2. Trigger to keep Trainer.averageRating and Trainer.totalReviews in sync
--    when a Review is inserted, updated, or deleted. Replaces manual
--    app-level recalculation which is unreliable. ──

CREATE OR REPLACE FUNCTION recalc_trainer_ratings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE "Trainer"
    SET "averageRating" = (
      SELECT COALESCE(AVG("rating"::numeric), 0)::double precision
      FROM "Review"
      WHERE "trainerId" = NEW."trainerId" AND "isPublic" = true
    ),
    "totalReviews" = (
      SELECT COUNT(*)::integer
      FROM "Review"
      WHERE "trainerId" = NEW."trainerId" AND "isPublic" = true
    ),
    "updatedAt" = NOW()
    WHERE "id" = NEW."trainerId";
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "Trainer"
    SET "averageRating" = (
      SELECT COALESCE(AVG("rating"::numeric), 0)::double precision
      FROM "Review"
      WHERE "trainerId" = OLD."trainerId" AND "isPublic" = true
    ),
    "totalReviews" = (
      SELECT COUNT(*)::integer
      FROM "Review"
      WHERE "trainerId" = OLD."trainerId" AND "isPublic" = true
    ),
    "updatedAt" = NOW()
    WHERE "id" = OLD."trainerId";
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_update_ratings ON "Review";
CREATE TRIGGER trg_review_update_ratings
  AFTER INSERT OR UPDATE OR DELETE ON "Review"
  FOR EACH ROW
  EXECUTE FUNCTION recalc_trainer_ratings();

-- ── 3. Index on Review for the avg/count queries above ──
CREATE INDEX IF NOT EXISTS idx_review_trainer_public
  ON "Review"("trainerId", "isPublic");
