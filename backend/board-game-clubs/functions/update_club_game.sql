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
