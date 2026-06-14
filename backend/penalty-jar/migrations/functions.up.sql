-- FUNCTIONS
-- 1. penalty_jar.create_lobby
-- 2. penalty_jar.get_lobby_details
-- 3. penalty_jar.join_lobby
-- 4. penalty_jar.report_infraction
-- 5. penalty_jar.vote_infraction
-- 6. penalty_jar.get_user_lobbies

-- 1. Create Lobby
DROP FUNCTION IF EXISTS penalty_jar.create_lobby(TEXT, TEXT, TEXT, TEXT, INT, NUMERIC, JSONB, TEXT);
CREATE OR REPLACE FUNCTION penalty_jar.create_lobby(
    p_creator_clerk_id TEXT,
    p_name TEXT,
    p_penalty_type TEXT,
    p_currency TEXT,
    p_point_start INT,
    p_penalty_amount NUMERIC,
    p_rules JSONB,
    p_join_code TEXT
)
RETURNS UUID AS $$
DECLARE
    v_lobby_id UUID;
    v_creator_id UUID;
BEGIN
    v_creator_id := public.get_internal_user_id(p_creator_clerk_id);
    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'Creator not found';
    END IF;

    -- Insert the lobby
    INSERT INTO penalty_jar.lobbies (
        join_code,
        creator_id,
        name,
        penalty_type,
        currency,
        point_start,
        penalty_amount,
        rules
    ) VALUES (
        p_join_code,
        v_creator_id,
        p_name,
        p_penalty_type,
        p_currency,
        p_point_start,
        p_penalty_amount,
        p_rules
    ) RETURNING id INTO v_lobby_id;

    -- Add creator as member
    INSERT INTO penalty_jar.lobby_members (
        lobby_id,
        user_id,
        points,
        money_owed,
        role
    ) VALUES (
        v_lobby_id,
        v_creator_id,
        p_point_start,
        0,
        'creator'
    );

    RETURN v_lobby_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Lobby Details
DROP FUNCTION IF EXISTS penalty_jar.get_lobby_details(UUID);
CREATE OR REPLACE FUNCTION penalty_jar.get_lobby_details(
    p_lobby_id UUID
)
RETURNS TABLE (
    id UUID,
    join_code TEXT,
    creator_id UUID,
    creator_clerk_id TEXT,
    name TEXT,
    penalty_type TEXT,
    currency TEXT,
    point_start INT,
    penalty_amount NUMERIC,
    rules JSONB,
    created_at TIMESTAMPTZ,
    members JSONB,
    infractions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.join_code,
        l.creator_id,
        cu.clerk_id AS creator_clerk_id,
        l.name,
        l.penalty_type,
        l.currency,
        l.point_start,
        l.penalty_amount,
        l.rules,
        l.created_at,
        -- Members aggregation
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'userId', u.clerk_id,
                    'username', u.username,
                    'avatar', u.avatar_url,
                    'points', lm.points,
                    'moneyOwed', lm.money_owed,
                    'role', lm.role,
                    'joinedAt', lm.joined_at
                )
            )
            FROM penalty_jar.lobby_members lm
            LEFT JOIN public.users u ON lm.user_id = u.id
            WHERE lm.lobby_id = l.id
        ) AS members,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', inf.id,
                        'reportedUserId', ru.clerk_id,
                        'reportedUsername', ru.username,
                        'reportedAvatar', ru.avatar_url,
                        'reporterUserId', rpu.clerk_id,
                        'reporterUsername', rpu.username,
                        'ruleName', inf.rule_name,
                        'penaltyAmount', inf.penalty_amount,
                        'isSelfReport', inf.is_self_report,
                        'status', inf.status,
                        'createdAt', inf.created_at,
                        'votes', COALESCE(
                            (
                                SELECT jsonb_agg(
                                    jsonb_build_object(
                                        'userId', vu.clerk_id,
                                        'username', vu.username,
                                        'approve', v.approve
                                    )
                                )
                                FROM penalty_jar.votes v
                                LEFT JOIN public.users vu ON v.user_id = vu.id
                                WHERE v.infraction_id = inf.id
                            ),
                            '[]'::jsonb
                        )
                    ) ORDER BY inf.created_at DESC
                )
                FROM penalty_jar.infractions inf
                LEFT JOIN public.users ru ON inf.reported_user_id = ru.id
                LEFT JOIN public.users rpu ON inf.reporter_user_id = rpu.id
                WHERE inf.lobby_id = l.id
            ),
            '[]'::jsonb
        ) AS infractions
    FROM penalty_jar.lobbies l
    LEFT JOIN public.users cu ON l.creator_id = cu.id
    WHERE l.id = p_lobby_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Join Lobby
DROP FUNCTION IF EXISTS penalty_jar.join_lobby(TEXT, TEXT);
CREATE OR REPLACE FUNCTION penalty_jar.join_lobby(
    p_clerk_id TEXT,
    p_join_code TEXT
)
RETURNS UUID AS $$
DECLARE
    v_lobby_id UUID;
    v_user_id UUID;
    v_point_start INT;
