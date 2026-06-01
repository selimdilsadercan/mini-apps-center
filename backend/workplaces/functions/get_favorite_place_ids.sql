-- DO NOT run this file alone. Run ../setup_favorites.sql instead.

DROP FUNCTION IF EXISTS workplaces.get_favorite_place_ids(TEXT);

CREATE OR REPLACE FUNCTION workplaces.get_favorite_place_ids(p_clerk_id TEXT)
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = workplaces, public
AS $$
BEGIN
    RETURN QUERY
    SELECT f.place_id
    FROM workplaces.favorites f
    WHERE f.clerk_id = p_clerk_id;
END;
$$;
