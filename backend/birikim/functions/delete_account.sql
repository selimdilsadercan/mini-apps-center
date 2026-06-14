DROP FUNCTION IF EXISTS birikim.delete_account(UUID, TEXT);
CREATE OR REPLACE FUNCTION birikim.delete_account(
    p_id UUID,
    p_user_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM birikim.accounts
    WHERE id = p_id AND user_id = p_user_id;
    RETURN FOUND;
END;
$$;
