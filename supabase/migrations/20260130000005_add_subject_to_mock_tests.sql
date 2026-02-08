-- Add subject_id to mock_tests to support topic-wise tests linked to subjects
ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;

-- Update RLS policies to include the new column if necessary (usually not needed for column additions unless policies use them)
-- But we'll ensure the policies are refreshed for the table
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
