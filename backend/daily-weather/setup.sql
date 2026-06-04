-- Run in Supabase if preferences table / notify_minute was created before this update
ALTER TABLE daily_weather.preferences
ADD COLUMN IF NOT EXISTS notify_minute INTEGER NOT NULL DEFAULT 0;

ALTER TABLE daily_weather.preferences
DROP CONSTRAINT IF EXISTS preferences_notify_hour_check;

ALTER TABLE daily_weather.preferences
ADD CONSTRAINT preferences_notify_hour_check
CHECK (notify_hour >= 0 AND notify_hour <= 23);

ALTER TABLE daily_weather.preferences
ADD COLUMN IF NOT EXISTS last_notified_date DATE;

NOTIFY pgrst, 'reload schema';

-- Encore secrets (Dashboard veya: encore secret set --dev <name> <value>)
-- FirebaseServiceAccount: Firebase Console > Project settings > Service accounts > JSON (tam dosya)
-- Alternatif: FcmServerKey: Cloud Messaging > Server key (legacy)