BEGIN
    v_user_id := public.get_internal_user_id(p_clerk_id);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Find lobby and get its starting points
    SELECT id, point_start INTO v_lobby_id, v_point_start
    FROM penalty_jar.lobbies
    WHERE UPPER(join_code) = UPPER(p_join_code);

    IF v_lobby_id IS NULL THEN
        RAISE EXCEPTION 'Lobby not found';
    END IF;

    -- Add member if not already in
    INSERT INTO penalty_jar.lobby_members (
        lobby_id,
        user_id,
        points,
        money_owed,
        role
    ) VALUES (
        v_lobby_id,
        v_user_id,
        v_point_start,
        0,
        'member'
    ) ON CONFLICT (lobby_id, user_id) DO NOTHING;

    RETURN v_lobby_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Report Infraction
DROP FUNCTION IF EXISTS penalty_jar.report_infraction(UUID, TEXT, TEXT, TEXT, NUMERIC, BOOLEAN);
CREATE OR REPLACE FUNCTION penalty_jar.report_infraction(
    p_lobby_id UUID,
    p_reported_clerk_id TEXT,
    p_reporter_clerk_id TEXT,
    p_rule_name TEXT,
    p_penalty_amount NUMERIC,
    p_is_self_report BOOLEAN
)
RETURNS UUID AS $$
DECLARE
    v_infraction_id UUID;
    v_reported_user_id UUID;
    v_reporter_user_id UUID;
    v_status TEXT := 'pending';
    v_penalty_type TEXT;
BEGIN
    v_reported_user_id := public.get_internal_user_id(p_reported_clerk_id);
    v_reporter_user_id := public.get_internal_user_id(p_reporter_clerk_id);

    IF v_reported_user_id IS NULL THEN
        RAISE EXCEPTION 'Reported user not found';
    END IF;

    IF p_is_self_report THEN
        v_status := 'approved';
    END IF;

    -- Insert infraction
    INSERT INTO penalty_jar.infractions (
        lobby_id,
        reported_user_id,
        reporter_user_id,
        rule_name,
        penalty_amount,
        is_self_report,
        status
    ) VALUES (
        p_lobby_id,
        v_reported_user_id,
        v_reporter_user_id,
        p_rule_name,
        p_penalty_amount,
        p_is_self_report,
        v_status
    ) RETURNING id INTO v_infraction_id;

    -- If self-report, apply penalty immediately
    IF p_is_self_report THEN
        SELECT penalty_type INTO v_penalty_type FROM penalty_jar.lobbies WHERE id = p_lobby_id;
        
        IF v_penalty_type = 'points' THEN
            UPDATE penalty_jar.lobby_members
            SET points = GREATEST(0, points - p_penalty_amount::INT)
            WHERE lobby_id = p_lobby_id AND user_id = v_reported_user_id;
        ELSE
            UPDATE penalty_jar.lobby_members
            SET money_owed = money_owed + p_penalty_amount
            WHERE lobby_id = p_lobby_id AND user_id = v_reported_user_id;
        END IF;
    END IF;

    RETURN v_infraction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Vote Infraction
DROP FUNCTION IF EXISTS penalty_jar.vote_infraction(UUID, TEXT, BOOLEAN);
CREATE OR REPLACE FUNCTION penalty_jar.vote_infraction(
    p_infraction_id UUID,
    p_clerk_id TEXT,
    p_approve BOOLEAN
)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_lobby_id UUID;
    v_reported_user_id UUID;
    v_penalty_amount NUMERIC;
    v_penalty_type TEXT;
    v_total_members INT;
    v_total_other_members INT;
    v_approve_votes INT;
    v_reject_votes INT;
    v_status TEXT := 'pending';
BEGIN
    v_user_id := public.get_internal_user_id(p_clerk_id);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

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
    IF v_user_id = v_reported_user_id THEN
        RAISE EXCEPTION 'You cannot vote on your own infraction';
    END IF;

    -- Record the vote
    INSERT INTO penalty_jar.votes (infraction_id, user_id, approve)
    VALUES (p_infraction_id, v_user_id, p_approve)
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
        IF v_approve_votes > (v_total_other_members / 2.0) THEN
            v_status := 'approved';
        ELSIF v_reject_votes >= (v_total_other_members / 2.0) THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Get User Lobbies
CREATE OR REPLACE FUNCTION penalty_jar.get_user_lobbies(
    p_clerk_id TEXT
)
RETURNS TABLE (
    id UUID,
    join_code TEXT,
    name TEXT,
    penalty_type TEXT,
    role TEXT,
    joined_at TIMESTAMPTZ,
    total_points NUMERIC,
    members JSONB
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(p_clerk_id);

    RETURN QUERY
    SELECT 
        l.id,
        l.join_code,
        l.name,
        l.penalty_type,
        lm.role,
        lm.joined_at,
        (SELECT SUM(money_owed) FROM penalty_jar.lobby_members WHERE lobby_id = l.id) AS total_points,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'userId', u.clerk_id,
                    'username', u.username,
                    'avatar', u.avatar_url
                )
            )
            FROM penalty_jar.lobby_members lm2
            JOIN public.users u ON lm2.user_id = u.id
            WHERE lm2.lobby_id = l.id
        ) AS members
    FROM penalty_jar.lobby_members lm
    JOIN penalty_jar.lobbies l ON lm.lobby_id = l.id
    WHERE lm.user_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
