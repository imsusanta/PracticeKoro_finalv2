-- ============================================
-- Fix: Update RLS Policies for Notifications (REFINED)
-- Allows admins and instructors to manage all notifications
-- ============================================

-- Drop existing policies to allow redefining them
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;

-- Select Policy: Users see their own, Admins/Instructors see all
-- This is critical for the "Recent Notifications" list in the admin panel
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'instructor'::public.app_role)
);

-- Update Policy: Users update their own (mark as read), Admins/Instructors update all
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (
    auth.uid() = user_id OR 
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'instructor'::public.app_role)
);

-- Insert Policy: Admins/Instructors can send notifications
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'instructor'::public.app_role)
);

-- Delete Policy: Admins/Instructors can delete any notification
CREATE POLICY "Admins can delete notifications"
ON public.notifications FOR DELETE
USING (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'instructor'::public.app_role)
);

-- Ensure there's no data that might be hidden due to NULL user_id or similar
-- (Though the schema says NOT NULL)
