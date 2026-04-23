-- Drop old function
DROP FUNCTION IF EXISTS public.tournament_advance_tournament(TEXT, TEXT);

-- Advance Tournament RPC
CREATE OR REPLACE FUNCTION tournament.advance_tournament(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_tournament tournament.tournaments;
    v_current_round INTEGER;
    v_total_league_rounds INTEGER;
    v_phase TEXT;
    v_next_matches JSONB;
BEGIN
    -- 1. Auth & Get Tournament
    SELECT id INTO v_admin_id FROM public.users WHERE clerk_id = admin_clerk_id;
    SELECT * INTO v_tournament FROM tournament.tournaments WHERE slug = slug_param;

    IF v_tournament IS NULL THEN RAISE EXCEPTION 'Tournament not found'; END IF;
    IF v_tournament.admin_user_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;

    v_current_round := v_tournament.current_league_round;

    -- 2. Logic for League Phase
    IF v_current_round > 0 THEN
        v_total_league_rounds := v_tournament.league_match_count;
        
        IF v_current_round < v_total_league_rounds THEN
            -- Just increment the round
            UPDATE tournament.tournaments 
            SET current_league_round = v_current_round + 1 
            WHERE id = v_tournament.id;
            RETURN TRUE;
        ELSE
            -- League finished, move to Bracket
            -- Calculate rankings and pick top X
            -- For simplicity in this RPC, we pick top 4 or top 8 based on advance_count
            -- and create initial bracket matches
            
            -- Set round to 0 to indicate bracket phase
            UPDATE tournament.tournaments SET current_league_round = 0 WHERE id = v_tournament.id;
            
            -- Create Bracket Round 1 Matches
            -- We'll pick top X participants based on points/average
            INSERT INTO tournament.matches (tournament_id, phase, round, player1_id, player2_id, status)
            SELECT 
                v_tournament.id, 'bracket', 1,
                ranked_p.id1, ranked_p.id2, 'upcoming'
            FROM (
                -- Simplified pairing: 1 vs 4, 2 vs 3 (for top 4)
                SELECT 
                    p_list[1] as id1, p_list[4] as id2
                UNION ALL
                SELECT 
                    p_list[2] as id1, p_list[3] as id2
                FROM (
                    SELECT array_agg(id ORDER BY points DESC, average DESC) as p_list
                    FROM tournament.participants
                    WHERE tournament_id = v_tournament.id
                    LIMIT 4 -- Simplified to top 4 for now
                ) AS sub
            ) AS ranked_p;
            
            RETURN TRUE;
        END IF;
    END IF;

    -- 3. Logic for Bracket Phase (v_current_round = 0)
    -- Find latest bracket round
    SELECT round INTO v_current_round 
    FROM tournament.matches 
    WHERE tournament_id = v_tournament.id AND phase = 'bracket' 
    ORDER BY round DESC LIMIT 1;

    -- Pick winners and create next round matches
    -- Simplified: If current round had 2 matches (4 players), next round has 1 match (final)
    IF v_current_round = 1 THEN
        INSERT INTO tournament.matches (tournament_id, phase, round, player1_id, player2_id, status)
        SELECT 
            v_tournament.id, 'bracket', 2,
            winners[1], winners[2], 'upcoming'
        FROM (
            SELECT array_agg(winner_id ORDER BY created_at ASC) as winners
            FROM tournament.matches
            WHERE tournament_id = v_tournament.id AND phase = 'bracket' AND round = 1
        ) AS sub;
        RETURN TRUE;
    ELSIF v_current_round = 2 THEN
        -- Final finished, set tournament winner
        UPDATE tournament.tournaments
        SET status = 'finished',
            winner_id = (SELECT winner_id FROM tournament.matches WHERE tournament_id = v_tournament.id AND phase = 'bracket' AND round = 2 LIMIT 1)
        WHERE id = v_tournament.id;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
