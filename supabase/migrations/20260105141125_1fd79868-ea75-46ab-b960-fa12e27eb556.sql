-- Make exam_id nullable in subjects table
ALTER TABLE public.subjects ALTER COLUMN exam_id DROP NOT NULL;