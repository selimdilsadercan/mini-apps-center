-- Requires workplaces.favorites table first.
-- Run migrations/04_place_favorites.up.sql or ../setup_favorites.sql before this file.

DROP FUNCTION IF EXISTS workplaces.toggle_favorite(UUID, TEXT);

CREATE OR REPLACE FUNCTION workplaces.toggle_favorite(
    p_place_id UUID,
    p_clerk_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = workplaces, public
AS $$
DECLARE
    exists_val BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM workplaces.favorites
        WHERE place_id = p_place_id AND clerk_id = p_clerk_id
    ) INTO exists_val;

    IF exists_val THEN
        DELETE FROM workplaces.favorites
        WHERE place_id = p_place_id AND clerk_id = p_clerk_id;
        RETURN FALSE;
    ELSE
        INSERT INTO workplaces.favorites (place_id, clerk_id)
        VALUES (p_place_id, p_clerk_id);
        RETURN TRUE;
    END IF;
END;
$$;
