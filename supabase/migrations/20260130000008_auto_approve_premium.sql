-- Trigger to automatically approve students upon successful subscription purchase
CREATE OR REPLACE FUNCTION public.auto_approve_premium_student() 
RETURNS trigger AS $$
BEGIN
  -- Check if the purchase is a subscription and it's completed
  IF (NEW.content_type = 'subscription' AND NEW.status = 'completed') THEN
    -- Update approval status to 'approved'
    INSERT INTO public.approval_status (user_id, status, reviewed_at)
    VALUES (NEW.user_id, 'approved', now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      status = 'approved',
      reviewed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_auto_approve_premium ON public.purchases;
CREATE TRIGGER tr_auto_approve_premium
AFTER INSERT OR UPDATE OF status ON public.purchases
FOR EACH ROW
WHEN (NEW.content_type = 'subscription' AND NEW.status = 'completed')
EXECUTE FUNCTION public.auto_approve_premium_student();
