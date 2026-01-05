-- Migration: Separate Subjects and Topics by Category (Notes vs Questions)
-- Path: supabase/migrations/20260105150000_separate_subjects_topics.sql

-- 1. Add category column to subjects and topics
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'notes' CHECK (category IN ('notes', 'questions'));
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'notes' CHECK (category IN ('notes', 'questions'));

-- 2. Update existing subjects that are linked to questions to be in 'questions' category
UPDATE public.subjects
SET category = 'questions'
WHERE id IN (SELECT DISTINCT subject_id FROM public.questions WHERE subject_id IS NOT NULL);

-- 3. Update existing topics that are linked to questions to be in 'questions' category
UPDATE public.topics
SET category = 'questions'
WHERE id IN (SELECT DISTINCT topic_id FROM public.questions WHERE topic_id IS NOT NULL);

-- 4. For topics whose subjects were marked as questions but topic itself wasn't linked to a question yet
UPDATE public.topics t
SET category = 'questions'
FROM public.subjects s
WHERE t.subject_id = s.id AND s.category = 'questions';
