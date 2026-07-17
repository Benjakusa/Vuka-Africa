-- ==============================================================================
-- Migration: Create Admin RPCs for Dashboard Aggregations
-- ==============================================================================

-- 1. General Stats
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
    total_users BIGINT,
    total_trainers BIGINT,
    total_courses BIGINT,
    total_enrolments BIGINT,
    open_disputes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN') THEN
        RAISE EXCEPTION 'Access denied: Admin only';
    END IF;

    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM "User") as total_users,
        (SELECT COUNT(*) FROM "Trainer") as total_trainers,
        (SELECT COUNT(*) FROM "Course" WHERE "isPublished" = true AND "deletedAt" IS NULL) as total_courses,
        (SELECT COUNT(*) FROM "Enrolment") as total_enrolments,
        (SELECT COUNT(*) FROM "Dispute" WHERE status = 'OPEN') as open_disputes;
END;
$$;

-- 2. Financials Total
CREATE OR REPLACE FUNCTION get_admin_financials()
RETURNS TABLE (
    total_commissions DECIMAL,
    total_disbursed DECIMAL,
    pending_payouts DECIMAL,
    pending_payouts_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN') THEN
        RAISE EXCEPTION 'Access denied: Admin only';
    END IF;

    RETURN QUERY
    SELECT 
        COALESCE((SELECT SUM("amountKes") FROM "TransactionLedger" WHERE "type" = 'COMMISSION'), 0) as total_commissions,
        COALESCE((SELECT SUM("amountKes") FROM "TransactionLedger" WHERE "type" = 'TRAINER_PAYOUT'), 0) as total_disbursed,
        COALESCE((SELECT SUM("amountKes") FROM "Payout" WHERE "status" = 'PENDING'), 0) as pending_payouts,
        (SELECT COUNT(*) FROM "Payout" WHERE "status" = 'PENDING') as pending_payouts_count;
END;
$$;

-- 3. Monthly Earnings
CREATE OR REPLACE FUNCTION get_admin_monthly_earnings()
RETURNS TABLE (
    month TEXT,
    commissions DECIMAL,
    disbursements DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN') THEN
        RAISE EXCEPTION 'Access denied: Admin only';
    END IF;

    RETURN QUERY
    SELECT 
        to_char("createdAt", 'YYYY-MM') as month,
        SUM(CASE WHEN "type" = 'COMMISSION' THEN "amountKes" ELSE 0 END) as commissions,
        SUM(CASE WHEN "type" = 'TRAINER_PAYOUT' THEN "amountKes" ELSE 0 END) as disbursements
    FROM "TransactionLedger"
    WHERE "type" IN ('COMMISSION', 'TRAINER_PAYOUT')
    GROUP BY to_char("createdAt", 'YYYY-MM')
    ORDER BY month ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_financials() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_monthly_earnings() TO authenticated;
