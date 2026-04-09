-- RPC: Ürün ekle
CREATE OR REPLACE FUNCTION public.kiler_add_item(
    clerk_id_param TEXT,
    name_param TEXT,
    amount_param DECIMAL,
    unit_param TEXT,
    storage_type_param TEXT,
    purchase_date_param TIMESTAMP WITH TIME ZONE,
    expiry_date_param TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS SETOF public.kiler_items AS $$
DECLARE
    v_user_id UUID;
    v_new_item public.kiler_items;
BEGIN
    -- user_id'yi clerk_id'den bul
    SELECT id INTO v_user_id FROM public.users WHERE clerk_id = clerk_id_param;
    
    INSERT INTO public.kiler_items (
        user_id, clerk_id, name, amount, unit, storage_type, purchase_date, expiry_date
    ) VALUES (
        v_user_id, clerk_id_param, name_param, amount_param, unit_param, storage_type_param, purchase_date_param, expiry_date_param
    ) RETURNING * INTO v_new_item;
    
    RETURN NEXT v_new_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
