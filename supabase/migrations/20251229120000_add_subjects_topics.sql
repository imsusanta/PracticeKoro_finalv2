-- ============================================
-- Migration: Add Subjects and Topics for Notes
-- ============================================

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'book',
    color TEXT DEFAULT 'emerald',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add missing columns to subjects table if they don't exist
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create topics table (linked to subjects)
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add missing columns to topics table if they don't exist
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add topic_id column to pdfs table (notes)
ALTER TABLE public.pdfs ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL;

-- Add subject_id column to pdfs table for direct reference (optional, for faster queries)
ALTER TABLE public.pdfs ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON public.topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_pdfs_topic_id ON public.pdfs(topic_id);
CREATE INDEX IF NOT EXISTS idx_pdfs_subject_id ON public.pdfs(subject_id);

-- Enable RLS on subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subjects (drop first to make idempotent)
DROP POLICY IF EXISTS "Anyone can view active subjects" ON public.subjects;
CREATE POLICY "Anyone can view active subjects" ON public.subjects
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
CREATE POLICY "Admins can manage subjects" ON public.subjects
    FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Enable RLS on topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topics (drop first to make idempotent)
DROP POLICY IF EXISTS "Anyone can view active topics" ON public.topics;
CREATE POLICY "Anyone can view active topics" ON public.topics
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage topics" ON public.topics;
CREATE POLICY "Admins can manage topics" ON public.topics
    FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Grant permissions
GRANT SELECT ON public.subjects TO authenticated;
GRANT SELECT ON public.topics TO authenticated;
GRANT ALL ON public.subjects TO service_role;
GRANT ALL ON public.topics TO service_role;
