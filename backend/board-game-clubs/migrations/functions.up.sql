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
DROP FUNCTION IF EXISTS board_game_clubs.create_club(TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION board_game_clubs.create_club(
  name_param TEXT,
  description_param TEXT,
  logo_url_param TEXT,
  owner_id_param TEXT,
  business_id_param TEXT DEFAULT NULL
)
RETURNS board_game_clubs.clubs AS $$
DECLARE
  v_owner_uuid UUID;
  v_result board_game_clubs.clubs;
BEGIN
  v_owner_uuid := public.get_internal_user_id(owner_id_param);
  
  IF v_owner_uuid IS NULL THEN
    RAISE EXCEPTION 'User not found for clerk_id: %', owner_id_param;
  END IF;
  
  INSERT INTO board_game_clubs.clubs (name, description, logo_url, owner_id, business_id)
  VALUES (name_param, description_param, logo_url_param, v_owner_uuid, business_id_param)
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. get_user_clubs
DROP FUNCTION IF EXISTS board_game_clubs.get_user_clubs(UUID);
DROP FUNCTION IF EXISTS board_game_clubs.get_user_clubs(TEXT);
CREATE OR REPLACE FUNCTION board_game_clubs.get_user_clubs(owner_id_param TEXT)
RETURNS SETOF board_game_clubs.clubs AS $$
DECLARE
  v_owner_uuid UUID;
BEGIN
  v_owner_uuid := public.get_internal_user_id(owner_id_param);

  RETURN QUERY
  SELECT *
  FROM board_game_clubs.clubs c
  WHERE c.owner_id = v_owner_uuid
  ORDER BY c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. get_club_details
DROP FUNCTION IF EXISTS board_game_clubs.get_club_details(UUID);
CREATE OR REPLACE FUNCTION board_game_clubs.get_club_details(club_id_param UUID)
RETURNS board_game_clubs.clubs AS $$
DECLARE
  v_result board_game_clubs.clubs;
BEGIN
  SELECT * INTO v_result
  FROM board_game_clubs.clubs
  WHERE id = club_id_param;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

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
RETURNS board_game_clubs.games AS $$
DECLARE
  v_result board_game_clubs.games;
BEGIN
  INSERT INTO board_game_clubs.games (
    club_id, bgg_id, title, image_url, min_players, max_players, playing_time, description, condition, status, notes
  )
  VALUES (
    club_id_param, bgg_id_param, title_param, image_url_param, min_players_param, max_players_param, playing_time_param, description_param, condition_param, status_param, notes_param
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. get_club_games
DROP FUNCTION IF EXISTS board_game_clubs.get_club_games(UUID);
CREATE OR REPLACE FUNCTION board_game_clubs.get_club_games(club_id_param UUID)
RETURNS SETOF board_game_clubs.games AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM board_game_clubs.games
  WHERE club_id = club_id_param
  ORDER BY title ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

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
RETURNS board_game_clubs.games AS $$
DECLARE
  v_result board_game_clubs.games;
BEGIN
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
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
