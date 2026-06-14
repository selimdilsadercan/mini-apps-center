DROP FUNCTION IF EXISTS birikim.get_targets(TEXT);
CREATE OR REPLACE FUNCTION birikim.get_targets(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    title TEXT,
    target_amount NUMERIC,
    current_amount NUMERIC,
    currency TEXT,
    target_date DATE,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.user_id,
        t.title,
        t.target_amount,
        t.current_amount,
        t.currency,
        t.target_date,
        t.created_at
    FROM birikim.targets t
    WHERE t.user_id = p_user_id
    ORDER BY t.created_at DESC;
END;
$$;
