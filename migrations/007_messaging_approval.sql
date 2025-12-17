-- Create project_messages table
CREATE TABLE IF NOT EXISTS project_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('artist', 'client')),
  message TEXT,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS design_files TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'changes_requested', 'drafting')) DEFAULT 'pending';

-- Add RLS policies (optional but good practice, assuming public access needed for client approval pages implies some public read access, but we'll stick to basic schema for now as we use Service Key for APIs usually)
-- For now, we rely on API logic for access control.
