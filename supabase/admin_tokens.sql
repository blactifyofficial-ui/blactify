-- admin_tokens Table for FCM Push Notifications
CREATE TABLE IF NOT EXISTS admin_tokens (
    token TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security
ALTER TABLE admin_tokens ENABLE ROW LEVEL SECURITY;

-- Note: Admins will be managing this via service role or specific RLS policies.
-- For this pipeline, we will use supabaseAdmin (Service Role) to interact with it.
