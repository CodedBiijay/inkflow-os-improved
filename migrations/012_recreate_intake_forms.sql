-- Recreate intake_forms table to fix persistent schema cache issues
-- Warning: This deletes existing intake data

DROP TABLE IF EXISTS intake_forms CASCADE;

CREATE TABLE intake_forms (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references projects(id) on delete cascade not null,
    client_id uuid references clients(id) on delete cascade not null,
    description text,
    placement text,
    size_estimate text,
    color_preference text,
    medical_notes text,
    reference_images text[], -- Array of URLs
    created_at timestamptz default now()
);

-- Re-add the foreign key column to projects if it was dropped by cascade (it might just set to null, but let's be safe)
-- Actually, cascade on drop table intake_forms removes constraints dependent on it. 
-- The 'projects.intake_form_id' FK reference needs to be re-established.
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_intake_form_id_fkey;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS intake_form_id uuid;
ALTER TABLE projects ADD CONSTRAINT projects_intake_form_id_fkey FOREIGN KEY (intake_form_id) REFERENCES intake_forms(id);

-- Enable RLS
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;

-- Refresh Schema
NOTIFY pgrst, 'reload schema';
