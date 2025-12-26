-- ============================================================================
-- SEED SCRIPT: Create first admin user
-- ============================================================================
-- This script creates the first admin user for the application.
--
-- USAGE:
-- 1. Update the email and password below with your desired admin credentials
-- 2. Run this via Supabase Dashboard SQL Editor or CLI
-- 3. The admin will be created with email: admin@exammaster.com
--
-- SECURITY NOTE:
-- - Change the default password immediately after first login
-- - This script should only be run once during initial setup
-- ============================================================================

-- Create admin user in auth.users table
-- Note: In production, you should use Supabase Auth Admin API or Dashboard
-- This is a fallback method and may need adjustment based on your Supabase setup

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'admin@exammaster.com';
  v_password TEXT := 'admin123456'; -- CHANGE THIS!
  v_full_name TEXT := 'System Administrator';
BEGIN
  -- Check if admin already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = v_email
  ) THEN
    -- Note: You should create the admin via Supabase Dashboard or Auth API
    -- This is just for reference structure

    RAISE NOTICE 'Please create admin user via Supabase Dashboard with:';
    RAISE NOTICE 'Email: %', v_email;
    RAISE NOTICE 'Password: (set your own secure password)';
    RAISE NOTICE 'Then run the following SQL to grant admin role:';
    RAISE NOTICE '';
    RAISE NOTICE 'UPDATE public.user_roles SET role = ''admin'' WHERE user_id = (SELECT id FROM auth.users WHERE email = ''%'');', v_email;
  ELSE
    -- Get existing user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    -- Check if user already has admin role
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = v_user_id AND role = 'admin'
    ) THEN
      -- Add admin role
      INSERT INTO public.user_roles (user_id, role)
      VALUES (v_user_id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;

      -- Approve the user
      UPDATE public.approval_status
      SET status = 'approved',
          reviewed_at = now()
      WHERE user_id = v_user_id;

      -- Activate profile
      UPDATE public.profiles
      SET is_active = true,
          full_name = v_full_name
      WHERE id = v_user_id;

      RAISE NOTICE 'Admin role granted to user: %', v_email;
    ELSE
      RAISE NOTICE 'User % already has admin role', v_email;
    END IF;
  END IF;
END $$;

-- Alternative: Promote an existing student to admin
-- Uncomment and modify the email below to promote an existing user

/*
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'your-email@example.com'; -- CHANGE THIS!
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', v_email;
  END IF;

  -- Add admin role (in addition to student role)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Approve the user if not already approved
  UPDATE public.approval_status
  SET status = 'approved',
      reviewed_at = now()
  WHERE user_id = v_user_id AND status != 'approved';

  -- Activate profile
  UPDATE public.profiles
  SET is_active = true
  WHERE id = v_user_id;

  RAISE NOTICE 'User % promoted to admin', v_email;
END $$;
*/

-- Verify admin creation
SELECT
  p.email,
  p.full_name,
  ur.role,
  a.status as approval_status,
  p.is_active
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
LEFT JOIN public.approval_status a ON p.id = a.user_id
WHERE ur.role = 'admin';
