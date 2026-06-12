DROP FUNCTION IF EXISTS suggest.get_inbox_suggestions(TEXT);

CREATE OR REPLACE FUNCTION suggest.get_inbox_suggestions(
    clerk_id_param TEXT
)
RETURNS TABLE (
    id UUID,
    suggestion_id UUID,
    share_id TEXT,
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
    sender_clerk_id TEXT,
    sender_username TEXT,
    sender_avatar TEXT,
    status TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        s.id AS suggestion_id,
        s.share_id,
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
        s.sender_clerk_id,
        u.username AS sender_username,
        u.avatar_url AS sender_avatar,
        r.status,
        r.updated_at
    FROM suggest.recipients r
    JOIN suggest.suggestions s ON r.suggestion_id = s.id
    LEFT JOIN public.users u ON s.sender_id = u.id
    WHERE r.recipient_clerk_id = clerk_id_param
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
