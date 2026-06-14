DROP FUNCTION IF EXISTS birikim.upsert_target(UUID, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, DATE);
CREATE OR REPLACE FUNCTION birikim.upsert_target(
    p_id UUID,
    p_user_id TEXT,
    p_title TEXT,
    p_target_amount NUMERIC,
    p_current_amount NUMERIC,
    p_currency TEXT,
    p_target_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id IS NULL THEN
        INSERT INTO birikim.targets (user_id, title, target_amount, current_amount, currency, target_date)
        VALUES (p_user_id, p_title, p_target_amount, p_current_amount, p_currency, p_target_date)
        RETURNING id INTO v_id;
    ELSE
        UPDATE birikim.targets
        SET title = p_title,
            target_amount = p_target_amount,
            current_amount = p_current_amount,
            currency = p_currency,
            target_date = p_target_date
        WHERE id = p_id AND user_id = p_user_id
        RETURNING id INTO v_id;
    END IF;
    
    RETURN v_id;
END;
$$;
