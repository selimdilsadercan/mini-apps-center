DROP FUNCTION IF EXISTS daily_weather.upsert_preferences(TEXT, BOOLEAN, INTEGER, TEXT);
DROP FUNCTION IF EXISTS daily_weather.upsert_preferences(TEXT, BOOLEAN, INTEGER, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION daily_weather.upsert_preferences(
    clerk_id_param TEXT,
    notifications_enabled_param BOOLEAN,
    notify_hour_param INTEGER,
    notify_minute_param INTEGER DEFAULT 0,
    city_param TEXT DEFAULT 'Istanbul'
)
RETURNS SETOF daily_weather.preferences
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO daily_weather.preferences (
        user_clerk_id,
        notifications_enabled,
        notify_hour,
        notify_minute,
        city,
        updated_at
    )
    VALUES (
        clerk_id_param,
        notifications_enabled_param,
        notify_hour_param,
        COALESCE(notify_minute_param, 0),
        COALESCE(NULLIF(TRIM(city_param), ''), 'Istanbul'),
        NOW()
    )
    ON CONFLICT (user_clerk_id) DO UPDATE SET
        notifications_enabled = EXCLUDED.notifications_enabled,
        notify_hour = EXCLUDED.notify_hour,
        notify_minute = EXCLUDED.notify_minute,
        city = EXCLUDED.city,
        updated_at = NOW()
    RETURNING *;
END;
$$;
