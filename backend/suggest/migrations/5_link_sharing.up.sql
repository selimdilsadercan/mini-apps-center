-- Alter suggest.suggestions table to add link sharing, daily pick, and reaction tracking columns
ALTER TABLE suggest.suggestions 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reaction TEXT CHECK (reaction IN ('love', 'sad', 'fire', 'mid', 'saved')),
ADD COLUMN IF NOT EXISTS is_daily_pick BOOLEAN DEFAULT FALSE;

-- Function: update_suggestion_reaction
DROP FUNCTION IF EXISTS suggest.update_suggestion_reaction(UUID, TEXT);
CREATE OR REPLACE FUNCTION suggest.update_suggestion_reaction(
    suggestion_id_param UUID,
    reaction_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE suggest.suggestions
    SET reaction = reaction_param
    WHERE id = suggestion_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: mark_suggestion_opened
DROP FUNCTION IF EXISTS suggest.mark_suggestion_opened(UUID);
CREATE OR REPLACE FUNCTION suggest.mark_suggestion_opened(
    suggestion_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE suggest.suggestions
    SET opened_at = NOW()
    WHERE id = suggestion_id_param AND opened_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_sent_suggestions (Updated return type)
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

-- Function: create_suggestion (Updated with expires_at and is_daily_pick)
DROP FUNCTION IF EXISTS suggest.create_suggestion(TEXT, TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS suggest.create_suggestion(TEXT, TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT[], TIMESTAMP WITH TIME ZONE, BOOLEAN);

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
    is_daily_pick_param BOOLEAN
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
        sender_id, sender_clerk_id, category, title, short_note, rating, external_link, image_url, expires_at, is_daily_pick
    ) VALUES (
        v_sender_id, sender_clerk_id_param, category_param, title_param, short_note_param, rating_param, external_link_param, image_url_param, expires_at_param, is_daily_pick_param
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

-- Re-grant permissions for new functions and schema
GRANT USAGE ON SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA suggest TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
