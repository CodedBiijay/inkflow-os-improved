-- Ensure ALL columns exist (comprehensive fix)
alter table intake_forms add column if not exists client_id uuid references clients(id) on delete cascade;
alter table intake_forms add column if not exists description text;
alter table intake_forms add column if not exists placement text;
alter table intake_forms add column if not exists size_estimate text;
alter table intake_forms add column if not exists color_preference text;
alter table intake_forms add column if not exists medical_notes text;
alter table intake_forms add column if not exists reference_images text[];

-- Force schema refresh for PostgREST
NOTIFY pgrst, 'reload schema';
