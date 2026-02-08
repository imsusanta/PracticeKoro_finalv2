-- Migration: Add auto-approve functionality to handle_new_user trigger
-- This migration updates the handle_new_user() function to check the auto_approve_students
-- setting in site_settings table and automatically approve new students if enabled.

-- First, ensure the site_settings entry exists for auto_approve_students (default: false)
INSERT INTO public.site_settings (key, value)
VALUES ('auto_approve_students', 'false')
ON CONFLICT (key) DO NOTHING;

-- Update the handle_new_user function to check auto-approve setting
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    auto_approve boolean := false;
BEGIN
  -- Check if auto-approve is enabled
  SELECT COALESCE((value = 'true'), false) INTO auto_approve
  FROM public.site_settings
  WHERE key = 'auto_approve_students';

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, whatsapp_number)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'whatsapp_number'
  );
  
  -- Create student role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  -- Create approval status entry (auto-approve if setting is enabled)
  INSERT INTO public.approval_status (user_id, status)
  VALUES (NEW.id, CASE WHEN auto_approve THEN 'approved'::approval_status_type ELSE 'pending'::approval_status_type END);
  
  RETURN NEW;
END;
$$;

-- Grant necessary permissions
GRANT SELECT ON public.site_settings TO authenticated;
GRANT SELECT ON public.site_settings TO anon;
