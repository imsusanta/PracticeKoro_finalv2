-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage site_settings
CREATE POLICY "Admins can manage site_settings" ON public.site_settings
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow public read
CREATE POLICY "Public read site_settings" ON public.site_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Create storage bucket for PDF library
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs_library', 'pdfs_library', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for pdfs_library
CREATE POLICY "Admins can upload to pdfs_library"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdfs_library' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update pdfs_library"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pdfs_library' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete from pdfs_library"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdfs_library' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Library PDFs are accessible to authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pdfs_library');

-- Seed default settings
INSERT INTO public.site_settings (key, value)
VALUES 
    ('openrouter_api_key', ''),
    ('openrouter_model', 'meta-llama/llama-3.1-405b-instruct:free')
ON CONFLICT (key) DO NOTHING;