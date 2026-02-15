-- Migration to add missing columns to the profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_discount_used BOOLEAN DEFAULT FALSE;
