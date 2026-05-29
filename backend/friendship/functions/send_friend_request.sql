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
