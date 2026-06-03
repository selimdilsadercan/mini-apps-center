-- BoardGameClubs Schema & Initial Tables
CREATE SCHEMA IF NOT EXISTS board_game_clubs;

-- Clubs Table
CREATE TABLE IF NOT EXISTS board_game_clubs.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Games Table
CREATE TABLE IF NOT EXISTS board_game_clubs.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES board_game_clubs.clubs(id) ON DELETE CASCADE,
  bgg_id INTEGER,
  title TEXT NOT NULL,
  image_url TEXT,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER,
  description TEXT,
  condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'good', 'worn', 'damaged')),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'maintenance')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bgc_clubs_owner ON board_game_clubs.clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_bgc_games_club ON board_game_clubs.games(club_id);

-- Grants
GRANT USAGE ON SCHEMA board_game_clubs TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA board_game_clubs TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA board_game_clubs TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA board_game_clubs TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA board_game_clubs GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA board_game_clubs GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA board_game_clubs GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 1. create_club Function
DROP FUNCTION IF EXISTS board_game_clubs.create_club(TEXT, TEXT, TEXT, UUID);
CREATE OR REPLACE FUNCTION board_game_clubs.create_club(
  name_param TEXT,
  description_param TEXT,
  logo_url_param TEXT,
  owner_id_param UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  logo_url TEXT,
  owner_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
VOLATILE
AS $$
  INSERT INTO board_game_clubs.clubs (name, description, logo_url, owner_id)
  VALUES (name_param, description_param, logo_url_param, owner_id_param)
  RETURNING id, name, description, logo_url, owner_id, created_at;
$$;

-- 2. get_user_clubs Function
DROP FUNCTION IF EXISTS board_game_clubs.get_user_clubs(UUID);
CREATE OR REPLACE FUNCTION board_game_clubs.get_user_clubs(owner_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  logo_url TEXT,
  owner_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, description, logo_url, owner_id, created_at
  FROM board_game_clubs.clubs
  WHERE owner_id = owner_id_param
  ORDER BY name ASC;
$$;

-- 3. get_club_details Function
DROP FUNCTION IF EXISTS board_game_clubs.get_club_details(UUID);
CREATE OR REPLACE FUNCTION board_game_clubs.get_club_details(club_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  logo_url TEXT,
  owner_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, name, description, logo_url, owner_id, created_at
  FROM board_game_clubs.clubs
  WHERE id = club_id_param;
$$;

-- 4. add_club_game Function
DROP FUNCTION IF EXISTS board_game_clubs.add_club_game(UUID, INTEGER, TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION board_game_clubs.add_club_game(
  club_id_param UUID,
  bgg_id_param INTEGER,
  title_param TEXT,
  image_url_param TEXT,
  min_players_param INTEGER,
  max_players_param INTEGER,
  playing_time_param INTEGER,
  description_param TEXT,
  condition_param TEXT,
  status_param TEXT,
  notes_param TEXT
)
RETURNS TABLE (
  id UUID,
  club_id UUID,
  bgg_id INTEGER,
  title TEXT,
  image_url TEXT,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER,
  description TEXT,
  condition TEXT,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
VOLATILE
AS $$
  INSERT INTO board_game_clubs.games (
    club_id, bgg_id, title, image_url, min_players, max_players, playing_time, description, condition, status, notes
  )
  VALUES (
    club_id_param, bgg_id_param, title_param, image_url_param, min_players_param, max_players_param, playing_time_param, description_param, condition_param, status_param, notes_param
  )
  RETURNING id, club_id, bgg_id, title, image_url, min_players, max_players, playing_time, description, condition, status, notes, created_at;
$$;

-- 5. get_club_games Function
DROP FUNCTION IF EXISTS board_game_clubs.get_club_games(UUID);
CREATE OR REPLACE FUNCTION board_game_clubs.get_club_games(club_id_param UUID)
RETURNS TABLE (
  id UUID,
  club_id UUID,
  bgg_id INTEGER,
  title TEXT,
  image_url TEXT,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER,
  description TEXT,
  condition TEXT,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id, club_id, bgg_id, title, image_url, min_players, max_players, playing_time, description, condition, status, notes, created_at
  FROM board_game_clubs.games
  WHERE club_id = club_id_param
  ORDER BY title ASC;
$$;

-- 6. update_club_game Function
DROP FUNCTION IF EXISTS board_game_clubs.update_club_game(UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION board_game_clubs.update_club_game(
  game_id_param UUID,
  title_param TEXT,
  image_url_param TEXT,
  min_players_param INTEGER,
  max_players_param INTEGER,
  playing_time_param INTEGER,
  description_param TEXT,
  condition_param TEXT,
  status_param TEXT,
  notes_param TEXT
)
RETURNS TABLE (
  id UUID,
  club_id UUID,
  bgg_id INTEGER,
  title TEXT,
  image_url TEXT,
  min_players INTEGER,
  max_players INTEGER,
  playing_time INTEGER,
  description TEXT,
  condition TEXT,
  status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
VOLATILE
AS $$
BEGIN
  RETURN QUERY
  UPDATE board_game_clubs.games
  SET 
    title = COALESCE(title_param, games.title),
    image_url = COALESCE(image_url_param, games.image_url),
    min_players = COALESCE(min_players_param, games.min_players),
    max_players = COALESCE(max_players_param, games.max_players),
    playing_time = COALESCE(playing_time_param, games.playing_time),
    description = COALESCE(description_param, games.description),
    condition = COALESCE(condition_param, games.condition),
    status = COALESCE(status_param, games.status),
    notes = COALESCE(notes_param, games.notes)
  WHERE board_game_clubs.games.id = game_id_param
  RETURNING board_game_clubs.games.id, board_game_clubs.games.club_id, board_game_clubs.games.bgg_id, board_game_clubs.games.title, board_game_clubs.games.image_url, board_game_clubs.games.min_players, board_game_clubs.games.max_players, board_game_clubs.games.playing_time, board_game_clubs.games.description, board_game_clubs.games.condition, board_game_clubs.games.status, board_game_clubs.games.notes, board_game_clubs.games.created_at;
END;
$$;

-- 7. delete_club_game Function
DROP FUNCTION IF EXISTS board_game_clubs.delete_club_game(UUID);
CREATE OR REPLACE FUNCTION board_game_clubs.delete_club_game(game_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  deleted_rows INTEGER;
BEGIN
  DELETE FROM board_game_clubs.games
  WHERE id = game_id_param;
  
  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  RETURN deleted_rows > 0;
END;
$$;
