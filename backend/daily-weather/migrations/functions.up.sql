-- DailyWeather RPC Functions
-- 1. get_preferences(clerk_id_param TEXT)
-- 2. upsert_preferences(clerk_id_param TEXT, notifications_enabled_param BOOLEAN, notify_hour_param INTEGER, notify_minute_param INTEGER, city_param TEXT)

-- 1. get_preferences
DROP FUNCTION IF EXISTS daily_weather.get_preferences(TEXT);
CREATE OR REPLACE FUNCTION daily_weather.get_preferences(clerk_id_param TEXT)
RETURNS daily_weather.preferences AS $$
DECLARE
    v_user_uuid UUID;
    v_result daily_weather.preferences;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

    SELECT * INTO v_result
    FROM daily_weather.preferences p
    WHERE p.user_id = v_user_uuid;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. upsert_preferences
DROP FUNCTION IF EXISTS daily_weather.upsert_preferences(TEXT, BOOLEAN, INTEGER, INTEGER, TEXT);
CREATE OR REPLACE FUNCTION daily_weather.upsert_preferences(
    clerk_id_param TEXT,
    notifications_enabled_param BOOLEAN,
    notify_hour_param INTEGER,
    notify_minute_param INTEGER DEFAULT 0,
    city_param TEXT DEFAULT 'Istanbul'
)
RETURNS daily_weather.preferences AS $$
DECLARE
    v_user_uuid UUID;
    v_result daily_weather.preferences;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

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
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA daily_weather TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA daily_weather GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
