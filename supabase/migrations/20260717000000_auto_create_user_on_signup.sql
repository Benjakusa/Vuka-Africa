-- Automatically create a User row when a new auth.users record is created
-- This ensures every authenticated user has a matching public profile.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  _role text := COALESCE(NEW.raw_user_meta_data ->> 'role', 'TRAINEE');
BEGIN
  INSERT INTO public."User" (id, email, phone, "fullName", role, "updatedAt")
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.phone, COALESCE(NEW.raw_user_meta_data ->> 'phone', '')),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1), 'User'),
    _role::public."UserRole",
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- If the role is TRAINER, also create the Trainer record
  IF _role = 'TRAINER' THEN
    INSERT INTO public."Trainer" ("userId", "updatedAt")
    VALUES (NEW.id, now())
    ON CONFLICT ("userId") DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Apply the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ── Backfill: create User rows for existing auth users that don't have one ──
INSERT INTO public."User" (id, email, phone, "fullName", role, "updatedAt")
SELECT
  au.id::text,
  COALESCE(au.email, ''),
  COALESCE(au.raw_user_meta_data ->> 'phone', ''),
  COALESCE(au.raw_user_meta_data ->> 'full_name', split_part(au.email, '@', 1), 'User'),
  COALESCE((au.raw_user_meta_data ->> 'role')::public."UserRole", 'TRAINEE'),
  now()
FROM auth.users au
LEFT JOIN public."User" u ON u.id = au.id::text
WHERE u.id IS NULL;

-- Also create Trainer records for auth users with role TRAINER who lack one
INSERT INTO public."Trainer" ("userId", "updatedAt")
SELECT au.id::text, now()
FROM auth.users au
LEFT JOIN public."Trainer" t ON t."userId" = au.id::text
WHERE t.id IS NULL
  AND COALESCE(au.raw_user_meta_data ->> 'role', 'TRAINEE') = 'TRAINER';
