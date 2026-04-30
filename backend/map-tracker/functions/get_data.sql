DROP FUNCTION IF EXISTS map_tracker.get_data();

CREATE OR REPLACE FUNCTION map_tracker.get_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = map_tracker, public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'lists', COALESCE((SELECT jsonb_agg(l.* ORDER BY l.created_at DESC) FROM map_tracker.lists l), '[]'::jsonb),
        'items', COALESCE((SELECT jsonb_agg(i.* ORDER BY i.created_at DESC) FROM map_tracker.items i), '[]'::jsonb)
    ) INTO result;
    
    RETURN result;
END;
$$;
