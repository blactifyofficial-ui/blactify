-- Disabling RLS temporarily on profiles to allow Firebase-based auth sync to work
-- Since the app uses Firebase for Auth and Supabase for Data, Supabase doesn't have the auth context.
-- A more permanent fix would be to use a Service Role key on the server (API route) for syncing.

DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;

CREATE POLICY "Public Read Profiles" ON profiles 
    FOR SELECT USING (true);

CREATE POLICY "Public Manage Profiles" ON profiles 
    FOR ALL USING (true) 
    WITH CHECK (true);
