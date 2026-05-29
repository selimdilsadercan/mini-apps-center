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
