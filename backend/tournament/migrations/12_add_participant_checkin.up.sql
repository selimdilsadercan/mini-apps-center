-- Add is_present column to participants table for check-in system
ALTER TABLE tournament.participants ADD COLUMN IF NOT EXISTS is_present BOOLEAN DEFAULT FALSE;
