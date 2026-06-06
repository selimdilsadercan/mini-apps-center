DROP FUNCTION IF EXISTS concert_list.get_concerts(TEXT);

CREATE OR REPLACE FUNCTION concert_list.get_concerts(clerk_id_param TEXT)
RETURNS TABLE (
    id UUID,
    user_clerk_id TEXT,
    creator_username TEXT,
    creator_avatar TEXT,
    artist TEXT,
    date DATE,
    venue TEXT,
    notes TEXT,
    rating INTEGER,
    created_at TIMESTAMPTZ,
    friends JSONB,
    image_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.user_clerk_id,
        cu.username AS creator_username,
        cu.avatar_url AS creator_avatar,
        c.artist,
        c.date,
        c.venue,
        c.notes,
        c.rating,
        c.created_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', u.clerk_id,
                        'username', u.username,
                        'avatar', u.avatar_url
                    )
                )
                FROM concert_list.concert_friends cf
                JOIN public.users u ON cf.friend_clerk_id = u.clerk_id
                WHERE cf.concert_id = c.id
            ),
            '[]'::jsonb
        ) AS friends,
        c.image_url
    FROM concert_list.concerts c
    JOIN public.users cu ON c.user_clerk_id = cu.clerk_id
    WHERE c.user_clerk_id = clerk_id_param
       OR EXISTS (
           SELECT 1 FROM concert_list.concert_friends cf
           WHERE cf.concert_id = c.id AND cf.friend_clerk_id = clerk_id_param
       )
    ORDER BY c.date DESC, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
