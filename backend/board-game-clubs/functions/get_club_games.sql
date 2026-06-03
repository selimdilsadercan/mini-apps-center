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
