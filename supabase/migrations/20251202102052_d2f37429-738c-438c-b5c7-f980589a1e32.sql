-- Create trigger to automatically create profile, role, and approval status for new users
-- This trigger was missing, causing new registrations to not appear in admin panel

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();