-- Assistant RPC Functions
-- 1. get_conversations(clerk_id_param TEXT)
-- 2. upsert_conversation(clerk_id_param TEXT, conversation_id_param TEXT, title_param TEXT, messages_param JSONB, created_at_param TIMESTAMPTZ)
-- 3. delete_conversation(clerk_id_param TEXT, conversation_id_param TEXT)

-- 1. get_conversations
DROP FUNCTION IF EXISTS assistant.get_conversations(TEXT);
CREATE OR REPLACE FUNCTION assistant.get_conversations(clerk_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    user_id UUID,
    title TEXT,
    messages JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT 
        conv.id,
        conv.user_id,
        conv.title,
        conv.messages,
        conv.created_at,
        conv.updated_at
    FROM assistant.conversations AS conv
    WHERE conv.user_id = v_user_id
    ORDER BY conv.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. upsert_conversation
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
    v_user_id UUID;
    result assistant.conversations;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO assistant.conversations (
        id,
        user_id,
        title,
        messages,
        created_at,
        updated_at
    )
    VALUES (
        conversation_id_param,
        v_user_id,
        title_param,
        messages_param,
        COALESCE(created_at_param, NOW()),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        messages = EXCLUDED.messages,
        updated_at = NOW()
    WHERE assistant.conversations.user_id = v_user_id
    RETURNING * INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. delete_conversation
DROP FUNCTION IF EXISTS assistant.delete_conversation(TEXT, TEXT);
CREATE OR REPLACE FUNCTION assistant.delete_conversation(
    clerk_id_param TEXT,
    conversation_id_param TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_user_id UUID;
    deleted_count INTEGER;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    DELETE FROM assistant.conversations AS conv
    WHERE conv.id = conversation_id_param
      AND conv.user_id = v_user_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
