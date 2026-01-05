-- Add order_index column to subjects and topics for ordering
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;