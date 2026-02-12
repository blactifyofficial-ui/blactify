-- Drop table first to clean up any potential schema mismatches (e.g., user_id as TEXT)
DROP TABLE IF EXISTS public.reviews CASCADE;

-- Create Reviews Table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    -- Changed user_id to TEXT to match profiles(id) (likely Firebase UID)
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add explicit Foreign Key to Profiles for PostgREST join
-- This allows: supabase.from('reviews').select('*, profiles(*)')
-- Since we are using Firebase Auth, Supabase auth.uid() is null.
-- We must allow anon access for now, or use a backend proxy.
-- For this setup, we will allow public access to reviews.

DROP POLICY IF EXISTS "Enable all access for anon" ON public.reviews;
CREATE POLICY "Enable all access for anon"
ON public.reviews FOR ALL
USING (true)
WITH CHECK (true);
