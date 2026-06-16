--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (user_id TEXT -> user_id UUID)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feed_events' AND column_name = 'user_id' AND data_type = 'text') THEN
        -- Rename old column
        ALTER TABLE public.feed_events RENAME COLUMN user_id TO user_id_old;
        
        -- Add new UUID column
        ALTER TABLE public.feed_events ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        -- Migrate data
        UPDATE public.feed_events fe
        SET user_id = u.id
        FROM public.users u
        WHERE fe.user_id_old = u.clerk_id OR fe.user_id_old = u.local_clerk_id;
        
        -- Drop old column
        ALTER TABLE public.feed_events DROP COLUMN user_id_old;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Feed Events Table
CREATE TABLE IF NOT EXISTS public.feed_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    username TEXT,
    user_avatar TEXT,
    app_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_feed_events_user ON public.feed_events(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_events_app ON public.feed_events(app_id);
CREATE INDEX IF NOT EXISTS idx_feed_events_created_at ON public.feed_events(created_at DESC);

-- 3. Grants
GRANT ALL ON TABLE public.feed_events TO anon, authenticated, service_role;
