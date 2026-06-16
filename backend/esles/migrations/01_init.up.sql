-- Migration: 01_init
-- Creates the esles schema, posts table, and RPC functions.

CREATE SCHEMA IF NOT EXISTS esles;

CREATE TABLE IF NOT EXISTS esles.posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id   INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_name    TEXT NOT NULL,
  platform     TEXT NOT NULL,
  player_count INTEGER NOT NULL DEFAULT 1,
  description  TEXT NOT NULL,
  rank_info    TEXT,
  scheduled_time TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_creator_id_idx ON esles.posts(creator_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON esles.posts(created_at DESC);

-- ── RPC: create_post ──────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS esles.create_post(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION esles.create_post(
  p_creator_clerk_id TEXT,
  p_game_name        TEXT,
  p_platform         TEXT,
  p_player_count     INTEGER,
  p_description      TEXT,
  p_rank_info        TEXT DEFAULT NULL,
  p_scheduled_time   TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator_id INTEGER;
  v_post_id    UUID;
BEGIN
  SELECT id INTO v_creator_id
  FROM public.users
  WHERE clerk_id = p_creator_clerk_id
     OR local_clerk_id = p_creator_clerk_id
  LIMIT 1;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', p_creator_clerk_id;
  END IF;

  INSERT INTO esles.posts (creator_id, game_name, platform, player_count, description, rank_info, scheduled_time)
  VALUES (v_creator_id, p_game_name, p_platform, p_player_count, p_description, p_rank_info, p_scheduled_time)
  RETURNING id INTO v_post_id;

  RETURN v_post_id;
END;
$$;

-- ── RPC: get_posts ────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS esles.get_posts(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION esles.get_posts(
  p_limit  INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id               UUID,
  creator_clerk_id TEXT,
  creator_username TEXT,
  creator_avatar   TEXT,
  game_name        TEXT,
  platform         TEXT,
  player_count     INTEGER,
  description      TEXT,
  rank_info        TEXT,
  scheduled_time   TEXT,
  created_at       TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    COALESCE(u.clerk_id, u.local_clerk_id) AS creator_clerk_id,
    u.username                              AS creator_username,
    u.avatar_url                            AS creator_avatar,
    p.game_name,
    p.platform,
    p.player_count,
    p.description,
    p.rank_info,
    p.scheduled_time,
    p.created_at
  FROM esles.posts p
  JOIN public.users u ON u.id = p.creator_id
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
