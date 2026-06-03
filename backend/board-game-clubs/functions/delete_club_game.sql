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
