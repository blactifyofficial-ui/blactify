-- Migration to add missing created_at column to profiles table
-- Required for admin dashboard statistics
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
