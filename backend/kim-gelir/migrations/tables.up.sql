--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (clerk_id TEXT -> user_id UUID)
DO $$ 
BEGIN 
    -- activities table: creator_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'kim_gelir' AND table_name = 'activities' AND column_name = 'creator_id') THEN
        -- Add creator_uuid column
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'kim_gelir' AND table_name = 'activities' AND column_name = 'creator_uuid') THEN
            ALTER TABLE kim_gelir.activities ADD COLUMN creator_uuid UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        -- Migrate data
        UPDATE kim_gelir.activities a
        SET creator_uuid = u.id
        FROM public.users u
        WHERE a.creator_id = u.clerk_id OR a.creator_id = u.local_clerk_id;

        -- Delete orphaned rows
        DELETE FROM kim_gelir.activities WHERE creator_uuid IS NULL;

        -- Drop old column and rename new one
        ALTER TABLE kim_gelir.activities DROP COLUMN creator_id;
        ALTER TABLE kim_gelir.activities RENAME COLUMN creator_uuid TO creator_id;
        
        -- Make NOT NULL
        ALTER TABLE kim_gelir.activities ALTER COLUMN creator_id SET NOT NULL;
    END IF;

    -- activity_invites table: user_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'kim_gelir' AND table_name = 'activity_invites' AND column_name = 'user_id' AND data_type = 'text') THEN
        -- Add user_uuid column
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'kim_gelir' AND table_name = 'activity_invites' AND column_name = 'user_uuid') THEN
            ALTER TABLE kim_gelir.activity_invites ADD COLUMN user_uuid UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        -- Migrate data
        UPDATE kim_gelir.activity_invites ai
        SET user_uuid = u.id
        FROM public.users u
        WHERE ai.user_id = u.clerk_id OR ai.user_id = u.local_clerk_id;

        -- Delete orphaned rows
        DELETE FROM kim_gelir.activity_invites WHERE user_uuid IS NULL;

        -- Drop old column and rename new one
        ALTER TABLE kim_gelir.activity_invites DROP COLUMN user_id;
        ALTER TABLE kim_gelir.activity_invites RENAME COLUMN user_uuid TO user_id;
        
        -- Make NOT NULL
        ALTER TABLE kim_gelir.activity_invites ALTER COLUMN user_id SET NOT NULL;

        -- Re-add unique constraint
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_invites_activity_id_user_id_key') THEN
            ALTER TABLE kim_gelir.activity_invites ADD CONSTRAINT activity_invites_activity_id_user_id_key UNIQUE (activity_id, user_id);
        END IF;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS kim_gelir;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA kim_gelir TO anon, authenticated, service_role;

-- 2. Activities Table
CREATE TABLE IF NOT EXISTS kim_gelir.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    time_option TEXT NOT NULL,
    custom_time TIMESTAMPTZ,
    scope TEXT NOT NULL DEFAULT 'friends',
    activity_type TEXT NOT NULL DEFAULT 'quick_invite' CHECK (activity_type IN ('quick_invite', 'plan_poll', 'time_poll')),
    options JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL
);

-- 3. Invites / Responses Table
CREATE TABLE IF NOT EXISTS kim_gelir.activity_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES kim_gelir.activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('gelirim', 'belki', 'gelemem', 'bekliyor')) DEFAULT 'bekliyor',
    selected_options JSONB DEFAULT '[]'::jsonb NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(activity_id, user_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_kg_activities_creator ON kim_gelir.activities(creator_id);
CREATE INDEX IF NOT EXISTS idx_kg_invites_user ON kim_gelir.activity_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_kg_invites_activity ON kim_gelir.activity_invites(activity_id);

-- 5. Grants
GRANT ALL ON ALL TABLES IN SCHEMA kim_gelir TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kim_gelir TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kim_gelir GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kim_gelir GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kim_gelir GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
