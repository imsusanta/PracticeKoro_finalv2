-- Add paid content fields to mock_tests and pdfs
-- And make exam_id nullable in mock_tests

DO $$
BEGIN
    -- Update pdfs table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pdfs') THEN
        ALTER TABLE public.pdfs ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;
        ALTER TABLE public.pdfs ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0.00;
    END IF;

    -- Update mock_tests table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mock_tests') THEN
        ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;
        ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0.00;
        
        -- Make exam_id nullable in mock_tests
        ALTER TABLE public.mock_tests ALTER COLUMN exam_id DROP NOT NULL;
    END IF;
END $$;

-- Create purchases table for monetization tracking
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content_type TEXT NOT NULL CHECK (content_type IN ('test', 'note')),
    content_id UUID NOT NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Policies for purchases
CREATE POLICY "Users can view their own purchases"
    ON public.purchases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
    ON public.purchases FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
-- but for simplicity in this initial MVP, we'll allow insert for authenticated users
-- and verify status in backend. Ideally, insert happens via Edge Function.
CREATE POLICY "Users can insert their own orders"
ON purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_content ON purchases(content_type, content_id);
