-- Add artist reference images array to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS artist_reference_images text[] DEFAULT '{}';

-- Add reference notes JSONB to projects
-- Key: image URL, Value: note text
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS reference_notes jsonb DEFAULT '{}'::jsonb;
