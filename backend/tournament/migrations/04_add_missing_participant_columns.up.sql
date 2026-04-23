-- Migration: Add missing columns to participants table
-- These columns are required for the standings (puan durumu) logic

ALTER TABLE tournament.participants 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;

-- Ensure all tables in the tournament schema are accessible to the API
GRANT ALL ON ALL TABLES IN SCHEMA tournament TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tournament TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tournament TO anon, authenticated;
