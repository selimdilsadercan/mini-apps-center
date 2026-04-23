-- Drop old function
DROP FUNCTION IF EXISTS public.kiler_get_items(TEXT);

-- RPC: Tüm ürünleri getir
CREATE OR REPLACE FUNCTION kiler.get_items(clerk_id_param TEXT)
RETURNS SETOF kiler.items AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM kiler.items
    WHERE clerk_id = clerk_id_param
    ORDER BY expiry_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
