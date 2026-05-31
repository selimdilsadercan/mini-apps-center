DROP FUNCTION IF EXISTS ai_assistant.delete_conversation(TEXT, TEXT);

CREATE OR REPLACE FUNCTION ai_assistant.delete_conversation(
    clerk_id_param TEXT,
    conversation_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_assistant.conversations
    WHERE id = conversation_id_param
      AND user_clerk_id = clerk_id_param;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
