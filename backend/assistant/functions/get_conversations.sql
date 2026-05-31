DROP FUNCTION IF EXISTS assistant.get_conversations(TEXT);

CREATE OR REPLACE FUNCTION assistant.get_conversations(clerk_id_param TEXT)
RETURNS SETOF assistant.conversations AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM assistant.conversations
    WHERE user_clerk_id = clerk_id_param
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
