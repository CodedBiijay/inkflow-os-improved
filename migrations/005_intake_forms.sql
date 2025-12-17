-- Create intake_forms table
create table if not exists intake_forms (
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

-- Add intake_form_id to projects (for easy access/linking)
alter table projects add column if not exists intake_form_id uuid references intake_forms(id);

-- Enable RLS on intake_forms
alter table intake_forms enable row level security;

-- Policy: Allow public to insert (since it's a public form, but ideally secured by a token or project_id check in API)
-- For now, we will rely on server-side API keys (service role) to insert, so no RLS policy needed for anon if we only use API routes.
-- But if we wanted client-side insert:
-- create policy "Enable insert for everyone" on intake_forms for insert with check (true);

-- Attempt to create storage bucket 'references'
-- Note: This requires permissions on storage schema. If this fails, user must create bucket in dashboard.
insert into storage.buckets (id, name, public)
values ('references', 'references', false)
on conflict (id) do nothing;

-- Policy for storage: Allow authenticated uploads? 
-- Since we are doing server-side upload via API, we use Service Role there.
-- If we want client-side upload (using Supabase JS client in browser), we need policies.
-- The requirements say "Upload images to Supabase bucket... Store file URLs".
-- And "Upload rules: Only server-side API (RLS) can write... Client uploads go through Next.js API route".
-- So we don't need public RLS policies for storage if we use Service Role in the API route.
