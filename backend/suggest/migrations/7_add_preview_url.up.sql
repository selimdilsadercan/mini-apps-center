-- Alter suggest.suggestions table to add preview_url column
ALTER TABLE suggest.suggestions
ADD COLUMN IF NOT EXISTS preview_url TEXT;

-- Function: create_suggestion (Updated with preview_url support)
DROP FUNCTION IF EXISTS suggest.create_suggestion(TEXT, TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT[], TIMESTAMP WITH TIME ZONE, BOOLEAN);
DROP FUNCTION IF EXISTS suggest.create_suggestion(TEXT, TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT[], TIMESTAMP WITH TIME ZONE, BOOLEAN, TEXT);

CREATE OR REPLACE FUNCTION suggest.create_suggestion(
    sender_clerk_id_param TEXT,
    category_param TEXT,
    title_param TEXT,
    short_note_param TEXT,
    rating_param DECIMAL,
    external_link_param TEXT,
    image_url_param TEXT,
    recipient_clerk_ids TEXT[],
    expires_at_param TIMESTAMP WITH TIME ZONE,
    is_daily_pick_param BOOLEAN,
    preview_url_param TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_sender_id UUID;
    v_suggestion_id UUID;
    v_recipient_clerk TEXT;
    v_recipient_id UUID;
    v_recipient_count INT := 0;
    v_result JSONB;
BEGIN
    -- Find sender_id from public.users using clerk_id
    SELECT id INTO v_sender_id FROM public.users WHERE clerk_id = sender_clerk_id_param;
    IF v_sender_id IS NULL THEN
        RAISE EXCEPTION 'Sender user not found for clerk_id %', sender_clerk_id_param;
    END IF;

    -- Insert suggestion
    INSERT INTO suggest.suggestions (
        sender_id, sender_clerk_id, category, title, short_note, rating, external_link, image_url, expires_at, is_daily_pick, preview_url
    ) VALUES (
        v_sender_id, sender_clerk_id_param, category_param, title_param, short_note_param, rating_param, external_link_param, image_url_param, expires_at_param, is_daily_pick_param, preview_url_param
    ) RETURNING id INTO v_suggestion_id;

    -- Insert recipients
    IF recipient_clerk_ids IS NOT NULL THEN
        FOREACH v_recipient_clerk IN ARRAY recipient_clerk_ids
        LOOP
            -- Find recipient_id
            SELECT id INTO v_recipient_id FROM public.users WHERE clerk_id = v_recipient_clerk;
            
            -- Only insert if the recipient user exists in public.users
            IF v_recipient_id IS NOT NULL THEN
                INSERT INTO suggest.recipients (
                    suggestion_id, recipient_id, recipient_clerk_id, status
                ) VALUES (
                    v_suggestion_id, v_recipient_id, v_recipient_clerk, 'pending'
                ) ON CONFLICT (suggestion_id, recipient_clerk_id) DO NOTHING;
                
                v_recipient_count := v_recipient_count + 1;
            END IF;
        END LOOP;
    END IF;

    v_result := jsonb_build_object(
        'suggestion_id', v_suggestion_id,
        'recipients_added', v_recipient_count
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: get_inbox_suggestions (Updated with preview_url support)
DROP FUNCTION IF EXISTS suggest.get_inbox_suggestions(TEXT);

CREATE OR REPLACE FUNCTION suggest.get_inbox_suggestions(
    clerk_id_param TEXT
)
RETURNS TABLE (
    id UUID,
    suggestion_id UUID,
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
    sender_clerk_id TEXT,
    sender_username TEXT,
    sender_avatar TEXT,
    status TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        s.id AS suggestion_id,
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
        s.sender_clerk_id,
        u.username AS sender_username,
        u.avatar_url AS sender_avatar,
        r.status,
        r.updated_at
    FROM suggest.recipients r
    JOIN suggest.suggestions s ON r.suggestion_id = s.id
    LEFT JOIN public.users u ON s.sender_id = u.id
    WHERE r.recipient_clerk_id = clerk_id_param
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: get_sent_suggestions (Updated with preview_url support)
DROP FUNCTION IF EXISTS suggest.get_sent_suggestions(TEXT);

CREATE OR REPLACE FUNCTION suggest.get_sent_suggestions(
    clerk_id_param TEXT
)
RETURNS TABLE (
    id UUID,
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
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
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
                    'recipient_clerk_id', r.recipient_clerk_id,
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
    WHERE s.sender_clerk_id = clerk_id_param
    GROUP BY s.id
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: get_suggestion_detail (Updated with preview_url support)
DROP FUNCTION IF EXISTS suggest.get_suggestion_detail(TEXT, UUID);

CREATE OR REPLACE FUNCTION suggest.get_suggestion_detail(
    clerk_id_param TEXT,
    suggestion_id_param UUID
)
RETURNS TABLE (
    id UUID,
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
    sender_clerk_id TEXT,
    sender_username TEXT,
    sender_avatar TEXT,
    recipient_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
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
        s.sender_clerk_id,
        u_send.username AS sender_username,
        u_send.avatar_url AS sender_avatar,
        r.status AS recipient_status
    FROM suggest.suggestions s
    LEFT JOIN public.users u_send ON s.sender_id = u_send.id
    -- Left join recipient info to see if this user is a recipient and their status
    LEFT JOIN suggest.recipients r ON s.id = r.suggestion_id AND r.recipient_clerk_id = clerk_id_param
    WHERE s.id = suggestion_id_param 
      AND (s.sender_clerk_id = clerk_id_param OR r.recipient_clerk_id = clerk_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Re-grant permissions for schema
GRANT USAGE ON SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA suggest TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
