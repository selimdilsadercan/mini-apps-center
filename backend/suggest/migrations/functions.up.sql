-- FUNCTIONS
-- 1. suggest.create_suggestion
-- 2. suggest.get_inbox_suggestions
-- 3. suggest.get_sent_suggestions
-- 4. suggest.update_recipient_status
-- 5. suggest.get_suggestion_detail
-- 6. suggest.mark_suggestion_opened
-- 7. suggest.update_suggestion_reaction
-- 8. suggest.delete_sent_suggestion

-- 1. Create Suggestion
DROP FUNCTION IF EXISTS suggest.create_suggestion(TEXT, TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS suggest.create_suggestion(TEXT, TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT[], TIMESTAMP WITH TIME ZONE, BOOLEAN, TEXT);
CREATE OR REPLACE FUNCTION suggest.create_suggestion(
    p_user_id TEXT,
    category_param TEXT,
    title_param TEXT,
    short_note_param TEXT,
    rating_param DECIMAL,
    external_link_param TEXT,
    image_url_param TEXT,
    recipient_clerk_ids TEXT[],
    expires_at_param TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_daily_pick_param BOOLEAN DEFAULT FALSE,
    preview_url_param TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_sender_id UUID := public.get_internal_user_id(p_user_id);
    v_suggestion_id UUID;
    v_share_id TEXT;
    v_recipient_clerk TEXT;
    v_recipient_id UUID;
    v_recipient_count INT := 0;
    v_result JSONB;
BEGIN
    IF v_sender_id IS NULL THEN
        RAISE EXCEPTION 'Sender user not found for p_user_id %', p_user_id;
    END IF;

    INSERT INTO suggest.suggestions (
        sender_id, category, title, short_note, rating, external_link, image_url, expires_at, is_daily_pick, preview_url
    ) VALUES (
        v_sender_id, category_param, title_param, short_note_param, rating_param, external_link_param, image_url_param, expires_at_param, is_daily_pick_param, preview_url_param
    ) RETURNING id, share_id INTO v_suggestion_id, v_share_id;

    IF recipient_clerk_ids IS NOT NULL THEN
        FOREACH v_recipient_clerk IN ARRAY recipient_clerk_ids
        LOOP
            v_recipient_id := public.get_internal_user_id(v_recipient_clerk);
            
            IF v_recipient_id IS NOT NULL THEN
                INSERT INTO suggest.recipients (
                    suggestion_id, recipient_id, status
                ) VALUES (
                    v_suggestion_id, v_recipient_id, 'pending'
                ) ON CONFLICT (suggestion_id, recipient_id) DO NOTHING;
                
                v_recipient_count := v_recipient_count + 1;
            END IF;
        END LOOP;
    END IF;

    v_result := jsonb_build_object(
        'suggestion_id', v_suggestion_id,
        'share_id', v_share_id,
        'recipients_added', v_recipient_count
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Inbox Suggestions
DROP FUNCTION IF EXISTS suggest.get_inbox_suggestions(TEXT);
CREATE OR REPLACE FUNCTION suggest.get_inbox_suggestions(
    p_user_id TEXT
)
RETURNS TABLE (
    id UUID,
    suggestion_id UUID,
    share_id TEXT,
    category TEXT,
    title TEXT,
    short_note TEXT,
    rating DECIMAL,
    external_link TEXT,
    image_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    reaction TEXT,
    is_daily_pick BOOLEAN,
    preview_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    sender_id UUID,
    sender_username TEXT,
    sender_avatar TEXT,
    status TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        s.id AS suggestion_id,
        s.share_id,
        s.category,
        s.title,
        s.short_note,
        s.rating,
        s.external_link,
        s.image_url,
        s.expires_at,
        s.opened_at,
        s.reaction,
        s.is_daily_pick,
        s.preview_url,
        s.created_at,
        s.sender_id,
        u.username AS sender_username,
        u.avatar_url AS sender_avatar,
        r.status,
        r.updated_at
    FROM suggest.recipients r
    JOIN suggest.suggestions s ON r.suggestion_id = s.id
    LEFT JOIN public.users u ON s.sender_id = u.id
    WHERE r.recipient_id = v_user_id
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Get Sent Suggestions
DROP FUNCTION IF EXISTS suggest.get_sent_suggestions(TEXT);
CREATE OR REPLACE FUNCTION suggest.get_sent_suggestions(
    p_user_id TEXT
)
RETURNS TABLE (
    id UUID,
    share_id TEXT,
    category TEXT,
    title TEXT,
    short_note TEXT,
    rating DECIMAL,
    external_link TEXT,
    image_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    reaction TEXT,
    is_daily_pick BOOLEAN,
    preview_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    recipients JSONB
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.share_id,
        s.category,
        s.title,
        s.short_note,
        s.rating,
        s.external_link,
        s.image_url,
        s.expires_at,
        s.opened_at,
        s.reaction,
        s.is_daily_pick,
        s.preview_url,
        s.created_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'recipient_id', r.recipient_id,
                    'recipient_username', u.username,
                    'recipient_avatar', u.avatar_url,
                    'status', r.status,
                    'updated_at', r.updated_at
                )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'::jsonb
        ) AS recipients
    FROM suggest.suggestions s
    LEFT JOIN suggest.recipients r ON s.id = r.suggestion_id
    LEFT JOIN public.users u ON r.recipient_id = u.id
    WHERE s.sender_id = v_user_id AND s.sender_deleted_at IS NULL
    GROUP BY s.id
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Update Recipient Status
DROP FUNCTION IF EXISTS suggest.update_recipient_status(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS suggest.update_recipient_status(TEXT, UUID, TEXT);
CREATE OR REPLACE FUNCTION suggest.update_recipient_status(
    p_user_id TEXT,
    share_id_param TEXT,
    status_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_suggestion_id UUID;
    v_updated INT;
BEGIN
    SELECT id INTO v_suggestion_id FROM suggest.suggestions WHERE share_id = share_id_param;
    IF v_suggestion_id IS NULL THEN
        RETURN FALSE;
    END IF;

    UPDATE suggest.recipients
    SET status = status_param,
        updated_at = NOW()
    WHERE recipient_id = v_user_id
      AND suggestion_id = v_suggestion_id;
      
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Get Suggestion Detail
DROP FUNCTION IF EXISTS suggest.get_suggestion_detail(TEXT, TEXT);
CREATE OR REPLACE FUNCTION suggest.get_suggestion_detail(
    p_user_id TEXT,
    share_id_param TEXT
)
RETURNS TABLE (
    id UUID,
    share_id TEXT,
    category TEXT,
    title TEXT,
    short_note TEXT,
    rating DECIMAL,
    external_link TEXT,
    image_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    reaction TEXT,
    is_daily_pick BOOLEAN,
    preview_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    sender_id UUID,
    sender_username TEXT,
    sender_avatar TEXT,
    recipient_status TEXT
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.share_id,
        s.category,
        s.title,
        s.short_note,
        s.rating,
        s.external_link,
        s.image_url,
        s.expires_at,
        s.opened_at,
        s.reaction,
        s.is_daily_pick,
        s.preview_url,
        s.created_at,
        s.sender_id,
        u_send.username AS sender_username,
        u_send.avatar_url AS sender_avatar,
        r.status AS recipient_status
    FROM suggest.suggestions s
    LEFT JOIN public.users u_send ON s.sender_id = u_send.id
    LEFT JOIN suggest.recipients r ON s.id = r.suggestion_id AND r.recipient_id = v_user_id
    WHERE s.share_id = share_id_param 
      AND (s.sender_id = v_user_id OR r.recipient_id = v_user_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 6. Mark Suggestion Opened
DROP FUNCTION IF EXISTS suggest.mark_suggestion_opened(TEXT);
CREATE OR REPLACE FUNCTION suggest.mark_suggestion_opened(
    share_id_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE suggest.suggestions
    SET opened_at = NOW()
    WHERE share_id = share_id_param AND opened_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update Suggestion Reaction
DROP FUNCTION IF EXISTS suggest.update_suggestion_reaction(TEXT, TEXT);
CREATE OR REPLACE FUNCTION suggest.update_suggestion_reaction(
    share_id_param TEXT,
    reaction_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE suggest.suggestions
    SET reaction = reaction_param
    WHERE share_id = share_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Delete Sent Suggestion
DROP FUNCTION IF EXISTS suggest.delete_sent_suggestion(TEXT, TEXT);
CREATE OR REPLACE FUNCTION suggest.delete_sent_suggestion(
    p_user_id TEXT,
    share_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    UPDATE suggest.suggestions
    SET sender_deleted_at = NOW()
    WHERE sender_id = v_user_id AND share_id = share_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA suggest TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
