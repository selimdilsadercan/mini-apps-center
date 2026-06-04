ALTER TABLE daily_weather.preferences
  ADD COLUMN IF NOT EXISTS last_notified_date DATE;
