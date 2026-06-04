-- 1. Create suggest schema
CREATE SCHEMA IF NOT EXISTS suggest;

-- 2. Create suggestions table
CREATE TABLE IF NOT EXISTS suggest.suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    sender_clerk_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('movie', 'tv', 'game', 'place')),
    title TEXT NOT NULL,
    short_note TEXT,
    rating DECIMAL CHECK (rating >= 0 AND rating <= 5),
    external_link TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create recipients table
CREATE TABLE IF NOT EXISTS suggest.recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id UUID REFERENCES suggest.suggestions(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_clerk_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'saved', 'completed', 'ignored')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(suggestion_id, recipient_clerk_id)
);

-- 4. Create indices
CREATE INDEX IF NOT EXISTS idx_suggest_suggestions_sender ON suggest.suggestions(sender_clerk_id);
CREATE INDEX IF NOT EXISTS idx_suggest_recipients_recipient ON suggest.recipients(recipient_clerk_id);
CREATE INDEX IF NOT EXISTS idx_suggest_recipients_suggestion ON suggest.recipients(suggestion_id);

-- 5. Grant Permissions
GRANT USAGE ON SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA suggest TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;


-- 6. RPC: create_suggestion
DROP FUNCTION IF EXISTS suggest.create_suggestion(TEXT, TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT[]);

CREATE OR REPLACE FUNCTION suggest.create_suggestion(
    sender_clerk_id_param TEXT,
    category_param TEXT,
    title_param TEXT,
    short_note_param TEXT,
    rating_param DECIMAL,
    external_link_param TEXT,
    image_url_param TEXT,
    recipient_clerk_ids TEXT[]
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
    SELECT id INTO v_sender_id FROM public.users WHERE clerk_id = sender_clerk_id_param;
    IF v_sender_id IS NULL THEN
        RAISE EXCEPTION 'Sender user not found for clerk_id %', sender_clerk_id_param;
    END IF;

    INSERT INTO suggest.suggestions (
        sender_id, sender_clerk_id, category, title, short_note, rating, external_link, image_url
    ) VALUES (
        v_sender_id, sender_clerk_id_param, category_param, title_param, short_note_param, rating_param, external_link_param, image_url_param
    ) RETURNING id INTO v_suggestion_id;

    FOREACH v_recipient_clerk IN ARRAY recipient_clerk_ids
    LOOP
        SELECT id INTO v_recipient_id FROM public.users WHERE clerk_id = v_recipient_clerk;
        
        IF v_recipient_id IS NOT NULL THEN
            INSERT INTO suggest.recipients (
                suggestion_id, recipient_id, recipient_clerk_id, status
            ) VALUES (
                v_suggestion_id, v_recipient_id, v_recipient_clerk, 'pending'
            ) ON CONFLICT (suggestion_id, recipient_clerk_id) DO NOTHING;
            
            v_recipient_count := v_recipient_count + 1;
        END IF;
    END LOOP;

    v_result := jsonb_build_object(
        'suggestion_id', v_suggestion_id,
        'recipients_added', v_recipient_count
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. RPC: get_inbox_suggestions
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


-- 8. RPC: get_sent_suggestions
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


-- 9. RPC: update_recipient_status
DROP FUNCTION IF EXISTS suggest.update_recipient_status(TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION suggest.update_recipient_status(
    recipient_clerk_id_param TEXT,
    suggestion_id_param UUID,
    status_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated INT;
BEGIN
    UPDATE suggest.recipients
    SET status = status_param,
        updated_at = NOW()
    WHERE recipient_clerk_id = recipient_clerk_id_param
      AND suggestion_id = suggestion_id_param;
      
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 10. RPC: get_suggestion_detail
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
        s.created_at,
        s.sender_clerk_id,
        u_send.username AS sender_username,
        u_send.avatar_url AS sender_avatar,
        r.status AS recipient_status
    FROM suggest.suggestions s
    LEFT JOIN public.users u_send ON s.sender_id = u_send.id
    LEFT JOIN suggest.recipients r ON s.id = r.suggestion_id AND r.recipient_clerk_id = clerk_id_param
    WHERE s.id = suggestion_id_param 
      AND (s.sender_clerk_id = clerk_id_param OR r.recipient_clerk_id = clerk_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
