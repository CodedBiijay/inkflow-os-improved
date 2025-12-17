-- Migration to add missing status values to the 'project_status' ENUM type.
-- Run this in the Supabase Dashboard > SQL Editor.

ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'awaiting_approval';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'session_scheduled';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'no_show';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'rescheduled';
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'waitlist';


