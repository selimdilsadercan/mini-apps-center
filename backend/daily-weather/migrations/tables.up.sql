--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (user_clerk_id TEXT -> user_id UUID)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'daily_weather' AND table_name = 'preferences' AND column_name = 'user_clerk_id') THEN
        ALTER TABLE daily_weather.preferences RENAME COLUMN user_clerk_id TO user_clerk_id_old;
        ALTER TABLE daily_weather.preferences ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        UPDATE daily_weather.preferences p
        SET user_id = u.id
        FROM public.users u
        WHERE p.user_clerk_id_old = u.clerk_id OR p.user_clerk_id_old = u.local_clerk_id;
        
        ALTER TABLE daily_weather.preferences DROP COLUMN user_clerk_id_old;
        ALTER TABLE daily_weather.preferences ADD PRIMARY KEY (user_id);
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS daily_weather;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA daily_weather TO anon, authenticated, service_role;

-- 2. Preferences Table
CREATE TABLE IF NOT EXISTS daily_weather.preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    notify_hour INTEGER NOT NULL DEFAULT 7 CHECK (notify_hour >= 0 AND notify_hour <= 23),
    notify_minute INTEGER NOT NULL DEFAULT 0 CHECK (notify_minute >= 0 AND notify_minute <= 59),
    city TEXT NOT NULL DEFAULT 'Istanbul',
    last_notified_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_daily_weather_preferences_enabled
ON daily_weather.preferences(notifications_enabled)
WHERE notifications_enabled = TRUE;

-- 4. Grants
GRANT ALL ON ALL TABLES IN SCHEMA daily_weather TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA daily_weather TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA daily_weather GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA daily_weather GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA daily_weather GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
