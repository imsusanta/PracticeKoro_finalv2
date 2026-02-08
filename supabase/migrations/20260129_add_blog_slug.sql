-- Add slug column to blog_posts table
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);

-- Backfill existing posts with auto-generated slugs from title
-- This converts titles to URL-friendly slugs
UPDATE public.blog_posts 
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
    )
) 
WHERE slug IS NULL;
