-- 8_short_id.up.sql
-- Adds a short YouTube-style share_id to suggestions for cleaner URLs

-- 1. Generate base62 ID helper function (public schema so it's accessible)
CREATE OR REPLACE FUNCTION suggest.generate_short_id(length INT DEFAULT 11)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INT;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * 62 + 1)::INT, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 2. Add share_id column (nullable first so existing rows won't fail)
ALTER TABLE suggest.suggestions
    ADD COLUMN IF NOT EXISTS share_id TEXT;

-- 3. Fill existing rows with generated short IDs
UPDATE suggest.suggestions
    SET share_id = suggest.generate_short_id(11)
    WHERE share_id IS NULL;

-- 4. Make it NOT NULL and UNIQUE now that all rows have values
ALTER TABLE suggest.suggestions
    ALTER COLUMN share_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'suggestions_share_id_unique'
    ) THEN
        ALTER TABLE suggest.suggestions
            ADD CONSTRAINT suggestions_share_id_unique UNIQUE (share_id);
    END IF;
END $$;

-- 5. Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_suggest_suggestions_share_id ON suggest.suggestions(share_id);

-- 6. Grant permissions
GRANT USAGE ON SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA suggest TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 7. Update SQL Functions to support share_id

-- 7.1 create_suggestion.sql
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
    v_share_id TEXT;
    v_recipient_clerk TEXT;
    v_recipient_id UUID;
    v_recipient_count INT := 0;
    v_result JSONB;
BEGIN
    SELECT id INTO v_sender_id FROM public.users WHERE clerk_id = sender_clerk_id_param;
    IF v_sender_id IS NULL THEN
        RAISE EXCEPTION 'Sender user not found for clerk_id %', sender_clerk_id_param;
    END IF;

    LOOP
        v_share_id := suggest.generate_short_id(11);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM suggest.suggestions WHERE share_id = v_share_id);
    END LOOP;

    INSERT INTO suggest.suggestions (
        sender_id, sender_clerk_id, category, title, short_note, rating, external_link, image_url, expires_at, is_daily_pick, preview_url, share_id
    ) VALUES (
        v_sender_id, sender_clerk_id_param, category_param, title_param, short_note_param, rating_param, external_link_param, image_url_param, expires_at_param, is_daily_pick_param, preview_url_param, v_share_id
    ) RETURNING id INTO v_suggestion_id;

    IF recipient_clerk_ids IS NOT NULL THEN
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
    END IF;

    v_result := jsonb_build_object(
        'suggestion_id', v_suggestion_id,
        'share_id', v_share_id,
        'recipients_added', v_recipient_count
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7.2 get_sent_suggestions.sql
DROP FUNCTION IF EXISTS suggest.get_sent_suggestions(TEXT);

CREATE OR REPLACE FUNCTION suggest.get_sent_suggestions(
    clerk_id_param TEXT
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


-- 7.3 get_inbox_suggestions.sql
DROP FUNCTION IF EXISTS suggest.get_inbox_suggestions(TEXT);

CREATE OR REPLACE FUNCTION suggest.get_inbox_suggestions(
    clerk_id_param TEXT
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


-- 7.4 get_suggestion_detail.sql
DROP FUNCTION IF EXISTS suggest.get_suggestion_detail(TEXT, UUID);

CREATE OR REPLACE FUNCTION suggest.get_suggestion_detail(
    clerk_id_param TEXT,
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
    sender_clerk_id TEXT,
    sender_username TEXT,
    sender_avatar TEXT,
    recipient_status TEXT
) AS $$
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
        s.sender_clerk_id,
        u_send.username AS sender_username,
        u_send.avatar_url AS sender_avatar,
        r.status AS recipient_status
    FROM suggest.suggestions s
    LEFT JOIN public.users u_send ON s.sender_id = u_send.id
    LEFT JOIN suggest.recipients r ON s.id = r.suggestion_id AND r.recipient_clerk_id = clerk_id_param
    WHERE s.share_id = share_id_param 
      AND (s.sender_clerk_id = clerk_id_param OR r.recipient_clerk_id = clerk_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7.5 mark_suggestion_opened.sql
DROP FUNCTION IF EXISTS suggest.mark_suggestion_opened(TEXT);
DROP FUNCTION IF EXISTS suggest.mark_suggestion_opened(UUID);

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


-- 7.6 update_suggestion_reaction.sql
DROP FUNCTION IF EXISTS suggest.update_suggestion_reaction(TEXT, TEXT);
DROP FUNCTION IF EXISTS suggest.update_suggestion_reaction(UUID, TEXT);

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


-- 7.7 update_recipient_status.sql
DROP FUNCTION IF EXISTS suggest.update_recipient_status(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS suggest.update_recipient_status(TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION suggest.update_recipient_status(
    recipient_clerk_id_param TEXT,
    share_id_param TEXT,
    status_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
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
    WHERE recipient_clerk_id = recipient_clerk_id_param
      AND suggestion_id = v_suggestion_id;
      
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
