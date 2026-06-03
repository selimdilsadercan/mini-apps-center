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
