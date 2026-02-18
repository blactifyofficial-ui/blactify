-- Migration to add created_at column to profiles table
-- This is needed for admin growth statistics calculations

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Populate existing rows with a sensible default if they are null
UPDATE profiles SET created_at = NOW() WHERE created_at IS NULL;
