-- Add order_index column to exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0.00;

-- Initialize order_index with existing IDs to have a unique starting order based on creation date
WITH numbered_exams AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM exams
)
UPDATE exams
SET order_index = numbered_exams.row_num
FROM numbered_exams
WHERE exams.id = numbered_exams.id;
