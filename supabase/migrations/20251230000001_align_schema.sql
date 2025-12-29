-- ============================================
-- Migration: Add missing columns to subjects and topics
-- This ensures the DB matches the code expectations after restoration
-- ============================================

-- Subjects table additions
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'book';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'emerald';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Topics table additions
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS content TEXT;

-- Migration to make exam_id nullable in subjects if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subjects' AND column_name = 'exam_id') THEN
        ALTER TABLE public.subjects ALTER COLUMN exam_id DROP NOT NULL;
    END IF;
END $$;
