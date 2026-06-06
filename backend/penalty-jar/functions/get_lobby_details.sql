DROP FUNCTION IF EXISTS penalty_jar.get_lobby_details;

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
        -- Members aggregation
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
