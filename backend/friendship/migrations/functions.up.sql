-- Friendship RPC Functions
-- 1. send_friend_request(sender_clerk_id TEXT, receiver_clerk_id TEXT)
-- 2. accept_friend_request(receiver_clerk_id TEXT, sender_clerk_id TEXT)
-- 3. reject_friend_request(receiver_clerk_id TEXT, sender_clerk_id TEXT)
-- 4. remove_friend(user_clerk_id TEXT, friend_clerk_id TEXT)
-- 5. get_friends(clerk_id_param TEXT)
-- 6. get_pending_requests(clerk_id_param TEXT)
-- 7. get_sent_requests(clerk_id_param TEXT)

-- 1. send_friend_request
DROP FUNCTION IF EXISTS public.send_friend_request(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.send_friend_request(
    sender_clerk_id TEXT,
    receiver_clerk_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_sender_id UUID;
    v_receiver_id UUID;
    v_u1 UUID;
    v_u2 UUID;
    v_existing_status TEXT;
    v_existing_sender UUID;
BEGIN
    v_sender_id := public.get_internal_user_id(sender_clerk_id);
    v_receiver_id := public.get_internal_user_id(receiver_clerk_id);

    IF v_sender_id IS NULL OR v_receiver_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'user_not_found');
    END IF;

    IF v_sender_id = v_receiver_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'cannot_add_self');
    END IF;

    -- Sort UUIDs for consistent storage
    IF v_sender_id < v_receiver_id THEN
        v_u1 := v_sender_id;
        v_u2 := v_receiver_id;
    ELSE
        v_u1 := v_receiver_id;
        v_u2 := v_sender_id;
    END IF;

    SELECT status, sender_id INTO v_existing_status, v_existing_sender
    FROM public.friends
    WHERE user_id_1 = v_u1 AND user_id_2 = v_u2;

    IF FOUND THEN
        IF v_existing_status = 'accepted' THEN
            RETURN jsonb_build_object('success', false, 'message', 'already_friends');
        ELSIF v_existing_status = 'pending' THEN
            IF v_existing_sender = v_sender_id THEN
                RETURN jsonb_build_object('success', false, 'message', 'request_already_sent');
            ELSE
                UPDATE public.friends
                SET status = 'accepted', updated_at = NOW()
                WHERE user_id_1 = v_u1 AND user_id_2 = v_u2;
                RETURN jsonb_build_object('success', true, 'message', 'accepted');
            END IF;
        END IF;
    ELSE
        INSERT INTO public.friends (user_id_1, user_id_2, status, sender_id)
        VALUES (v_u1, v_u2, 'pending', v_sender_id);
        RETURN jsonb_build_object('success', true, 'message', 'sent');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. accept_friend_request
DROP FUNCTION IF EXISTS public.accept_friend_request(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.accept_friend_request(
    receiver_clerk_id TEXT,
    sender_clerk_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_receiver_id UUID;
    v_sender_id UUID;
    v_u1 UUID;
    v_u2 UUID;
BEGIN
    v_receiver_id := public.get_internal_user_id(receiver_clerk_id);
    v_sender_id := public.get_internal_user_id(sender_clerk_id);

    IF v_receiver_id < v_sender_id THEN
        v_u1 := v_receiver_id;
        v_u2 := v_sender_id;
    ELSE
        v_u1 := v_sender_id;
        v_u2 := v_receiver_id;
    END IF;

    UPDATE public.friends
    SET status = 'accepted', updated_at = NOW()
    WHERE user_id_1 = v_u1 AND user_id_2 = v_u2 AND status = 'pending' AND sender_id = v_sender_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'request_not_found');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. reject_friend_request
DROP FUNCTION IF EXISTS public.reject_friend_request(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.reject_friend_request(
    receiver_clerk_id TEXT,
    sender_clerk_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_receiver_id UUID;
    v_sender_id UUID;
    v_u1 UUID;
    v_u2 UUID;
BEGIN
    v_receiver_id := public.get_internal_user_id(receiver_clerk_id);
    v_sender_id := public.get_internal_user_id(sender_clerk_id);

    IF v_receiver_id < v_sender_id THEN
        v_u1 := v_receiver_id;
        v_u2 := v_sender_id;
    ELSE
        v_u1 := v_sender_id;
        v_u2 := v_receiver_id;
    END IF;

    DELETE FROM public.friends
    WHERE user_id_1 = v_u1 AND user_id_2 = v_u2 AND status = 'pending' AND sender_id = v_sender_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'request_not_found');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. remove_friend
DROP FUNCTION IF EXISTS public.remove_friend(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.remove_friend(
    user_clerk_id TEXT,
    friend_clerk_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_friend_id UUID;
    v_u1 UUID;
    v_u2 UUID;
BEGIN
    v_user_id := public.get_internal_user_id(user_clerk_id);
    v_friend_id := public.get_internal_user_id(friend_clerk_id);

    IF v_user_id < v_friend_id THEN
        v_u1 := v_user_id;
        v_u2 := v_friend_id;
    ELSE
        v_u1 := v_friend_id;
        v_u2 := v_user_id;
    END IF;

    DELETE FROM public.friends
    WHERE user_id_1 = v_u1 AND user_id_2 = v_u2;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'friendship_not_found');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. get_friends
DROP FUNCTION IF EXISTS public.get_friends(TEXT);
CREATE OR REPLACE FUNCTION public.get_friends(clerk_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    username TEXT,
    avatar TEXT,
    last_played_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT 
        u.clerk_id AS id,
        u.username,
        u.avatar_url AS avatar,
        NULL::TIMESTAMPTZ AS last_played_at
    FROM public.friends f
    JOIN public.users u ON (CASE WHEN f.user_id_1 = v_user_id THEN f.user_id_2 ELSE f.user_id_1 END) = u.id
    WHERE (f.user_id_1 = v_user_id OR f.user_id_2 = v_user_id)
      AND f.status = 'accepted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. get_pending_requests
DROP FUNCTION IF EXISTS public.get_pending_requests(TEXT);
CREATE OR REPLACE FUNCTION public.get_pending_requests(clerk_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    username TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT 
        u.clerk_id AS id,
        u.username,
        u.avatar_url AS avatar,
        f.created_at
    FROM public.friends f
    JOIN public.users u ON f.sender_id = u.id
    WHERE (f.user_id_1 = v_user_id OR f.user_id_2 = v_user_id)
      AND f.status = 'pending'
      AND f.sender_id != v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. get_sent_requests
DROP FUNCTION IF EXISTS public.get_sent_requests(TEXT);
CREATE OR REPLACE FUNCTION public.get_sent_requests(clerk_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    username TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT 
        u.clerk_id AS id,
        u.username,
        u.avatar_url AS avatar,
        f.created_at
    FROM public.friends f
    JOIN public.users u ON (CASE WHEN f.user_id_1 = v_user_id THEN f.user_id_2 ELSE f.user_id_1 END) = u.id
    WHERE (f.user_id_1 = v_user_id OR f.user_id_2 = v_user_id)
      AND f.status = 'pending'
      AND f.sender_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
