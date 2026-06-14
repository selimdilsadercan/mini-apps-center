DROP FUNCTION IF EXISTS birikim.get_accounts(TEXT);
CREATE OR REPLACE FUNCTION birikim.get_accounts(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    name TEXT,
    type TEXT,
    balance NUMERIC,
    currency TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        a.name,
        a.type,
        a.balance,
        a.currency,
        a.created_at
    FROM birikim.accounts a
    WHERE a.user_id = p_user_id
    ORDER BY a.created_at DESC;
END;
$$;
