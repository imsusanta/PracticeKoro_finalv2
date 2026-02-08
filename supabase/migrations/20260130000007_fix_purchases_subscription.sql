-- Fix purchases table to support subscription content_type
-- This migration:
-- 1. Changes content_id to TEXT (to support non-UUID IDs like "site_yearly_subscription")
-- 2. Updates the content_type constraint to include 'subscription'
-- 3. Adds RLS policies for admin access

-- 1. Change content_id from UUID to TEXT
DO $$ BEGIN
  ALTER TABLE public.purchases ALTER COLUMN content_id TYPE TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Update the check constraint to allow 'subscription'
DO $$ BEGIN
  ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS purchases_content_type_check;
  ALTER TABLE public.purchases ADD CONSTRAINT purchases_content_type_check 
    CHECK (content_type IN ('test', 'note', 'subscription'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Ensure RLS is enabled
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist, then recreate
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can insert purchases" ON public.purchases;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can update purchases" ON public.purchases;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. Create admin policies
CREATE POLICY "Admins can insert purchases"
ON public.purchases FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update purchases"
ON public.purchases FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Users can view their own purchases
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view own purchases"
ON public.purchases FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
