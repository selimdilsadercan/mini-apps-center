DROP FUNCTION IF EXISTS assistant.upsert_conversation(TEXT, TEXT, TEXT, JSONB, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION assistant.upsert_conversation(
    clerk_id_param TEXT,
    conversation_id_param TEXT,
    title_param TEXT,
    messages_param JSONB,
    created_at_param TIMESTAMPTZ DEFAULT NULL
)
RETURNS assistant.conversations AS $$
DECLARE
    result assistant.conversations;
BEGIN
    INSERT INTO assistant.conversations (
        id,
        user_clerk_id,
        title,
        messages,
        created_at,
        updated_at
    )
    VALUES (
        conversation_id_param,
        clerk_id_param,
        title_param,
        messages_param,
        COALESCE(created_at_param, NOW()),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        messages = EXCLUDED.messages,
        updated_at = NOW()
    WHERE assistant.conversations.user_clerk_id = clerk_id_param
    RETURNING * INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
