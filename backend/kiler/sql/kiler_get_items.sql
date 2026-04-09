-- RPC: Tüm ürünleri getir
CREATE OR REPLACE FUNCTION public.kiler_get_items(clerk_id_param TEXT)
RETURNS SETOF public.kiler_items AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.kiler_items
    WHERE clerk_id = clerk_id_param
    ORDER BY expiry_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
