--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (user_clerk_id -> user_id)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'assistant' AND table_name = 'conversations' AND column_name = 'user_clerk_id') THEN
        -- Add user_id if not exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'assistant' AND table_name = 'conversations' AND column_name = 'user_id') THEN
            ALTER TABLE assistant.conversations ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        -- Migrate data
        UPDATE assistant.conversations c
        SET user_id = u.id
        FROM public.users u
        WHERE c.user_clerk_id = u.clerk_id OR c.user_clerk_id = u.local_clerk_id;

        -- Drop old column
        ALTER TABLE assistant.conversations DROP COLUMN user_clerk_id;
    ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'assistant' AND table_name = 'conversations' AND column_name = 'user_id') THEN
        -- Fresh install case: Ensure user_id exists if CREATE TABLE below is skipped or modified
        -- (Actually, CREATE TABLE below will handle fresh install)
        NULL;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS assistant;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA assistant TO anon, authenticated, service_role;

-- 2. Conversations Table
CREATE TABLE IF NOT EXISTS assistant.conversations (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user ON assistant.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_created_at ON assistant.conversations(created_at DESC);

-- 4. Grants
GRANT ALL ON ALL TABLES IN SCHEMA assistant TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA assistant TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA assistant TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA assistant GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA assistant GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA assistant GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
