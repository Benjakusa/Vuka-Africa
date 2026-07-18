-- ==============================================================================
-- Migration: Atomic refund for failed payouts
-- Description: Wraps the Payout failure marking, Trainer balance refund, and 
--              TransactionLedger entry into a single atomic transaction.
-- ==============================================================================

CREATE OR REPLACE FUNCTION handle_failed_payout_refund(
  p_payout_id      TEXT,
  p_trainer_id     TEXT,
  p_amount_kes     DECIMAL,
  p_failure_reason TEXT,
  p_retry_count    INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trainer_user_id TEXT;
  v_balance_before  DECIMAL;
  v_balance_after   DECIMAL;
BEGIN
  -- 1. Get Trainer details
  SELECT "userId", "availableBalance" 
  INTO v_trainer_user_id, v_balance_before
  FROM "Trainer" 
  WHERE id = p_trainer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trainer % not found', p_trainer_id;
  END IF;

  v_balance_after := v_balance_before + p_amount_kes;

  -- 2. Mark payout as failed
  UPDATE "Payout"
  SET
    status          = 'FAILED',
    "failureReason" = p_failure_reason,
    "retryCount"    = p_retry_count
  WHERE id = p_payout_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout % not found', p_payout_id;
  END IF;

  -- 3. Refund Trainer's available balance
  UPDATE "Trainer"
  SET "availableBalance" = v_balance_after
  WHERE id = p_trainer_id;

  -- 4. Create Ledger Entry for the refund
  INSERT INTO "TransactionLedger" (
    "userId",
    "amountKes",
    "type",
    "direction",
    "description",
    "referenceType",
    "referenceId",
    "balanceBefore",
    "balanceAfter",
    "createdAt"
  ) VALUES (
    v_trainer_user_id,
    p_amount_kes,
    'REFUND',
    'CREDIT',
    'Refund for failed payout after retries',
    'payout',
    p_payout_id,
    v_balance_before,
    v_balance_after,
    NOW()
  );
END;
$$;

-- Since this is called from the worker (backend/worker/payout-worker.ts) using the service role, 
-- it technically doesn't need PUBLIC grant, but it is safe.
GRANT EXECUTE ON FUNCTION handle_failed_payout_refund(TEXT, TEXT, DECIMAL, TEXT, INT) TO service_role;
