-- Add content column to pdfs table for text notes
ALTER TABLE public.pdfs ADD COLUMN IF NOT EXISTS content text;

-- Make file_path nullable since text notes don't need files
ALTER TABLE public.pdfs ALTER COLUMN file_path DROP NOT NULL;

-- Add update policy for pdfs (notes)
CREATE POLICY "Admins can update PDFs" ON public.pdfs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));
