-- Run in Supabase if preferences table / notify_minute was created before this update
ALTER TABLE daily_weather.preferences
ADD COLUMN IF NOT EXISTS notify_minute INTEGER NOT NULL DEFAULT 0;

ALTER TABLE daily_weather.preferences
DROP CONSTRAINT IF EXISTS preferences_notify_hour_check;

ALTER TABLE daily_weather.preferences
ADD CONSTRAINT preferences_notify_hour_check
CHECK (notify_hour >= 0 AND notify_hour <= 23);

NOTIFY pgrst, 'reload schema';
