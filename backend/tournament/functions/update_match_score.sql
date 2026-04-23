-- Drop old function
DROP FUNCTION IF EXISTS public.tournament_update_match_score(UUID, JSONB);
DROP FUNCTION IF EXISTS tournament.update_match_score(UUID, JSONB);

-- Update Match Score RPC
CREATE OR REPLACE FUNCTION tournament.update_match_score(
    match_id UUID,
    scores_param JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE tournament.matches
    SET scores = scores_param,
        status = 'finished',
        updated_at = NOW()
    WHERE id = match_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
