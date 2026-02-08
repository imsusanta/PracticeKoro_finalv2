-- Make exam_id nullable in mock_tests
ALTER TABLE public.mock_tests ALTER COLUMN exam_id DROP NOT NULL;
