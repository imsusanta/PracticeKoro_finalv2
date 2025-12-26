-- =============================================
-- CHAT MESSAGES TABLE - RUN THIS IN SUPABASE SQL EDITOR
-- =============================================

-- Create the chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL,
    sender_role text NOT NULL CHECK (sender_role IN ('student', 'admin')),
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_student_id ON public.chat_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS "Allow all select" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all insert" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all update" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all delete" ON public.chat_messages;

-- Create simple policies (allow all authenticated users for now)
CREATE POLICY "Allow all select" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.chat_messages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow all delete" ON public.chat_messages FOR DELETE TO authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
