-- Migration: Remove redundant statistic columns from participants
-- We are moving to dynamic calculation in the get_standings function

ALTER TABLE tournament.participants 
DROP COLUMN IF EXISTS points,
DROP COLUMN IF EXISTS wins,
DROP COLUMN IF EXISTS losses,
DROP COLUMN IF EXISTS average;

-- We keep joined_at and is_manual as they are useful metadata
-- Ensure permissions are set correctly
GRANT ALL ON ALL TABLES IN SCHEMA tournament TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tournament TO anon, authenticated;
