DROP FUNCTION IF EXISTS birikim.upsert_account(UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION birikim.upsert_account(
    p_id UUID,
    p_user_id TEXT,
    p_name TEXT,
    p_type TEXT,
    p_balance NUMERIC,
    p_currency TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id IS NULL THEN
        INSERT INTO birikim.accounts (user_id, name, type, balance, currency)
        VALUES (p_user_id, p_name, p_type, p_balance, p_currency)
        RETURNING id INTO v_id;
    ELSE
        UPDATE birikim.accounts
        SET name = p_name,
            type = p_type,
            balance = p_balance,
            currency = p_currency
        WHERE id = p_id AND user_id = p_user_id
        RETURNING id INTO v_id;
    END IF;
    
    RETURN v_id;
END;
$$;
