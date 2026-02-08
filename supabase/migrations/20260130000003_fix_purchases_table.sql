-- Fix purchases table polymorphism and missing 'subscription' type
-- 1. Change content_id from UUID to TEXT to support "site_yearly_subscription"
ALTER TABLE public.purchases ALTER COLUMN content_id TYPE TEXT;

-- 2. Update the check constraint to allow 'subscription'
ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS purchases_content_type_check;
ALTER TABLE public.purchases ADD CONSTRAINT purchases_content_type_check CHECK (content_type IN ('test', 'note', 'subscription'));
