DROP FUNCTION IF EXISTS public.tournament_save_manual_matches(TEXT, INT, JSONB);
DROP FUNCTION IF EXISTS tournament.tournament_save_manual_matches(TEXT, INT, JSONB);

-- Manuel eşleşmeleri kaydetmek için kullanılır.
CREATE OR REPLACE FUNCTION tournament.tournament_save_manual_matches(
    p_slug TEXT,
    p_round INT,
    p_matches JSONB -- [{match_id, player1_id, player2_id, player3_id, player4_id}, ...]
) RETURNS JSONB AS $$
DECLARE
    v_match JSONB;
BEGIN
    -- Gelen JSON listesindeki her maç için güncelleme yap
    FOR v_match IN SELECT * FROM jsonb_array_elements(p_matches) LOOP
        UPDATE tournament.matches 
        SET 
            player1_id = NULLIF((v_match->>'player1_id'), '')::UUID,
            player2_id = NULLIF((v_match->>'player2_id'), '')::UUID,
            player3_id = NULLIF((v_match->>'player3_id'), '')::UUID,
            player4_id = NULLIF((v_match->>'player4_id'), '')::UUID
        WHERE id = (v_match->>'match_id')::UUID;
    END LOOP;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
