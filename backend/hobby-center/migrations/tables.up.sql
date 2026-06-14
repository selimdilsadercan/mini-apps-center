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
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'hobby_center' AND table_name = 'user_hobbies' AND column_name = 'clerk_id') THEN
        -- Add user_id if not exists (handle partial migration)
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'hobby_center' AND table_name = 'user_hobbies' AND column_name = 'user_id') THEN
            ALTER TABLE hobby_center.user_hobbies ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        -- Migrate data
        UPDATE hobby_center.user_hobbies uh
        SET user_id = u.id
        FROM public.users u
        WHERE uh.clerk_id = u.clerk_id OR uh.clerk_id = u.local_clerk_id;

        -- Drop old column and its unique constraint
        ALTER TABLE hobby_center.user_hobbies DROP COLUMN clerk_id;
        
        -- Add new unique constraint
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_hobbies_user_id_hobby_id_key') THEN
            ALTER TABLE hobby_center.user_hobbies ADD CONSTRAINT user_hobbies_user_id_hobby_id_key UNIQUE (user_id, hobby_id);
        END IF;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS hobby_center;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA hobby_center TO anon, authenticated, service_role;

-- 2. User Hobbies Table
CREATE TABLE IF NOT EXISTS hobby_center.user_hobbies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    hobby_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('interested', 'in_progress', 'learned')),
    notes TEXT DEFAULT '',
    completed_steps JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, hobby_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_hobby_center_user ON hobby_center.user_hobbies(user_id);
CREATE INDEX IF NOT EXISTS idx_hobby_center_updated_at ON hobby_center.user_hobbies(updated_at DESC);

-- 4. Grants
GRANT ALL ON ALL TABLES IN SCHEMA hobby_center TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA hobby_center TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA hobby_center GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA hobby_center GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA hobby_center GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
