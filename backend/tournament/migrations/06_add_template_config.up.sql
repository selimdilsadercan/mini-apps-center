-- Migration: Add missing config column to tournament.templates
ALTER TABLE tournament.templates ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

-- Re-grant permissions just in case
GRANT ALL ON ALL TABLES IN SCHEMA tournament TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tournament TO anon, authenticated;
