-- Fix site_settings RLS policies for admin access
-- Run this in Supabase SQL Editor

-- First, create the has_role function if it doesn't exist
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 
    AND user_roles.role = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;

-- Create simpler policies that allow admin access
CREATE POLICY "Admin full access to site_settings" ON public.site_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- Allow all authenticated users to read settings (needed for AI question generator)
CREATE POLICY "Authenticated users can read site_settings" ON public.site_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Ensure table exists with correct structure
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Insert default values if not exist
INSERT INTO public.site_settings (key, value)
VALUES 
    ('openrouter_api_key', ''),
    ('openrouter_model', 'meta-llama/llama-3.1-405b-instruct:free')
ON CONFLICT (key) DO NOTHING;
