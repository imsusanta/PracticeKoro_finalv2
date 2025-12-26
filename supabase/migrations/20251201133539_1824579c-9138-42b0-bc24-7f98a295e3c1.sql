-- Create study-materials storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', true);

-- RLS policies for study-materials bucket
CREATE POLICY "Admins can upload study materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'study-materials' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Approved users can view study materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'study-materials' AND (
    has_role(auth.uid(), 'admin'::app_role) OR
    (has_role(auth.uid(), 'student'::app_role) AND EXISTS (
      SELECT 1 FROM approval_status 
      WHERE user_id = auth.uid() AND status = 'approved'::approval_status_type
    ))
  )
);

CREATE POLICY "Admins can delete study materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'study-materials' AND 
  has_role(auth.uid(), 'admin'::app_role)
);