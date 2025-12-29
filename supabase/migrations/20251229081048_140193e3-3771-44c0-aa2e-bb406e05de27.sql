-- Re-enable RLS (was previously disabled) to satisfy security linter and protect data access
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;