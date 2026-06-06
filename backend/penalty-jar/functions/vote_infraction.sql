DROP FUNCTION IF EXISTS penalty_jar.vote_infraction;

CREATE OR REPLACE FUNCTION penalty_jar.vote_infraction(
    p_infraction_id UUID,
    p_user_id TEXT,
    p_approve BOOLEAN
)
RETURNS TEXT AS $$
DECLARE
    v_lobby_id UUID;
    v_reported_user_id TEXT;
    v_penalty_amount NUMERIC;
    v_penalty_type TEXT;
    v_total_members INT;
    v_total_other_members INT;
    v_approve_votes INT;
    v_reject_votes INT;
    v_status TEXT := 'pending';
BEGIN
    -- Get infraction details
    SELECT lobby_id, reported_user_id, penalty_amount, status
    INTO v_lobby_id, v_reported_user_id, v_penalty_amount, v_status
    FROM penalty_jar.infractions
    WHERE id = p_infraction_id;

    -- If already decided, just return current status
    IF v_status <> 'pending' THEN
        RETURN v_status;
    END IF;

    -- Do not let the reported user vote on their own infraction
    IF p_user_id = v_reported_user_id THEN
        RAISE EXCEPTION 'You cannot vote on your own infraction';
    END IF;

    -- Record the vote
    INSERT INTO penalty_jar.votes (infraction_id, user_id, approve)
    VALUES (p_infraction_id, p_user_id, p_approve)
    ON CONFLICT (infraction_id, user_id)
    DO UPDATE SET approve = EXCLUDED.approve, voted_at = NOW();

    -- Calculate total members in lobby (excluding the reported user)
    SELECT COUNT(*) INTO v_total_members
    FROM penalty_jar.lobby_members
    WHERE lobby_id = v_lobby_id;

    v_total_other_members := v_total_members - 1;
    
    -- If there are no other members (only 1 user in lobby), auto approve
    IF v_total_other_members <= 0 THEN
        v_status := 'approved';
    ELSE
        -- Count votes
        SELECT 
            COUNT(CASE WHEN approve = TRUE THEN 1 END),
            COUNT(CASE WHEN approve = FALSE THEN 1 END)
        INTO v_approve_votes, v_reject_votes
        FROM penalty_jar.votes
        WHERE infraction_id = p_infraction_id;

        -- Check decision: majority of other members
        -- If N-1 = 1, need 1 vote
        -- If N-1 = 2, need 2 votes to confirm or 1? Let's say: ceil(N-1 / 2.0)
        -- Wait, if N-1 = 2, and votes are 1 yes and 1 no, it's a tie.
        -- If yes reaches >= ceil((v_total_other_members + 1) / 2.0) or simply v_approve_votes > (v_total_other_members / 2.0):
        -- Let's use standard majority of votes: v_approve_votes > (v_total_other_members / 2.0)
        IF v_approve_votes > (v_total_other_members / 2.0) THEN
            v_status := 'approved';
        ELSIF v_reject_votes >= (v_total_other_members / 2.0) THEN
            -- In case of tie or reject majority
            v_status := 'rejected';
        END IF;
    END IF;

    -- Update infraction status if decided
    IF v_status <> 'pending' THEN
        UPDATE penalty_jar.infractions
        SET status = v_status
        WHERE id = p_infraction_id;

        -- If approved, apply penalty
        IF v_status = 'approved' THEN
            SELECT penalty_type INTO v_penalty_type FROM penalty_jar.lobbies WHERE id = v_lobby_id;
            
            IF v_penalty_type = 'points' THEN
                UPDATE penalty_jar.lobby_members
                SET points = GREATEST(0, points - v_penalty_amount::INT)
                WHERE lobby_id = v_lobby_id AND user_id = v_reported_user_id;
            ELSE
                UPDATE penalty_jar.lobby_members
                SET money_owed = money_owed + v_penalty_amount
                WHERE lobby_id = v_lobby_id AND user_id = v_reported_user_id;
            END IF;
        END IF;
    END IF;

    RETURN v_status;
END;
$$ LANGUAGE plpgsql;
