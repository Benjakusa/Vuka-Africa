-- ==============================================================================
-- Migration: Atomic payout processing RPC
-- ==============================================================================
-- Wraps the Payout UPDATE + TransactionLedger INSERT inside a single
-- database transaction so that partial writes are impossible.
-- Previously both writes happened sequentially on the client; if the
-- second write failed the Payout row was already marked COMPLETED with
-- no ledger record.

CREATE OR REPLACE FUNCTION process_trainer_payout(
  p_payout_id      TEXT,
  p_amount_paid    DECIMAL,
  p_payment_method TEXT,
  p_admin_notes    TEXT,
  p_admin_id       TEXT,
  p_reference      TEXT  -- mpesaTransactionId or payment method label
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins may call this function
  IF NOT EXISTS (
    SELECT 1 FROM "User" WHERE id::text = auth.uid()::text AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  -- 1. Mark payout as completed
  UPDATE "Payout"
  SET
    status          = 'COMPLETED',
    "amountPaid"    = p_amount_paid,
    "paymentMethod" = p_payment_method,
    "adminNotes"    = p_admin_notes,
    "processedBy"   = p_admin_id,
    "processedAt"   = NOW()
  WHERE id = p_payout_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout % not found', p_payout_id;
  END IF;

  -- 2. Write ledger entry atomically in the same transaction
  INSERT INTO "TransactionLedger" (
    "userId",
    "amountKes",
    "entryType",
    "direction",
    "description",
    "referenceType",
    "referenceId",
    "balanceBefore",
    "balanceAfter",
    "createdAt"
  ) VALUES (
    p_admin_id,
    p_amount_paid,
    'PAYOUT',
    'DEBIT',
    'Payout processed — ' || p_reference,
    'Payout',
    p_payout_id,
    0,
    0,
    NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION process_trainer_payout(TEXT, DECIMAL, TEXT, TEXT, TEXT, TEXT) TO authenticated;
