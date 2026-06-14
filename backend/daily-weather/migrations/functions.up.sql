-- DailyWeather RPC Functions

-- 1. get_preferences
DROP FUNCTION IF EXISTS daily_weather.get_preferences(TEXT);
CREATE OR REPLACE FUNCTION daily_weather.get_preferences(clerk_id_param TEXT)
RETURNS TABLE (
    user_id UUID,
    notifications_enabled BOOLEAN,
    notify_hour INTEGER,
    notify_minute INTEGER,
    city TEXT,
    last_notified_date DATE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
#variable_conflict use_column
DECLARE
    v_user_uuid UUID;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT 
        p.user_id,
        p.notifications_enabled,
        p.notify_hour,
        p.notify_minute,
        p.city,
        p.last_notified_date,
        p.created_at,
        p.updated_at
    FROM daily_weather.preferences p
    WHERE p.user_id = v_user_uuid;
END;
$$;

-- 2. upsert_preferences
DROP FUNCTION IF EXISTS daily_weather.upsert_preferences(TEXT, BOOLEAN, INTEGER, INTEGER, TEXT);
CREATE OR REPLACE FUNCTION daily_weather.upsert_preferences(
    clerk_id_param TEXT,
    notifications_enabled_param BOOLEAN,
    notify_hour_param INTEGER,
    notify_minute_param INTEGER DEFAULT 0,
    city_param TEXT DEFAULT 'Istanbul'
)
RETURNS TABLE (
    user_id UUID,
    notifications_enabled BOOLEAN,
    notify_hour INTEGER,
    notify_minute INTEGER,
    city TEXT,
    last_notified_date DATE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
#variable_conflict use_column
DECLARE
    v_user_uuid UUID;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    INSERT INTO daily_weather.preferences (
        user_id,
        notifications_enabled,
        notify_hour,
        notify_minute,
        city,
        updated_at
    )
    VALUES (
        v_user_uuid,
        notifications_enabled_param,
        notify_hour_param,
        COALESCE(notify_minute_param, 0),
        COALESCE(NULLIF(TRIM(city_param), ''), 'Istanbul'),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        notifications_enabled = EXCLUDED.notifications_enabled,
        notify_hour = EXCLUDED.notify_hour,
        notify_minute = EXCLUDED.notify_minute,
        city = EXCLUDED.city,
        updated_at = NOW()
    RETURNING 
        daily_weather.preferences.user_id,
        daily_weather.preferences.notifications_enabled,
        daily_weather.preferences.notify_hour,
        daily_weather.preferences.notify_minute,
        daily_weather.preferences.city,
        daily_weather.preferences.last_notified_date,
        daily_weather.preferences.created_at,
        daily_weather.preferences.updated_at;
END;
$$;

-- 3. Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA daily_weather TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA daily_weather GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
