-- Add whatsapp_number and age columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS age INTEGER;

-- Make email nullable for backward compatibility (new users can sign up with just WhatsApp)
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- Add index for WhatsApp number lookups
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_number ON public.profiles(whatsapp_number);

-- Add constraint for valid age
ALTER TABLE public.profiles ADD CONSTRAINT valid_age CHECK (age IS NULL OR (age >= 5 AND age <= 120));

-- Add constraint for valid WhatsApp number format (10 digits)
ALTER TABLE public.profiles ADD CONSTRAINT valid_whatsapp_number CHECK (whatsapp_number IS NULL OR whatsapp_number ~ '^\d{10}$');

-- Update handle_new_user function to include whatsapp_number and age
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, whatsapp_number, age)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'whatsapp_number',
    (NEW.raw_user_meta_data->>'age')::integer
  );
  
  -- Create student role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  -- Create approval status entry
  INSERT INTO public.approval_status (user_id, status)
  VALUES (NEW.id, 'pending');
  
  RETURN NEW;
END;
$function$;