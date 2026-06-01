DROP FUNCTION IF EXISTS workplaces.get_place(UUID);

CREATE OR REPLACE FUNCTION workplaces.get_place(p_id UUID)
RETURNS SETOF workplaces.places
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM workplaces.places WHERE id = p_id LIMIT 1;
$$;
