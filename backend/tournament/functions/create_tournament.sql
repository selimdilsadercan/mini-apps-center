-- Drop old function
DROP FUNCTION IF EXISTS public.tournament_create_tournament(TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER, INTEGER, INTEGER, TEXT);

-- Create Tournament RPC
CREATE OR REPLACE FUNCTION tournament.create_tournament(
    name_param TEXT,
    slug_param TEXT,
    icon_param TEXT,
    capacity_param INTEGER,
    format_param TEXT,
    league_match_count_param INTEGER,
    advance_count_param INTEGER,
    players_per_match_param INTEGER,
    admin_clerk_id TEXT
)
RETURNS SETOF tournament.tournaments AS $$
DECLARE
    v_admin_id UUID;
    v_new_tournament tournament.tournaments;
BEGIN
    -- Get internal user ID from clerk_id
    SELECT id INTO v_admin_id FROM public.users WHERE clerk_id = admin_clerk_id;
    
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Admin user not found';
    END IF;

    INSERT INTO tournament.tournaments (
        name, slug, icon, capacity, format, 
        league_match_count, advance_count, admin_user_id
    ) VALUES (
        name_param, slug_param, icon_param, capacity_param, format_param,
        league_match_count_param, advance_count_param, v_admin_id
    ) RETURNING * INTO v_new_tournament;

    RETURN NEXT v_new_tournament;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
