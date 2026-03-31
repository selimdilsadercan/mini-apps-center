DROP FUNCTION IF EXISTS subcenter_delete_item;

CREATE FUNCTION subcenter_delete_item(
  item_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM subcenter_items
  WHERE id = item_id_param
    AND user_id = user_id_param;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count > 0;
END;
$$;
