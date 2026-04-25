-- Add avoid_list column to participants table
ALTER TABLE tournament.participants ADD COLUMN IF NOT EXISTS avoid_list TEXT[] DEFAULT '{}';
