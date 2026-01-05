-- Migration: Assign "General Knowledge" subject to unassigned questions
-- Path: supabase/migrations/20260105151000_assign_general_knowledge.sql

-- 1. Create "General Knowledge" subject for each exam that has unassigned questions
INSERT INTO public.subjects (exam_id, name, category, created_by)
SELECT DISTINCT 
    q.exam_id, 
    'General Knowledge', 
    'questions',
    (SELECT id FROM auth.users LIMIT 1)
FROM public.questions q
WHERE q.subject_id IS NULL
  AND q.exam_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.subjects s 
    WHERE s.exam_id = q.exam_id 
      AND s.name = 'General Knowledge' 
      AND s.category = 'questions'
  );

-- 2. Update questions without subject to use "General Knowledge"
UPDATE public.questions q
SET subject_id = s.id,
    subject = 'General Knowledge'
FROM public.subjects s
WHERE q.subject_id IS NULL
  AND s.exam_id = q.exam_id
  AND s.name = 'General Knowledge'
  AND s.category = 'questions';
