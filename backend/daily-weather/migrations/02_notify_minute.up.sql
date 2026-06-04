ALTER TABLE daily_weather.preferences
ADD COLUMN IF NOT EXISTS notify_minute INTEGER NOT NULL DEFAULT 0;

ALTER TABLE daily_weather.preferences
DROP CONSTRAINT IF EXISTS preferences_notify_hour_check;

ALTER TABLE daily_weather.preferences
ADD CONSTRAINT preferences_notify_hour_check
CHECK (notify_hour >= 0 AND notify_hour <= 23);

ALTER TABLE daily_weather.preferences
DROP CONSTRAINT IF EXISTS preferences_notify_minute_check;

ALTER TABLE daily_weather.preferences
ADD CONSTRAINT preferences_notify_minute_check
CHECK (notify_minute >= 0 AND notify_minute <= 59);
