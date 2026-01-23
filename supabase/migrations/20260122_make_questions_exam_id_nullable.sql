-- Migration: Make exam_id nullable in questions table
-- This allows questions to be saved without being strictly tied to an exam at creation time.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'questions' AND column_name = 'exam_id') THEN
        ALTER TABLE public.questions ALTER COLUMN exam_id DROP NOT NULL;
    END IF;
END $$;
