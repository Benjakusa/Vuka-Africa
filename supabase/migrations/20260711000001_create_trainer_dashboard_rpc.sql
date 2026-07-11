-- Create a function to get dashboard stats for a trainer, replacing heavy client-side map/reduce.

CREATE OR REPLACE FUNCTION get_trainer_dashboard_stats(p_trainer_id UUID)
RETURNS TABLE (
    settled_earnings DECIMAL,
    pending_earnings DECIMAL,
    active_sessions_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE((SELECT SUM("amountKes") FROM "Payout" WHERE "trainerId" = p_trainer_id::text AND "status" = 'COMPLETED'), 0) as settled_earnings,
        COALESCE((SELECT SUM("trainerPayoutKes") FROM "Enrolment" WHERE "trainerId" = p_trainer_id::text AND "status" = 'ACTIVE'), 0) as pending_earnings,
        COALESCE((SELECT COUNT(*) FROM "Milestone" m JOIN "Enrolment" e ON m."enrolmentId" = e."id" WHERE e."trainerId" = p_trainer_id::text AND m."status" = 'IN_PROGRESS'), 0) as active_sessions_count;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_trainer_dashboard_stats(UUID) TO authenticated;
