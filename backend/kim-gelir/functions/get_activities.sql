DROP FUNCTION IF EXISTS kim_gelir.get_activities;

CREATE OR REPLACE FUNCTION kim_gelir.get_activities(
    p_user_id TEXT
)
RETURNS TABLE (
    id UUID,
    creator_id TEXT,
    creator_username TEXT,
    creator_avatar TEXT,
    title TEXT,
    location TEXT,
    time_option TEXT,
    custom_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    responses JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.creator_id,
        cu.username AS creator_username,
        cu.avatar_url AS creator_avatar,
        a.title,
        a.location,
        a.time_option,
        a.custom_time,
        a.created_at,
        a.expires_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'userId', ai.user_id,
                        'username', iu.username,
                        'avatar', iu.avatar_url,
                        'status', ai.status,
                        'updatedAt', ai.updated_at
                    )
                )
                FROM kim_gelir.activity_invites ai
                LEFT JOIN public.users iu ON ai.user_id = iu.clerk_id
                WHERE ai.activity_id = a.id
            ),
            '[]'::jsonb
        ) AS responses
    FROM kim_gelir.activities a
    LEFT JOIN public.users cu ON a.creator_id = cu.clerk_id
    WHERE 
        -- Must be the creator OR must have an invite/response row
        a.creator_id = p_user_id
        OR EXISTS (
            SELECT 1 
            FROM kim_gelir.activity_invites ai 
            WHERE ai.activity_id = a.id AND ai.user_id = p_user_id
        )
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;
