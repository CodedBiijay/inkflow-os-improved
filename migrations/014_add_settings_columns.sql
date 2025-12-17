-- Migration: 014_add_settings_columns.sql
-- Description: Add columns for Artist Settings (Profile & Payments)

ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS studio_name TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS default_deposit_amount NUMERIC(10, 2) DEFAULT 100.00;

-- Ensure RLS allows update by the artist themselves (assuming existing policies cover this or service role is used)
-- If not, we might need policy updates, but for now we assume basic Auth/Service Role usage.
