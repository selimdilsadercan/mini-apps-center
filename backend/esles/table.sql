-- Schema: esles
-- Root/ideal state of the database

CREATE SCHEMA IF NOT EXISTS esles;

CREATE TABLE IF NOT EXISTS esles.posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_name   TEXT NOT NULL,
  platform    TEXT NOT NULL,
  player_count INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  rank_info   TEXT,
  scheduled_time TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_creator_id_idx ON esles.posts(creator_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON esles.posts(created_at DESC);
