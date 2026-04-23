-- Drop old function
DROP FUNCTION IF EXISTS public.tournament_join_tournament(TEXT, TEXT, TEXT, TEXT);

-- Join Tournament RPC
CREATE OR REPLACE FUNCTION tournament.join_tournament(
    slug_param TEXT,
    clerk_id_param TEXT,
    username_param TEXT,
    avatar_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_tournament_id UUID;
    v_status TEXT;
    v_user_id UUID;
BEGIN
    -- Get tournament info
    SELECT id, status INTO v_tournament_id, v_status 
    FROM tournament.tournaments 
    WHERE slug = slug_param;

    IF v_tournament_id IS NULL THEN
        RAISE EXCEPTION 'Tournament not found';
    END IF;

    IF v_status != 'upcoming' THEN
        RAISE EXCEPTION 'Tournament already started or finished';
    END IF;

    -- Get user_id if not a manual player
    IF clerk_id_param NOT LIKE 'manual_%' AND clerk_id_param NOT LIKE 'mock_%' THEN
        SELECT id INTO v_user_id FROM public.users WHERE clerk_id = clerk_id_param;
    END IF;

    INSERT INTO tournament.participants (
        tournament_id, user_id, username, avatar
    ) VALUES (
        v_tournament_id, v_user_id, username_param, avatar_param
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
