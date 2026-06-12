DROP FUNCTION IF EXISTS suggest.get_sent_suggestions(TEXT);

CREATE OR REPLACE FUNCTION suggest.get_sent_suggestions(
    clerk_id_param TEXT
)
RETURNS TABLE (
    id UUID,
    category TEXT,
    title TEXT,
    short_note TEXT,
    rating DECIMAL,
    external_link TEXT,
    image_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    reaction TEXT,
    is_daily_pick BOOLEAN,
    preview_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    recipients JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.category,
        s.title,
        s.short_note,
        s.rating,
        s.external_link,
        s.image_url,
        s.expires_at,
        s.opened_at,
        s.reaction,
        s.is_daily_pick,
        s.preview_url,
        s.created_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'recipient_clerk_id', r.recipient_clerk_id,
                    'recipient_username', u.username,
                    'recipient_avatar', u.avatar_url,
                    'status', r.status,
                    'updated_at', r.updated_at
                )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'::jsonb
        ) AS recipients
    FROM suggest.suggestions s
    LEFT JOIN suggest.recipients r ON s.id = r.suggestion_id
    LEFT JOIN public.users u ON r.recipient_id = u.id
    WHERE s.sender_clerk_id = clerk_id_param
    GROUP BY s.id
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
