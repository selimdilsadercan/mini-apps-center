-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS penalty_jar;

-- 2. Lobbies Table
CREATE TABLE IF NOT EXISTS penalty_jar.lobbies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    join_code TEXT UNIQUE NOT NULL,
    creator_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    penalty_type TEXT NOT NULL CHECK (penalty_type IN ('points', 'jar')) DEFAULT 'points',
    currency TEXT NOT NULL DEFAULT 'TL',
    point_start INT NOT NULL DEFAULT 100,
    penalty_amount NUMERIC NOT NULL DEFAULT 10,
    rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Lobby Members Table
CREATE TABLE IF NOT EXISTS penalty_jar.lobby_members (
    lobby_id UUID NOT NULL REFERENCES penalty_jar.lobbies(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    points INT NOT NULL DEFAULT 100,
    money_owed NUMERIC NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (lobby_id, user_id)
);

-- 4. Infractions Table
CREATE TABLE IF NOT EXISTS penalty_jar.infractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID NOT NULL REFERENCES penalty_jar.lobbies(id) ON DELETE CASCADE,
    reported_user_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    reporter_user_id TEXT REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    penalty_amount NUMERIC NOT NULL,
    is_self_report BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Votes Table
CREATE TABLE IF NOT EXISTS penalty_jar.votes (
    infraction_id UUID NOT NULL REFERENCES penalty_jar.infractions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    approve BOOLEAN NOT NULL,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (infraction_id, user_id)
);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pj_lobbies_code ON penalty_jar.lobbies(join_code);
CREATE INDEX IF NOT EXISTS idx_pj_members_user ON penalty_jar.lobby_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pj_members_lobby ON penalty_jar.lobby_members(lobby_id);
CREATE INDEX IF NOT EXISTS idx_pj_infractions_lobby ON penalty_jar.infractions(lobby_id);
CREATE INDEX IF NOT EXISTS idx_pj_votes_infraction ON penalty_jar.votes(infraction_id);

-- 7. Permissions (Grants)
GRANT USAGE ON SCHEMA penalty_jar TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA penalty_jar TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA penalty_jar TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA penalty_jar TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA penalty_jar GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA penalty_jar GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA penalty_jar GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 8. Functions

-- create_lobby
CREATE OR REPLACE FUNCTION penalty_jar.create_lobby(
    p_creator_id TEXT,
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
BEGIN
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
        p_creator_id,
        p_name,
        p_penalty_type,
        p_currency,
        p_point_start,
        p_penalty_amount,
        p_rules
    ) RETURNING id INTO v_lobby_id;

    INSERT INTO penalty_jar.lobby_members (
        lobby_id,
        user_id,
        points,
        money_owed,
        role
    ) VALUES (
        v_lobby_id,
        p_creator_id,
        p_point_start,
        0,
        'creator'
    );

    RETURN v_lobby_id;
END;
$$ LANGUAGE plpgsql;

-- join_lobby
CREATE OR REPLACE FUNCTION penalty_jar.join_lobby(
    p_user_id TEXT,
    p_join_code TEXT
)
RETURNS UUID AS $$
DECLARE
    v_lobby_id UUID;
    v_point_start INT;
BEGIN
    SELECT id, point_start INTO v_lobby_id, v_point_start
    FROM penalty_jar.lobbies
    WHERE UPPER(join_code) = UPPER(p_join_code);

    IF v_lobby_id IS NULL THEN
        RAISE EXCEPTION 'Lobby not found';
    END IF;

    INSERT INTO penalty_jar.lobby_members (
        lobby_id,
        user_id,
        points,
        money_owed,
        role
    ) VALUES (
        v_lobby_id,
        p_user_id,
        v_point_start,
        0,
        'member'
    ) ON CONFLICT (lobby_id, user_id) DO NOTHING;

    RETURN v_lobby_id;
END;
$$ LANGUAGE plpgsql;

-- get_lobby_details
CREATE OR REPLACE FUNCTION penalty_jar.get_lobby_details(
    p_lobby_id UUID
)
RETURNS TABLE (
    id UUID,
    join_code TEXT,
    creator_id TEXT,
    name TEXT,
    penalty_type TEXT,
    currency TEXT,
    point_start INT,
    penalty_amount NUMERIC,
    rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    members JSONB,
    infractions JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.join_code,
        l.creator_id,
        l.name,
        l.penalty_type,
        l.currency,
        l.point_start,
        l.penalty_amount,
        l.rules,
        l.created_at,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'userId', lm.user_id,
                    'username', u.username,
                    'avatar', u.avatar_url,
                    'points', lm.points,
                    'moneyOwed', lm.money_owed,
                    'role', lm.role,
                    'joinedAt', lm.joined_at
                )
            )
            FROM penalty_jar.lobby_members lm
            LEFT JOIN public.users u ON lm.user_id = u.clerk_id
            WHERE lm.lobby_id = l.id
        ) AS members,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', inf.id,
                        'reportedUserId', inf.reported_user_id,
                        'reportedUsername', ru.username,
                        'reportedAvatar', ru.avatar_url,
                        'reporterUserId', inf.reporter_user_id,
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
                                        'userId', v.user_id,
                                        'username', vu.username,
                                        'approve', v.approve
                                    )
                                )
                                FROM penalty_jar.votes v
                                LEFT JOIN public.users vu ON v.user_id = vu.clerk_id
                                WHERE v.infraction_id = inf.id
                            ),
                            '[]'::jsonb
                        )
                    ) ORDER BY inf.created_at DESC
                )
                FROM penalty_jar.infractions inf
                LEFT JOIN public.users ru ON inf.reported_user_id = ru.clerk_id
                LEFT JOIN public.users rpu ON inf.reporter_user_id = rpu.clerk_id
                WHERE inf.lobby_id = l.id
            ),
            '[]'::jsonb
        ) AS infractions
    FROM penalty_jar.lobbies l
    WHERE l.id = p_lobby_id;
