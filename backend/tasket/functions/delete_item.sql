DROP FUNCTION IF EXISTS tasket.delete_item;

CREATE OR REPLACE FUNCTION tasket.delete_item(id_param UUID, clerk_id_param TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tasket.items
    WHERE id = id_param AND clerk_id = clerk_id_param;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$;
