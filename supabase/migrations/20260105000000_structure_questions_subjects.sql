-- Migration: Structure Questions with Subjects and Topics
-- Path: supabase/migrations/20260105000000_structure_questions_subjects.sql

-- 1. Add subject_id and topic_id columns to questions table if they don't exist
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON public.questions(topic_id);

-- 3. Migrate existing text-based subject/topic data
DO $$
DECLARE
    q_record RECORD;
    new_subject_id UUID;
    new_topic_id UUID;
    admin_id UUID;
BEGIN
    -- Get an admin ID to use as created_by (fallback to a random UID if none found, though shouldn't happen)
    SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
    IF admin_id IS NULL THEN
        -- If no admin user found in roles, fallback to first user in profiles
        SELECT id INTO admin_id FROM public.profiles LIMIT 1;
    END IF;
    
    -- Iterate through questions that have text subjects and topics
    FOR q_record IN (
        SELECT id, exam_id, subject, topic 
        FROM public.questions 
        WHERE (subject IS NOT NULL OR topic IS NOT NULL)
    ) LOOP
        -- Process Subject
        IF q_record.subject IS NOT NULL THEN
            -- Try to find or create the subject for this exam
            INSERT INTO public.subjects (exam_id, name, created_by, updated_at)
            VALUES (q_record.exam_id, q_record.subject, admin_id, now())
            ON CONFLICT (exam_id, name) DO UPDATE SET updated_at = now()
            RETURNING id INTO new_subject_id;
            
            -- Link question to subject_id
            UPDATE public.questions SET subject_id = new_subject_id WHERE id = q_record.id;
        END IF;

        -- Process Topic
        IF q_record.topic IS NOT NULL AND new_subject_id IS NOT NULL THEN
            -- Try to find or create the topic for this subject
            INSERT INTO public.topics (subject_id, name, created_by, updated_at)
            VALUES (new_subject_id, q_record.topic, admin_id, now())
            ON CONFLICT (subject_id, name) DO UPDATE SET updated_at = now()
            RETURNING id INTO new_topic_id;
            
            -- Link question to topic_id
            UPDATE public.questions SET topic_id = new_topic_id WHERE id = q_record.id;
        END IF;
        
        -- Reset variables for next iteration
        new_subject_id := NULL;
        new_topic_id := NULL;
    END LOOP;
END $$;