END;
$$ LANGUAGE plpgsql;

-- report_infraction
CREATE OR REPLACE FUNCTION penalty_jar.report_infraction(
    p_lobby_id UUID,
    p_reported_user_id TEXT,
    p_reporter_user_id TEXT,
    p_rule_name TEXT,
    p_penalty_amount NUMERIC,
    p_is_self_report BOOLEAN
)
RETURNS UUID AS $$
DECLARE
    v_infraction_id UUID;
    v_status TEXT := 'pending';
    v_penalty_type TEXT;
BEGIN
    IF p_is_self_report THEN
        v_status := 'approved';
    END IF;

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
        p_reported_user_id,
        p_reporter_user_id,
        p_rule_name,
        p_penalty_amount,
        p_is_self_report,
        v_status
    ) RETURNING id INTO v_infraction_id;

    IF p_is_self_report THEN
        SELECT penalty_type INTO v_penalty_type FROM penalty_jar.lobbies WHERE id = p_lobby_id;
        
        IF v_penalty_type = 'points' THEN
            UPDATE penalty_jar.lobby_members
            SET points = GREATEST(0, points - p_penalty_amount::INT)
            WHERE lobby_id = p_lobby_id AND user_id = p_reported_user_id;
        ELSE
            UPDATE penalty_jar.lobby_members
            SET money_owed = money_owed + p_penalty_amount
            WHERE lobby_id = p_lobby_id AND user_id = p_reported_user_id;
        END IF;
    END IF;

    RETURN v_infraction_id;
END;
$$ LANGUAGE plpgsql;

-- vote_infraction
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
    SELECT lobby_id, reported_user_id, penalty_amount, status
    INTO v_lobby_id, v_reported_user_id, v_penalty_amount, v_status
    FROM penalty_jar.infractions
    WHERE id = p_infraction_id;

    IF v_status <> 'pending' THEN
        RETURN v_status;
    END IF;

    IF p_user_id = v_reported_user_id THEN
        RAISE EXCEPTION 'You cannot vote on your own infraction';
    END IF;

    INSERT INTO penalty_jar.votes (infraction_id, user_id, approve)
    VALUES (p_infraction_id, p_user_id, p_approve)
    ON CONFLICT (infraction_id, user_id)
    DO UPDATE SET approve = EXCLUDED.approve, voted_at = NOW();

    SELECT COUNT(*) INTO v_total_members
    FROM penalty_jar.lobby_members
    WHERE lobby_id = v_lobby_id;

    v_total_other_members := v_total_members - 1;
    
    IF v_total_other_members <= 0 THEN
        v_status := 'approved';
    ELSE
        SELECT 
            COUNT(CASE WHEN approve = TRUE THEN 1 END),
            COUNT(CASE WHEN approve = FALSE THEN 1 END)
        INTO v_approve_votes, v_reject_votes
        FROM penalty_jar.votes
        WHERE infraction_id = p_infraction_id;

        IF v_approve_votes > (v_total_other_members / 2.0) THEN
            v_status := 'approved';
        ELSIF v_reject_votes >= (v_total_other_members / 2.0) THEN
            v_status := 'rejected';
        END IF;
    END IF;

    IF v_status <> 'pending' THEN
        UPDATE penalty_jar.infractions
        SET status = v_status
        WHERE id = p_infraction_id;

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
