DROP FUNCTION IF EXISTS campus_concerts.get_concerts(TEXT);

CREATE OR REPLACE FUNCTION campus_concerts.get_concerts(clerk_id_param TEXT)
RETURNS TABLE (
    id UUID,
    artist TEXT,
    campus TEXT,
    date DATE,
    description TEXT,
    image_url TEXT,
    added_by_clerk_id TEXT,
    creator_username TEXT,
    creator_avatar TEXT,
    created_at TIMESTAMPTZ,
    user_status TEXT,
    attendees JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.artist,
        c.campus,
        c.date,
        c.description,
        c.image_url,
        c.added_by_clerk_id,
        cu.username AS creator_username,
        cu.avatar_url AS creator_avatar,
        c.created_at,
        (
            SELECT att.status 
            FROM campus_concerts.attendance att 
            WHERE att.concert_id = c.id AND att.user_clerk_id = clerk_id_param
        ) AS user_status,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'clerk_id', u.clerk_id,
                        'username', u.username,
                        'avatar_url', u.avatar_url,
                        'status', att.status
                    )
                )
                FROM campus_concerts.attendance att
                JOIN public.users u ON att.user_clerk_id = u.clerk_id
                WHERE att.concert_id = c.id
            ),
            '[]'::jsonb
        ) AS attendees
    FROM campus_concerts.concerts c
    LEFT JOIN public.users cu ON c.added_by_clerk_id = cu.clerk_id
    ORDER BY c.date DESC, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
