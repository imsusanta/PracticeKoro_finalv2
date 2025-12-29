-- Disable RLS on subjects and topics tables
ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to authenticated users
GRANT ALL ON public.subjects TO authenticated;
GRANT ALL ON public.topics TO authenticated;