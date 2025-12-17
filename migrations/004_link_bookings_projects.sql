-- Link bookings to projects
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id);

-- Add last_booking_id to projects for easy access
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_booking_id uuid REFERENCES bookings(id);

-- Ensure projects has service_id (missed in original schema assumptions)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id);

-- Ensure projects has description (missed in original schema assumptions)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description text;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_project_id ON bookings(project_id);
