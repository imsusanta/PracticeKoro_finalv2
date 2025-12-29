-- ============================================
-- Fix: Update RLS Policies for Subjects and Topics using SECURITY DEFINER function
-- This avoids recursion and RLS violations when checking roles
-- ============================================

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "subjects_select_policy" ON public.subjects;
DROP POLICY IF EXISTS "subjects_insert_policy" ON public.subjects;
DROP POLICY IF EXISTS "subjects_update_policy" ON public.subjects;
DROP POLICY IF EXISTS "subjects_delete_policy" ON public.subjects;

DROP POLICY IF EXISTS "topics_select_policy" ON public.topics;
DROP POLICY IF EXISTS "topics_insert_policy" ON public.topics;
DROP POLICY IF EXISTS "topics_update_policy" ON public.topics;
DROP POLICY IF EXISTS "topics_delete_policy" ON public.topics;

DROP POLICY IF EXISTS "Anyone can view active subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Anyone can view active topics" ON public.topics;
DROP POLICY IF EXISTS "Admins can manage topics" ON public.topics;

-- Subjects policies
CREATE POLICY "subjects_select_policy" ON public.subjects
    FOR SELECT USING (true);

CREATE POLICY "subjects_insert_policy" ON public.subjects
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "subjects_update_policy" ON public.subjects
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "subjects_delete_policy" ON public.subjects
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Topics policies
CREATE POLICY "topics_select_policy" ON public.topics
    FOR SELECT USING (true);

CREATE POLICY "topics_insert_policy" ON public.topics
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "topics_update_policy" ON public.topics
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "topics_delete_policy" ON public.topics
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
