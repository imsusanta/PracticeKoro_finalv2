-- Allow approved students to view questions that are part of published tests they're taking
CREATE POLICY "Approved students can view questions in published tests" 
ON public.questions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (
    has_role(auth.uid(), 'student'::app_role) AND 
    EXISTS (
      SELECT 1 FROM approval_status 
      WHERE approval_status.user_id = auth.uid() 
      AND approval_status.status = 'approved'::approval_status_type
    ) AND
    EXISTS (
      SELECT 1 FROM test_questions tq
      JOIN mock_tests mt ON mt.id = tq.test_id
      WHERE tq.question_id = questions.id
      AND mt.is_published = true
    )
  )
);