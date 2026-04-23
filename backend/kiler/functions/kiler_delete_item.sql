-- Drop old function
DROP FUNCTION IF EXISTS public.kiler_delete_item(UUID, TEXT);

-- RPC: Ürün sil
CREATE OR REPLACE FUNCTION kiler.delete_item(
    item_id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM kiler.items
    WHERE id = item_id_param AND clerk_id = clerk_id_param;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
