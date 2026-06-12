DROP FUNCTION IF EXISTS suggest.get_suggestion_detail(TEXT, UUID);

CREATE OR REPLACE FUNCTION suggest.get_suggestion_detail(
    clerk_id_param TEXT,
    share_id_param TEXT
)
RETURNS TABLE (
    id UUID,
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
    recipient_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
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
        u_send.username AS sender_username,
        u_send.avatar_url AS sender_avatar,
        r.status AS recipient_status
    FROM suggest.suggestions s
    LEFT JOIN public.users u_send ON s.sender_id = u_send.id
    -- Left join recipient info to see if this user is a recipient and their status
    LEFT JOIN suggest.recipients r ON s.id = r.suggestion_id AND r.recipient_clerk_id = clerk_id_param
    WHERE s.share_id = share_id_param 
      AND (s.sender_clerk_id = clerk_id_param OR r.recipient_clerk_id = clerk_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
