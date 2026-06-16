-- Feed RPC Functions
-- 1. create_feed_event(clerk_id_param TEXT, username_param TEXT, user_avatar_param TEXT, app_id_param TEXT, event_type_param TEXT, payload_param JSONB)
-- 2. get_feed(clerk_id_param TEXT, scope_param TEXT, friend_ids_param UUID[])
-- 3. get_events_by_app(app_id_param TEXT)
-- 4. update_feed_event(id_param UUID, clerk_id_param TEXT, payload_param JSONB)
-- 5. delete_feed_event(id_param UUID, clerk_id_param TEXT)

-- 1. create_feed_event
DROP FUNCTION IF EXISTS public.create_feed_event(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION public.create_feed_event(
    clerk_id_param TEXT,
    username_param TEXT,
    user_avatar_param TEXT,
    app_id_param TEXT,
    event_type_param TEXT,
    payload_param JSONB
)
RETURNS public.feed_events AS $$
DECLARE
    v_user_id UUID;
    v_result public.feed_events;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO public.feed_events (
        user_id,
        username,
        user_avatar,
        app_id,
        event_type,
        payload
    ) VALUES (
        v_user_id,
        username_param,
        user_avatar_param,
        app_id_param,
        event_type_param,
        payload_param
    )
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. get_feed
DROP FUNCTION IF EXISTS public.get_feed(TEXT, TEXT, UUID[]);
CREATE OR REPLACE FUNCTION public.get_feed(
    clerk_id_param TEXT,
    scope_param TEXT,
    friend_ids_param UUID[] DEFAULT '{}'::UUID[]
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    username TEXT,
    user_avatar TEXT,
    app_id TEXT,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ,
    creator_username TEXT,
    creator_full_name TEXT,
    creator_avatar_url TEXT
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT 
        fe.id,
        fe.user_id,
        fe.username,
        fe.user_avatar,
        fe.app_id,
        fe.event_type,
        fe.payload,
        fe.created_at,
        u.username AS creator_username,
        u.full_name AS creator_full_name,
        u.avatar_url AS creator_avatar_url
    FROM public.feed_events fe
    LEFT JOIN public.users u ON fe.user_id = u.id
    WHERE 
        (scope_param = 'all')
        OR (scope_param = 'friends' AND fe.user_id = ANY(friend_ids_param))
        OR (scope_param = 'foryou' AND (fe.user_id = v_user_id OR fe.user_id = ANY(friend_ids_param)))
        OR (scope_param IS NULL AND (fe.user_id = v_user_id OR fe.user_id = ANY(friend_ids_param)))
    ORDER BY fe.created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. get_events_by_app
DROP FUNCTION IF EXISTS public.get_events_by_app(TEXT);
CREATE OR REPLACE FUNCTION public.get_events_by_app(app_id_param TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    username TEXT,
    user_avatar TEXT,
    app_id TEXT,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ,
    creator_username TEXT,
    creator_full_name TEXT,
    creator_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fe.id,
        fe.user_id,
        fe.username,
        fe.user_avatar,
        fe.app_id,
        fe.event_type,
        fe.payload,
        fe.created_at,
        u.username AS creator_username,
        u.full_name AS creator_full_name,
        u.avatar_url AS creator_avatar_url
    FROM public.feed_events fe
    LEFT JOIN public.users u ON fe.user_id = u.id
    WHERE fe.app_id = app_id_param
    ORDER BY fe.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. update_feed_event
DROP FUNCTION IF EXISTS public.update_feed_event(UUID, TEXT, JSONB);
CREATE OR REPLACE FUNCTION public.update_feed_event(
    id_param UUID,
    clerk_id_param TEXT,
    payload_param JSONB
)
RETURNS public.feed_events AS $$
DECLARE
    v_user_id UUID;
    v_result public.feed_events;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    UPDATE public.feed_events
    SET payload = payload_param
    WHERE id = id_param AND user_id = v_user_id
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. delete_feed_event
DROP FUNCTION IF EXISTS public.delete_feed_event(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.delete_feed_event(
    id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_deleted_rows INTEGER;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    DELETE FROM public.feed_events
    WHERE id = id_param AND user_id = v_user_id;

    GET DIAGNOSTICS v_deleted_rows = ROW_COUNT;
    RETURN v_deleted_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
