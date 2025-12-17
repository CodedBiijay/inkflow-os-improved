-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  artist_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  is_read BOOLEAN DEFAULT FALSE
);

-- Safely add columns if table already existed without them
DO $$
BEGIN
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS artist_id UUID;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type TEXT;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_type TEXT;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_id UUID;
    ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'Column already exists in notifications.';
END $$;

-- Index for fast lookup by artist and read status
CREATE INDEX IF NOT EXISTS idx_notifications_artist_read ON notifications(artist_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
