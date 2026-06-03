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
