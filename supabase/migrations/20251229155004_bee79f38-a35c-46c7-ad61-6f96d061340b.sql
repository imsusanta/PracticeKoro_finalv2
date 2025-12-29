-- 1. Relax constraints on subjects table
ALTER TABLE public.subjects ALTER COLUMN exam_id DROP NOT NULL;

-- 2. Relax constraints on pdfs (notes) table
ALTER TABLE public.pdfs ALTER COLUMN exam_id DROP NOT NULL;

-- 3. Ensure topics table has the content column for the new system
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS content TEXT;