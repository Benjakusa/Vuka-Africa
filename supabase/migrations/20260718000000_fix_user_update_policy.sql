-- ==============================================================================
-- Migration: Secure User table UPDATE policy
-- Description: Ensures users cannot elevate their own role by updating their record
-- ==============================================================================

DROP POLICY IF EXISTS "Users can update own record" ON "User";

CREATE POLICY "Users can update own record" ON "User" 
FOR UPDATE USING (id = auth.uid()::text);

CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If the role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Check if the current user is an admin or if it's the service role (which bypasses RLS/auth.uid() is null)
    IF auth.uid() IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM "User" WHERE id = auth.uid()::text AND role = 'ADMIN') THEN
        RAISE EXCEPTION 'You do not have permission to change your role.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_role_escalation ON "User";
CREATE TRIGGER tr_prevent_role_escalation
BEFORE UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION prevent_role_escalation();
