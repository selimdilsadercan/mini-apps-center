DROP FUNCTION IF EXISTS public.tournament_get_tournament_details(TEXT, TEXT);
DROP FUNCTION IF EXISTS tournament.get_tournament_details(TEXT, TEXT);

-- Get Tournament Details RPC
CREATE OR REPLACE FUNCTION tournament.get_tournament_details(
    slug_param TEXT,
    viewer_clerk_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    icon TEXT,
    status TEXT,
    admin_user_id UUID,
    capacity INTEGER,
    advance_count INTEGER,
    current_league_round INTEGER,
    league_match_count INTEGER,
    format TEXT,
    players_per_match INTEGER,
    start_at TIMESTAMPTZ,
    winner_id UUID,
    participants_count BIGINT,
    is_joined BOOLEAN
) AS $$
DECLARE
    v_tournament_id UUID;
    v_viewer_id UUID;
BEGIN
    -- Get user ID for is_joined check
    IF viewer_clerk_id IS NOT NULL THEN
        SELECT u.id INTO v_viewer_id FROM public.users u WHERE u.clerk_id = viewer_clerk_id;
    END IF;

    RETURN QUERY
    SELECT 
        t.id, t.name, t.slug, t.icon, t.status, t.admin_user_id, 
        t.capacity, t.advance_count, t.current_league_round, t.league_match_count,
        t.format, t.players_per_match, t.start_at, 
        (
            SELECT (SELECT key::uuid FROM jsonb_each_text(m.scores) ORDER BY value::integer DESC LIMIT 1)
            FROM tournament.matches m
            WHERE m.tournament_id = t.id AND m.phase = 'bracket' AND m.status = 'finished'
            ORDER BY m.round DESC, m.created_at DESC
            LIMIT 1
        ) as winner_id,
        (SELECT COUNT(*) FROM tournament.participants WHERE tournament_id = t.id),
        EXISTS(SELECT 1 FROM tournament.participants WHERE tournament_id = t.id AND user_id = v_viewer_id)
    FROM tournament.tournaments t
    WHERE t.slug = slug_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
