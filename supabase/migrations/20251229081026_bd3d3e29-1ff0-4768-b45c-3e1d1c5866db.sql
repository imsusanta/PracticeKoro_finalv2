-- Add subject/topic categorization to study PDFs/notes
ALTER TABLE public.pdfs
ADD COLUMN IF NOT EXISTS subject_id uuid NULL,
ADD COLUMN IF NOT EXISTS topic_id uuid NULL;

-- Foreign keys (safe deletes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pdfs_subject_id_fkey'
  ) THEN
    ALTER TABLE public.pdfs
      ADD CONSTRAINT pdfs_subject_id_fkey
      FOREIGN KEY (subject_id) REFERENCES public.subjects(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pdfs_topic_id_fkey'
  ) THEN
    ALTER TABLE public.pdfs
      ADD CONSTRAINT pdfs_topic_id_fkey
      FOREIGN KEY (topic_id) REFERENCES public.topics(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_pdfs_subject_id ON public.pdfs(subject_id);
CREATE INDEX IF NOT EXISTS idx_pdfs_topic_id ON public.pdfs(topic_id);
CREATE INDEX IF NOT EXISTS idx_pdfs_exam_id ON public.pdfs(exam_id);