-- Migration: Allow anonymous users to read exams and mock_tests for landing page
-- This ensures the landing page shows database content even without login

-- Enable RLS on exams if not already enabled (safe to re-run)
ALTER TABLE IF EXISTS public.exams ENABLE ROW LEVEL SECURITY;

-- Enable RLS on mock_tests if not already enabled
ALTER TABLE IF EXISTS public.mock_tests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to exams" ON public.exams;
DROP POLICY IF EXISTS "Allow public read access to mock_tests" ON public.mock_tests;

-- Create policy to allow ALL users (including anonymous) to SELECT from exams
CREATE POLICY "Allow public read access to exams"
ON public.exams
FOR SELECT
TO public
USING (true);

-- Create policy to allow ALL users (including anonymous) to SELECT from mock_tests
CREATE POLICY "Allow public read access to mock_tests"
ON public.mock_tests
FOR SELECT
TO public
USING (true);

-- Also ensure subjects table is accessible for the landing page (tests may reference subjects)
DROP POLICY IF EXISTS "Allow public read access to subjects" ON public.subjects;

CREATE POLICY "Allow public read access to subjects"
ON public.subjects
FOR SELECT
TO public
USING (true);
