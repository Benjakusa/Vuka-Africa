-- ==============================================================================
-- Migration: Total Spent RPC
-- Description: Server-side aggregation for Trainee Total Spent
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_trainee_total_spent(p_trainee_id text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total numeric;
BEGIN
    SELECT COALESCE(SUM("pricePaidKes"), 0) INTO total
    FROM "Enrolment"
    WHERE "traineeId" = p_trainee_id AND "status" IN ('ACTIVE', 'COMPLETED');
    
    RETURN total;
END;
$$;
