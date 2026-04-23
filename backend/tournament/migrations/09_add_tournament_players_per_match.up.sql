-- Migration: Add players_per_match to tournaments table
ALTER TABLE tournament.tournaments ADD COLUMN IF NOT EXISTS players_per_match INTEGER DEFAULT 2;
