DROP FUNCTION IF EXISTS map_tracker.toggle_visited(UUID);

CREATE OR REPLACE FUNCTION map_tracker.toggle_visited(p_item_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE map_tracker.items
    SET is_visited = NOT is_visited
    WHERE id = p_item_id;
END;
$$;
