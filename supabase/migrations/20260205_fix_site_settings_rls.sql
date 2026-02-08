-- Fix site_settings RLS and add missing default values
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies and recreate with better permissions
DROP POLICY IF EXISTS "Admin full access to site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Authenticated users can read site_settings" ON public.site_settings;

-- 2. Create policy that allows both admin and super_admin to manage settings
CREATE POLICY "Admin full access to site_settings" ON public.site_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('admin', 'super_admin')
        )
    );

-- 3. Allow all authenticated users to read settings
CREATE POLICY "Authenticated users can read site_settings" ON public.site_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. Insert default admin settings if they don't exist
INSERT INTO public.site_settings (key, value)
VALUES 
    ('auto_approve_students', 'true'),
    ('yearly_subscription_fee', '199')
ON CONFLICT (key) DO NOTHING;
