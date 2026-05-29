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
