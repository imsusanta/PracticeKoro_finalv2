-- ============================================
-- Migration: Simplify Notes System
-- 1. Make exam_id nullable in subjects and pdfs
-- 2. Add content column to topics
-- ============================================

-- Make exam_id nullable
ALTER TABLE public.subjects ALTER COLUMN exam_id DROP NOT NULL;
ALTER TABLE public.pdfs ALTER COLUMN exam_id DROP NOT NULL;

-- Add content column to topics if it doesn't exist
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS content TEXT;

-- Drop the old unique constraint on subjects and topics if they exist
-- The previous migration used UNIQUE(exam_id, name) and UNIQUE(subject_id, name)
-- We want to allow name to be unique within its context but exam_id is now optional.

-- Note: Postgres UNIQUE constraints with NULL allow multiple NULLs, 
-- which is actually fine for this use case.
