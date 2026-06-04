DROP FUNCTION IF EXISTS daily_weather.get_preferences(TEXT);

CREATE OR REPLACE FUNCTION daily_weather.get_preferences(clerk_id_param TEXT)
RETURNS SETOF daily_weather.preferences
LANGUAGE sql
STABLE
AS $$
    SELECT *
    FROM daily_weather.preferences
    WHERE user_clerk_id = clerk_id_param;
$$;
