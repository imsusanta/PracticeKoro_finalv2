-- Allow Admins to insert and update purchases for manual upgrades
-- 1. Admins can insert purchases for any user
CREATE POLICY "Admins can insert purchases"
ON public.purchases FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Admins can update purchases (e.g. status)
CREATE POLICY "Admins can update purchases"
ON public.purchases FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
