DROP FUNCTION IF EXISTS tasket.delete_list;

CREATE OR REPLACE FUNCTION tasket.delete_list(id_param UUID, clerk_id_param TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Items will be handled by ON DELETE SET NULL or we can manually delete them if we want
    -- For now, let's keep it simple.
    DELETE FROM tasket.lists
    WHERE id = id_param AND clerk_id = clerk_id_param;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$;
