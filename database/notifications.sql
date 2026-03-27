-- SQL to create the notifications table in Supabase
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT,
    data JSONB DEFAULT '{}'::JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster cleanup and fetching
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Add RLS policy for admins (assuming your roles table or is_admin flag exists)
-- This is a simple policy that allows all operations for now, you might want to restrict to admins
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all notifications" ON "public"."notifications"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
