-- Migration: Add order_index column to subjects and topics for drag-drop reordering
-- Path: supabase/migrations/20260105160000_add_order_index.sql

-- 1. Add order_index column to subjects
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 2. Add order_index column to topics
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 3. Set initial order based on current alphabetical order for subjects
WITH ordered_subjects AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category ORDER BY name) as rn
  FROM public.subjects
)
UPDATE public.subjects s
SET order_index = os.rn
FROM ordered_subjects os
WHERE s.id = os.id;

-- 4. Set initial order based on current order for topics
WITH ordered_topics AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY subject_id ORDER BY name) as rn
  FROM public.topics
)
UPDATE public.topics t
SET order_index = ot.rn
FROM ordered_topics ot
WHERE t.id = ot.id;
