DROP FUNCTION IF EXISTS workplaces.get_pending_places();

CREATE OR REPLACE FUNCTION workplaces.get_pending_places()
RETURNS SETOF workplaces.places
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM workplaces.places WHERE approved = FALSE ORDER BY created_at DESC;
$$;
