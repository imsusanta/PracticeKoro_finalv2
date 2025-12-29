-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(exam_id, name)
);

-- Create topics table
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(subject_id, name)
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subjects
CREATE POLICY "Admins can manage subjects" ON public.subjects
FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Approved students can view subjects" ON public.subjects
FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    (public.has_role(auth.uid(), 'student'::app_role) AND EXISTS (
        SELECT 1 FROM approval_status 
        WHERE approval_status.user_id = auth.uid() 
        AND approval_status.status = 'approved'::approval_status_type
    ))
);

-- RLS Policies for topics
CREATE POLICY "Admins can manage topics" ON public.topics
FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Approved students can view topics" ON public.topics
FOR SELECT USING (
    public.has_role(auth.uid(), 'admin'::app_role) OR 
    (public.has_role(auth.uid(), 'student'::app_role) AND EXISTS (
        SELECT 1 FROM approval_status 
        WHERE approval_status.user_id = auth.uid() 
        AND approval_status.status = 'approved'::approval_status_type
    ))
);

-- Add triggers for updated_at
CREATE TRIGGER update_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_topics_updated_at
BEFORE UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();