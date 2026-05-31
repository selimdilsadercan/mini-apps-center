DROP FUNCTION IF EXISTS ai_assistant.get_conversations(TEXT);

CREATE OR REPLACE FUNCTION ai_assistant.get_conversations(clerk_id_param TEXT)
RETURNS SETOF ai_assistant.conversations AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM ai_assistant.conversations
    WHERE user_clerk_id = clerk_id_param
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
