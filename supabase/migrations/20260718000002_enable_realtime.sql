-- ==============================================================================
-- Migration: Enable Realtime for Payment and Dashboard Tables
-- Description: Adds tables to the supabase_realtime publication to enable 
--              frontend clients to receive live websocket updates.
-- ==============================================================================

-- Supabase Realtime uses the "supabase_realtime" publication.
-- By default, no tables are added. We add only the tables necessary for 
-- reactive dashboards.

ALTER PUBLICATION supabase_realtime ADD TABLE "Enrolment";
ALTER PUBLICATION supabase_realtime ADD TABLE "Trainer";
ALTER PUBLICATION supabase_realtime ADD TABLE "TransactionLedger";
ALTER PUBLICATION supabase_realtime ADD TABLE "Payout";
