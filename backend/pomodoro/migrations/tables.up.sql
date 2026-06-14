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
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'pomodoro' AND table_name = 'sessions' AND column_name = 'user_id' AND data_type = 'text') THEN
        ALTER TABLE pomodoro.sessions RENAME COLUMN user_id TO user_id_old;
        ALTER TABLE pomodoro.sessions ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        -- Migrate data
        UPDATE pomodoro.sessions s
        SET user_id = u.id
        FROM public.users u
        WHERE s.user_id_old = u.clerk_id OR s.user_id_old = u.local_clerk_id;

        -- Delete orphaned rows
        DELETE FROM pomodoro.sessions WHERE user_id IS NULL;

        -- Drop old column
        ALTER TABLE pomodoro.sessions DROP COLUMN user_id_old;
        
        -- Make NOT NULL
        ALTER TABLE pomodoro.sessions ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS pomodoro;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA pomodoro TO anon, authenticated, service_role;

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS pomodoro.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('work', 'break')),
    duration_minutes INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro.sessions(user_id);

-- 4. Grants
GRANT ALL ON ALL TABLES IN SCHEMA pomodoro TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA pomodoro TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pomodoro GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pomodoro GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pomodoro GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
