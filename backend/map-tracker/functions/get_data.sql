DROP FUNCTION IF EXISTS map_tracker.get_data();

CREATE OR REPLACE FUNCTION map_tracker.get_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'lists', (SELECT jsonb_agg(l.*) FROM map_tracker.lists l),
        'items', (SELECT jsonb_agg(i.*) FROM map_tracker.items i)
    ) INTO result;
    
    RETURN COALESCE(result, '{"lists": [], "items": []}'::jsonb);
END;
$$;
