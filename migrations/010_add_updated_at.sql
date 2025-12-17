-- Add updated_at column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Force schema refresh
NOTIFY pgrst, 'reload schema';
