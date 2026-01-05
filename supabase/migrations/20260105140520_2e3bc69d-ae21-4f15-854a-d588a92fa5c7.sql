-- Add category column to subjects table
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'notes';

-- Add category column to topics table
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'notes';