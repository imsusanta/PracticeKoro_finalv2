-- ============================================
-- Fix: Update RLS Policies for Subjects and Topics
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Anyone can view active topics" ON public.topics;
DROP POLICY IF EXISTS "Admins can manage topics" ON public.topics;

-- Subjects policies
CREATE POLICY "subjects_select_policy" ON public.subjects
    FOR SELECT USING (true);

CREATE POLICY "subjects_insert_policy" ON public.subjects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "subjects_update_policy" ON public.subjects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "subjects_delete_policy" ON public.subjects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Topics policies
CREATE POLICY "topics_select_policy" ON public.topics
    FOR SELECT USING (true);

CREATE POLICY "topics_insert_policy" ON public.topics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "topics_update_policy" ON public.topics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "topics_delete_policy" ON public.topics
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Grant all permissions to authenticated users (RLS will control access)
GRANT ALL ON public.subjects TO authenticated;
GRANT ALL ON public.topics TO authenticated;
