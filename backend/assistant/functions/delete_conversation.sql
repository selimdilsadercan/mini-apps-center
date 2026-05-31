DROP FUNCTION IF EXISTS assistant.delete_conversation(TEXT, TEXT);

CREATE OR REPLACE FUNCTION assistant.delete_conversation(
    clerk_id_param TEXT,
    conversation_id_param TEXT
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM assistant.conversations
    WHERE id = conversation_id_param
      AND user_clerk_id = clerk_id_param;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assistant.delete_conversation(TEXT, TEXT)
    TO anon, authenticated, service_role;
