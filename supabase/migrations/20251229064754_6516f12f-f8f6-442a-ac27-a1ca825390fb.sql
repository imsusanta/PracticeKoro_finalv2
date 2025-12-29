-- Fix RLS policies for subjects table
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
DROP POLICY IF EXISTS "Approved students can view subjects" ON public.subjects;

-- Create specific policies for each operation
CREATE POLICY "Admins can insert subjects" ON public.subjects
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update subjects" ON public.subjects
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete subjects" ON public.subjects
FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view subjects" ON public.subjects
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Approved students can view subjects" ON public.subjects
FOR SELECT USING (
    public.has_role(auth.uid(), 'student'::app_role) AND EXISTS (
        SELECT 1 FROM approval_status 
        WHERE approval_status.user_id = auth.uid() 
        AND approval_status.status = 'approved'::approval_status_type
    )
);

-- Fix RLS policies for topics table
DROP POLICY IF EXISTS "Admins can manage topics" ON public.topics;
DROP POLICY IF EXISTS "Approved students can view topics" ON public.topics;

-- Create specific policies for each operation
CREATE POLICY "Admins can insert topics" ON public.topics
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update topics" ON public.topics
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete topics" ON public.topics
FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view topics" ON public.topics
FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Approved students can view topics" ON public.topics
FOR SELECT USING (
    public.has_role(auth.uid(), 'student'::app_role) AND EXISTS (
        SELECT 1 FROM approval_status 
        WHERE approval_status.user_id = auth.uid() 
        AND approval_status.status = 'approved'::approval_status_type
    )
);