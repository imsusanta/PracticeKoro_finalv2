-- Add content column for text-based PDFs
ALTER TABLE public.pdfs ADD COLUMN IF NOT EXISTS content text;

-- Make file_path nullable (for text-only content)
ALTER TABLE public.pdfs ALTER COLUMN file_path DROP NOT NULL;

-- Add update policy for admins
CREATE POLICY "Admins can update PDFs" ON public.pdfs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));