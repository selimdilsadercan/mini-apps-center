-- Drop old function
DROP FUNCTION IF EXISTS public.subcenter_delete_item(UUID, TEXT);

-- Create new function
CREATE OR REPLACE FUNCTION subcenter.delete_item(
  item_id_param UUID,
  clerk_id_param TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM subcenter.items
  WHERE id = item_id_param
    AND user_id = clerk_id_param;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count > 0;
END;
$$;
