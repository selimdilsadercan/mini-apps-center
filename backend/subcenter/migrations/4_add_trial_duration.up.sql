-- Add trial duration column to subscription items
ALTER TABLE subcenter.items ADD COLUMN IF NOT EXISTS trial_duration TEXT DEFAULT NULL;
