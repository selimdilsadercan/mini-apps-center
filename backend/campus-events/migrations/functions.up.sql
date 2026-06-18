-- CampusEvents RPC Functions

-- 1. get_events
DROP FUNCTION IF EXISTS campus_events.get_events(TEXT, TEXT);
CREATE OR REPLACE FUNCTION campus_events.get_events(
    clerk_id_param TEXT,
    university_param TEXT
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
    WHERE e.university = university_param
    ORDER BY e.event_date ASC, e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. add_event
DROP FUNCTION IF EXISTS campus_events.add_event(TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION campus_events.add_event(
    title_param TEXT,
    description_param TEXT,
    university_param TEXT,
    location_param TEXT,
    event_date_param TIMESTAMP WITH TIME ZONE,
    image_url_param TEXT,
    organizer_club_param TEXT,
    added_by_clerk_id_param TEXT
)
RETURNS campus_events.events AS $$
DECLARE
    v_added_by_uuid UUID;
    v_result campus_events.events;
BEGIN
    v_added_by_uuid := public.get_internal_user_id(added_by_clerk_id_param);

    INSERT INTO campus_events.events (
        title,
        description,
        university,
        location,
        event_date,
        image_url,
        organizer_club,
        added_by_id
    ) VALUES (
        title_param,
        description_param,
        university_param,
        location_param,
        event_date_param,
        image_url_param,
        organizer_club_param,
        v_added_by_uuid
    )
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. set_attendance
DROP FUNCTION IF EXISTS campus_events.set_attendance(TEXT, UUID, TEXT);
CREATE OR REPLACE FUNCTION campus_events.set_attendance(
    clerk_id_param TEXT,
    event_id_param UUID,
    status_param TEXT
)
RETURNS campus_events.attendance AS $$
DECLARE
    v_user_uuid UUID;
    v_result campus_events.attendance;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

    IF status_param IS NULL OR status_param = 'none' OR status_param = '' THEN
        DELETE FROM campus_events.attendance
        WHERE campus_events.attendance.user_id = v_user_uuid AND campus_events.attendance.event_id = event_id_param
        RETURNING * INTO v_result;
    ELSE
        INSERT INTO campus_events.attendance (
            user_id,
            event_id,
            status
        ) VALUES (
            v_user_uuid,
            event_id_param,
            status_param
        )
        ON CONFLICT (user_id, event_id)
        DO UPDATE SET 
            status = EXCLUDED.status,
            created_at = NOW()
        RETURNING * INTO v_result;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA campus_events TO anon, authenticated, service_role;
