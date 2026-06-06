-- Recreate remove_friend function
DROP FUNCTION IF EXISTS public.remove_friend(TEXT, TEXT);
DROP FUNCTION IF EXISTS friendship.remove_friend(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.remove_friend(
    user_clerk_id TEXT,
    friend_clerk_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    u1 TEXT;
    u2 TEXT;
BEGIN
    -- Sort the users to ensure user_id_1 < user_id_2
    IF user_clerk_id < friend_clerk_id THEN
        u1 := user_clerk_id;
        u2 := friend_clerk_id;
    ELSE
        u1 := friend_clerk_id;
        u2 := user_clerk_id;
    END IF;

    DELETE FROM public.friends
    WHERE user_id_1 = u1 AND user_id_2 = u2;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'friendship_not_found');
    END IF;
END;
$$;


-- Recreate accept_friend_request function
DROP FUNCTION IF EXISTS public.accept_friend_request(TEXT, TEXT);
DROP FUNCTION IF EXISTS friendship.accept_friend_request(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.accept_friend_request(
    receiver_clerk_id TEXT,
    sender_clerk_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    u1 TEXT;
    u2 TEXT;
BEGIN
    -- Sort the users to ensure user_id_1 < user_id_2
    IF sender_clerk_id < receiver_clerk_id THEN
        u1 := sender_clerk_id;
        u2 := receiver_clerk_id;
    ELSE
        u1 := receiver_clerk_id;
        u2 := sender_clerk_id;
    END IF;

    UPDATE public.friends
    SET status = 'accepted', updated_at = NOW()
    WHERE user_id_1 = u1 AND user_id_2 = u2 AND status = 'pending' AND sender_id = sender_clerk_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'request_not_found');
    END IF;
END;
$$;


-- Recreate reject_friend_request function
DROP FUNCTION IF EXISTS public.reject_friend_request(TEXT, TEXT);
DROP FUNCTION IF EXISTS friendship.reject_friend_request(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.reject_friend_request(
    receiver_clerk_id TEXT,
    sender_clerk_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    u1 TEXT;
    u2 TEXT;
BEGIN
    -- Sort the users to ensure user_id_1 < user_id_2
    IF sender_clerk_id < receiver_clerk_id THEN
        u1 := sender_clerk_id;
        u2 := receiver_clerk_id;
    ELSE
        u1 := receiver_clerk_id;
        u2 := sender_clerk_id;
    END IF;

    DELETE FROM public.friends
    WHERE user_id_1 = u1 AND user_id_2 = u2 AND status = 'pending' AND sender_id = sender_clerk_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'request_not_found');
    END IF;
END;
$$;


-- Recreate send_friend_request function
DROP FUNCTION IF EXISTS public.send_friend_request(TEXT, TEXT);
DROP FUNCTION IF EXISTS friendship.send_friend_request(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.send_friend_request(
    sender_clerk_id TEXT,
    receiver_clerk_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    u1 TEXT;
    u2 TEXT;
    existing_status TEXT;
    existing_sender TEXT;
    res JSONB;
BEGIN
    -- Do not allow sending request to oneself
    IF sender_clerk_id = receiver_clerk_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'cannot_add_self');
    END IF;

    -- Sort the users to ensure user_id_1 < user_id_2
    IF sender_clerk_id < receiver_clerk_id THEN
        u1 := sender_clerk_id;
        u2 := receiver_clerk_id;
    ELSE
        u1 := receiver_clerk_id;
        u2 := sender_clerk_id;
    END IF;

    -- Check if users exist in the users table
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE clerk_id = sender_clerk_id) OR
       NOT EXISTS (SELECT 1 FROM public.users WHERE clerk_id = receiver_clerk_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'user_not_found');
    END IF;

    -- Check if record already exists
    SELECT status, sender_id INTO existing_status, existing_sender
    FROM public.friends
    WHERE user_id_1 = u1 AND user_id_2 = u2;

    IF FOUND THEN
        IF existing_status = 'accepted' THEN
            RETURN jsonb_build_object('success', false, 'message', 'already_friends');
        ELSIF existing_status = 'pending' THEN
            IF existing_sender = sender_clerk_id THEN
                RETURN jsonb_build_object('success', false, 'message', 'request_already_sent');
            ELSE
                -- The other user already sent a request, so accept it automatically
                UPDATE public.friends
                SET status = 'accepted', updated_at = NOW()
                WHERE user_id_1 = u1 AND user_id_2 = u2;
                RETURN jsonb_build_object('success', true, 'message', 'accepted');
            END IF;
        END IF;
    ELSE
        -- Create a new pending friend request
        INSERT INTO public.friends (user_id_1, user_id_2, status, sender_id)
        VALUES (u1, u2, 'pending', sender_clerk_id);
        RETURN jsonb_build_object('success', true, 'message', 'sent');
    END IF;
END;
$$;


-- Recreate get_pending_requests function
DROP FUNCTION IF EXISTS public.get_pending_requests(TEXT);
DROP FUNCTION IF EXISTS friendship.get_pending_requests(TEXT);

CREATE OR REPLACE FUNCTION public.get_pending_requests(
    clerk_id_param TEXT
)
RETURNS TABLE (
    id TEXT,
    username TEXT,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.clerk_id AS id,
        u.username,
        u.avatar_url AS avatar,
        f.created_at
    FROM public.friends f
    JOIN public.users u ON f.sender_id = u.clerk_id
    WHERE (f.user_id_1 = clerk_id_param OR f.user_id_2 = clerk_id_param)
      AND f.status = 'pending'
      AND f.sender_id != clerk_id_param;
END;
$$;


-- Recreate get_friends function
DROP FUNCTION IF EXISTS public.get_friends(TEXT);
DROP FUNCTION IF EXISTS friendship.get_friends(TEXT);

CREATE OR REPLACE FUNCTION public.get_friends(
    clerk_id_param TEXT
)
RETURNS TABLE (
    id TEXT,
    username TEXT,
    avatar TEXT,
    last_played_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.clerk_id AS id,
        u.username,
        u.avatar_url AS avatar,
        NULL::TIMESTAMP WITH TIME ZONE AS last_played_at
    FROM public.friends f
    JOIN public.users u ON (CASE WHEN f.user_id_1 = clerk_id_param THEN f.user_id_2 ELSE f.user_id_1 END) = u.clerk_id
    WHERE (f.user_id_1 = clerk_id_param OR f.user_id_2 = clerk_id_param)
      AND f.status = 'accepted';
END;
$$;
