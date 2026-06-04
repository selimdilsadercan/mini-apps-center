CREATE SCHEMA IF NOT EXISTS daily_weather;

CREATE TABLE IF NOT EXISTS daily_weather.preferences (
    user_clerk_id TEXT PRIMARY KEY REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    notify_hour INTEGER NOT NULL DEFAULT 7 CHECK (notify_hour >= 0 AND notify_hour <= 23),
    notify_minute INTEGER NOT NULL DEFAULT 0 CHECK (notify_minute >= 0 AND notify_minute <= 59),
    city TEXT NOT NULL DEFAULT 'Istanbul',
    last_notified_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_weather_preferences_enabled
ON daily_weather.preferences(notifications_enabled)
WHERE notifications_enabled = TRUE;

GRANT USAGE ON SCHEMA daily_weather TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA daily_weather TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA daily_weather TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA daily_weather TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA daily_weather GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA daily_weather GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA daily_weather GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
