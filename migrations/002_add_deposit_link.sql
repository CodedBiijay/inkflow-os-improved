-- Migration to add deposit_link column to bookings table
-- Run this in the Supabase Dashboard > SQL Editor

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS deposit_link TEXT;
