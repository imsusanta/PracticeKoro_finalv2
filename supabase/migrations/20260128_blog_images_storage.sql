-- Create blog-images storage bucket
-- Run this in Supabase SQL Editor

-- Note: Storage buckets are managed via Supabase Dashboard or API
-- This migration provides the SQL to set up RLS policies for the bucket

-- First, create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "New Bucket"
-- 3. Name it "blog-images"
-- 4. Enable "Public bucket" option
-- 5. Save

-- Then run these policies:

-- Allow authenticated users to upload blog images
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
CREATE POLICY "Authenticated users can upload blog images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Allow authenticated users to update blog images
DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
CREATE POLICY "Authenticated users can update blog images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'blog-images');

-- Allow public read access to blog images
DROP POLICY IF EXISTS "Public blog images access" ON storage.objects;
CREATE POLICY "Public blog images access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'blog-images');

-- Allow authenticated users to delete blog images
DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;
CREATE POLICY "Authenticated users can delete blog images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'blog-images');
