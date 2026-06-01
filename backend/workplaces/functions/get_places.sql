DROP FUNCTION IF EXISTS workplaces.get_places();

CREATE OR REPLACE FUNCTION workplaces.get_places()
RETURNS SETOF workplaces.places
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM workplaces.places ORDER BY created_at DESC;
$$;
