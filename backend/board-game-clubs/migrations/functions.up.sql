-- BoardGameClubs RPC Functions
-- 1. create_club(name_param TEXT, description_param TEXT, logo_url_param TEXT, owner_id_param TEXT)
-- 2. get_user_clubs(owner_id_param TEXT)
-- 3. get_club_details(club_id_param UUID)
-- 4. add_club_game(club_id_param UUID, bgg_id_param INTEGER, title_param TEXT, image_url_param TEXT, min_players_param INTEGER, max_players_param INTEGER, playing_time_param INTEGER, description_param TEXT, condition_param TEXT, status_param TEXT, notes_param TEXT)
-- 5. get_club_games(club_id_param UUID)
-- 6. update_club_game(game_id_param UUID, title_param TEXT, image_url_param TEXT, min_players_param INTEGER, max_players_param INTEGER, playing_time_param INTEGER, description_param TEXT, condition_param TEXT, status_param TEXT, notes_param TEXT)
-- 7. delete_club_game(game_id_param UUID)

-- 1. create_club
DROP FUNCTION IF EXISTS board_game_clubs.create_club(TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS board_game_clubs.create_club(TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION board_game_clubs.create_club(
  name_param TEXT,
  description_param TEXT,
  logo_url_param TEXT,
  owner_id_param TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  logo_url TEXT,
  owner_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_uuid UUID;
BEGIN
  v_owner_uuid := public.get_internal_user_id(owner_id_param);
  
  RETURN QUERY
  INSERT INTO board_game_clubs.clubs (name, description, logo_url, owner_id)
  VALUES (name_param, description_param, logo_url_param, v_owner_uuid)
  RETURNING board_game_clubs.clubs.id, board_game_clubs.clubs.name, board_game_clubs.clubs.description, board_game_clubs.clubs.logo_url, board_game_clubs.clubs.owner_id, board_game_clubs.clubs.created_at;
END;
$$;

-- 2. get_user_clubs
DROP FUNCTION IF EXISTS board_game_clubs.get_user_clubs(UUID);
DROP FUNCTION IF EXISTS board_game_clubs.get_user_clubs(TEXT);
CREATE OR REPLACE FUNCTION board_game_clubs.get_user_clubs(owner_id_param TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  logo_url TEXT,
  owner_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_uuid UUID;
BEGIN
  v_owner_uuid := public.get_internal_user_id(owner_id_param);

  RETURN QUERY
  SELECT c.id, c.name, c.description, c.logo_url, c.owner_id, c.created_at
  FROM board_game_clubs.clubs c
  WHERE c.owner_id = v_owner_uuid
  ORDER BY c.name ASC;
END;
$$;

-- 3. get_club_details
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
SECURITY DEFINER
AS $$
  SELECT id, name, description, logo_url, owner_id, created_at
  FROM board_game_clubs.clubs
  WHERE id = club_id_param;
$$;

-- 4. add_club_game
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
SECURITY DEFINER
AS $$
  INSERT INTO board_game_clubs.games (
    club_id, bgg_id, title, image_url, min_players, max_players, playing_time, description, condition, status, notes
  )
  VALUES (
    club_id_param, bgg_id_param, title_param, image_url_param, min_players_param, max_players_param, playing_time_param, description_param, condition_param, status_param, notes_param
  )
  RETURNING id, club_id, bgg_id, title, image_url, min_players, max_players, playing_time, description, condition, status, notes, created_at;
$$;

-- 5. get_club_games
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
SECURITY DEFINER
AS $$
  SELECT 
    id, club_id, bgg_id, title, image_url, min_players, max_players, playing_time, description, condition, status, notes, created_at
  FROM board_game_clubs.games
  WHERE club_id = club_id_param
  ORDER BY title ASC;
$$;

-- 6. update_club_game
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
SECURITY DEFINER
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

-- 7. delete_club_game
DROP FUNCTION IF EXISTS board_game_clubs.delete_club_game(UUID);
CREATE OR REPLACE FUNCTION board_game_clubs.delete_club_game(game_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
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
