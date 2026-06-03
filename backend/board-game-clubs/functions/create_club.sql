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
