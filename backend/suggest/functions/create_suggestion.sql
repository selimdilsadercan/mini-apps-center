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
