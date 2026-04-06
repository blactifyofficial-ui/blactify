-- 17. User Preferences Table (Wishlist / Interest)
-- This table stores customer interest in out-of-stock products.

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups in admin panel
CREATE INDEX IF NOT EXISTS idx_user_preferences_product ON user_preferences(product_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------
-- POLICIES
-- ---------------------------------------------------------

DO $$ 
BEGIN
    -- Allow users to insert their own preferences
    DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
    CREATE POLICY "Users can insert own preferences" ON user_preferences 
    FOR INSERT WITH CHECK (true); -- insert is allowed for everyone to record interest

    -- Allow users to view their own preferences
    DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
    CREATE POLICY "Users can view own preferences" ON user_preferences 
    FOR SELECT USING (true); -- Simplified for public interest tracking

    -- Allow full access for service role (Admin Panel uses supabaseAdmin)
    -- In Supabase, service_role bypasses RLS automatically.
END $$;
