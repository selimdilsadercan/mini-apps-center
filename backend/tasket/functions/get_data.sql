DROP FUNCTION IF EXISTS tasket.get_data;

CREATE OR REPLACE FUNCTION tasket.get_data(clerk_id_param TEXT)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
    lists_data JSONB;
    items_data JSONB;
BEGIN
    SELECT jsonb_agg(l.*) INTO lists_data FROM tasket.lists l WHERE l.clerk_id = clerk_id_param;
    SELECT jsonb_agg(i.*) INTO items_data FROM tasket.items i WHERE i.clerk_id = clerk_id_param;
    
    RETURN jsonb_build_object(
        'lists', COALESCE(lists_data, '[]'::jsonb),
        'items', COALESCE(items_data, '[]'::jsonb)
    );
END;
$$;
