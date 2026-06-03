DROP FUNCTION IF EXISTS workplaces.approve_place(UUID);

CREATE OR REPLACE FUNCTION workplaces.approve_place(p_id UUID)
RETURNS SETOF workplaces.places
LANGUAGE sql
SECURITY DEFINER
AS $$
    UPDATE workplaces.places
    SET approved = TRUE, updated_at = NOW()
    WHERE id = p_id
    RETURNING *;
$$;
