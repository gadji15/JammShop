-- Promote a user to super_admin safely (works with TEXT+CHECK or ENUM role columns)
-- USAGE: Replace YOUR-UUID-HERE below with your auth.users.id, then run the script.
-- The script will:
--  1) Detect if public.profiles.role is an enum or text
--  2) Ensure 'super_admin' is an allowed value
--  3) Upsert your profile with role='super_admin'
--  4) Print a confirmation and return the final row

DO $$
DECLARE
  v_user_id   uuid := 'YOUR-UUID-HERE'; -- REPLACE THIS WITH YOUR UUID
  v_email     text;
  v_data_type text;
  v_udt_name  text;
  v_exists    boolean;
BEGIN
  -- Fetch email from auth.users; required because profiles.email is NOT NULL in most schemas
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'No auth.users row found for id=% (cannot proceed)', v_user_id;
  END IF;

  -- Detect column type of public.profiles.role
  SELECT c.data_type, c.udt_name
    INTO v_data_type, v_udt_name
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name   = 'profiles'
    AND c.column_name  = 'role';

  IF v_data_type = 'USER-DEFINED' THEN
    -- ENUM case: ensure the enum contains 'super_admin'
    SELECT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = v_udt_name
        AND e.enumlabel = 'super_admin'
    ) INTO v_exists;

    IF NOT v_exists THEN
      EXECUTE format('ALTER TYPE %I ADD VALUE %L', v_udt_name, 'super_admin');
    END IF;

  ELSIF v_data_type = 'text' THEN
    -- TEXT + CHECK case: relax/replace the CHECK to include 'super_admin'
    -- Drop a known constraint name if present
    EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check';

    -- Recreate a CHECK that includes super_admin (align with common roles in this project)
    EXECUTE $SQL$
      ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('customer','admin','vendor','super_admin'))
    $SQL$;
  ELSE
    RAISE WARNING 'Unexpected data_type for public.profiles.role: % (no type change attempted)', v_data_type;
  END IF;

  -- Upsert the profile with super_admin role
  INSERT INTO public.profiles (id, email, role, updated_at)
  VALUES (v_user_id, v_email, 'super_admin', now())
  ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role,
        updated_at = now();

  RAISE NOTICE 'User % promoted to super_admin (email=%)', v_user_id, v_email;
END $$ LANGUAGE plpgsql;

-- Verify result
SELECT id, email, role
FROM public.profiles
WHERE id = 'YOUR-UUID-HERE';