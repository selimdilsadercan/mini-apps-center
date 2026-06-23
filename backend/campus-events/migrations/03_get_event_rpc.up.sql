-- 4. get_event
DROP FUNCTION IF EXISTS campus_events.get_event(TEXT, UUID);
CREATE OR REPLACE FUNCTION campus_events.get_event(
    clerk_id_param TEXT,
    event_id_param UUID
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    university TEXT,
    location TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    image_url TEXT,
    organizer_club TEXT,
    added_by_id UUID,
    creator_username TEXT,
    creator_avatar TEXT,
    created_at TIMESTAMPTZ,
    user_status TEXT,
    business_id TEXT,
    category TEXT,
    attendees JSONB
) AS $$
DECLARE
    v_user_uuid UUID;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.university,
        e.location,
        e.event_date,
        e.image_url,
        e.organizer_club,
        e.added_by_id,
        cu.username AS creator_username,
        cu.avatar_url AS creator_avatar,
        e.created_at,
        (
            SELECT att.status 
            FROM campus_events.attendance att 
            WHERE att.event_id = e.id AND att.user_id = v_user_uuid
        ) AS user_status,
        e.business_id,
        e.category,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'user_id', u.id,
                        'username', u.username,
                        'avatar_url', u.avatar_url,
                        'status', att.status
                    )
                )
                FROM campus_events.attendance att
                JOIN public.users u ON att.user_id = u.id
                WHERE att.event_id = e.id
            ),
            '[]'::jsonb
        ) AS attendees
    FROM campus_events.events e
    LEFT JOIN public.users cu ON e.added_by_id = cu.id
    WHERE e.id = event_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT ALL ON FUNCTION campus_events.get_event(TEXT, UUID) TO anon, authenticated, service_role;
