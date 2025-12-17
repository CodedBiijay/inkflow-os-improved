-- Add title column to projects table if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS title text;

-- Force refresh of PostgREST schema cache
NOTIFY pgrst, 'reload schema';
