-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,
    image_url TEXT,
    author TEXT DEFAULT 'Admin',
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published posts
CREATE POLICY "Anyone can read published blog posts" ON public.blog_posts
    FOR SELECT USING (is_published = true);

-- Policy: Authenticated users can read all posts (for admin)
CREATE POLICY "Authenticated users can read all blog posts" ON public.blog_posts
    FOR SELECT TO authenticated USING (true);

-- Policy: Authenticated users can insert posts
CREATE POLICY "Authenticated users can insert blog posts" ON public.blog_posts
    FOR INSERT TO authenticated WITH CHECK (true);

-- Policy: Authenticated users can update posts
CREATE POLICY "Authenticated users can update blog posts" ON public.blog_posts
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Policy: Authenticated users can delete posts
CREATE POLICY "Authenticated users can delete blog posts" ON public.blog_posts
    FOR DELETE TO authenticated USING (true);
