DROP FUNCTION IF EXISTS workplaces.delete_place(UUID);

CREATE OR REPLACE FUNCTION workplaces.delete_place(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM workplaces.places WHERE id = p_id;
    RETURN FOUND;
END;
$$;
