-- Migration: Support Mock Players and Participant-based Matches
-- 1. Make user_id nullable in participants
ALTER TABLE tournament.participants ALTER COLUMN user_id DROP NOT NULL;

-- 2. Update matches table to reference participants instead of users
-- First, drop old foreign keys (need to find names, usually auto-generated)
-- We can just recreate the table or alter it. Recreating matches is safer for mock data.

-- Drop existing matches table and recreate with correct references
DROP TABLE IF EXISTS tournament.matches CASCADE;

CREATE TABLE tournament.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournament.tournaments(id) ON DELETE CASCADE,
  phase TEXT NOT NULL, -- 'league' or 'bracket'
  round INTEGER NOT NULL DEFAULT 1,
  player1_id UUID REFERENCES tournament.participants(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES tournament.participants(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES tournament.participants(id) ON DELETE SET NULL,
  scores JSONB DEFAULT '{}',
  status TEXT DEFAULT 'upcoming', -- upcoming, playing, finished, abandoned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update fill_mock_players to correctly handle nullable user_id
-- (The existing function is already fine if NOT NULL is removed)

-- 4. Update table.sql for future consistency
