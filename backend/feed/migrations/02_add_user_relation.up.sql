-- Add foreign key relationship between feed_events and users
-- This allows PostgREST to perform joins between these tables

-- First ensure clerk_id in users table has a unique constraint (it should, but let's be safe)
-- Note: We assume the users table exists in the public schema as per previous migrations

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_clerk_id_key'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_clerk_id_key UNIQUE (clerk_id);
    END IF;
END $$;

-- Add the foreign key constraint to feed_events
ALTER TABLE public.feed_events
ADD CONSTRAINT fk_feed_events_users
FOREIGN KEY (user_id) REFERENCES public.users(clerk_id)
ON DELETE CASCADE;
