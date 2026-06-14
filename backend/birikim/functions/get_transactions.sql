DROP FUNCTION IF EXISTS birikim.get_transactions(TEXT, INTEGER);
CREATE OR REPLACE FUNCTION birikim.get_transactions(
    p_user_id TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    account_id UUID,
    account_name TEXT,
    target_id UUID,
    target_title TEXT,
    amount NUMERIC,
    type TEXT,
    description TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tx.id,
        tx.user_id,
        tx.account_id,
        a.name as account_name,
        tx.target_id,
        t.title as target_title,
        tx.amount,
        tx.type,
        tx.description,
        tx.created_at
    FROM birikim.transactions tx
    LEFT JOIN birikim.accounts a ON tx.account_id = a.id
    LEFT JOIN birikim.targets t ON tx.target_id = t.id
    WHERE tx.user_id = p_user_id
    ORDER BY tx.created_at DESC
    LIMIT p_limit;
END;
$$;
