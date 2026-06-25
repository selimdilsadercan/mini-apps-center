-- 1. get_events
DROP FUNCTION IF EXISTS campus_events.get_events(TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION campus_events.get_events(
    clerk_id_param TEXT,
    university_param TEXT DEFAULT NULL,
    business_id_param TEXT DEFAULT NULL,
    category_param TEXT DEFAULT NULL
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
    attendees JSONB,
    has_form BOOLEAN,
    form_questions JSONB
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
        ) AS attendees,
        e.has_form,
        e.form_questions
    FROM campus_events.events e
    LEFT JOIN public.users cu ON e.added_by_id = cu.id
    WHERE 
        (university_param IS NULL OR e.university = university_param) AND
        (business_id_param IS NULL OR e.business_id = business_id_param) AND
        (category_param IS NULL OR e.category = category_param)
    ORDER BY e.event_date ASC, e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. get_event
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
    attendees JSONB,
    has_form BOOLEAN,
    form_questions JSONB,
    user_submission JSONB
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
        ) AS attendees,
        e.has_form,
        e.form_questions,
        (
            SELECT jsonb_build_object('id', s.id, 'answers', s.answers, 'created_at', s.created_at)
            FROM campus_events.submissions s
            WHERE s.event_id = e.id AND s.user_id = v_user_uuid
        ) AS user_submission
    FROM campus_events.events e
    LEFT JOIN public.users cu ON e.added_by_id = cu.id
    WHERE e.id = event_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. add_event
DROP FUNCTION IF EXISTS campus_events.add_event(TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION campus_events.add_event(
    title_param TEXT,
    description_param TEXT,
    university_param TEXT,
    location_param TEXT,
    event_date_param TIMESTAMP WITH TIME ZONE,
    image_url_param TEXT,
    organizer_club_param TEXT,
    added_by_clerk_id_param TEXT,
    business_id_param TEXT DEFAULT NULL,
    category_param TEXT DEFAULT NULL,
    has_form_param BOOLEAN DEFAULT FALSE,
    form_questions_param JSONB DEFAULT '[]'::jsonb
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
        added_by_id,
        business_id,
        category,
        has_form,
        form_questions
    ) VALUES (
        title_param,
        description_param,
        university_param,
        location_param,
        event_date_param,
        image_url_param,
        organizer_club_param,
        v_added_by_uuid,
        business_id_param,
        category_param,
        has_form_param,
        form_questions_param
    )
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. update_event
DROP FUNCTION IF EXISTS campus_events.update_event(UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT, BOOLEAN, JSONB);
CREATE OR REPLACE FUNCTION campus_events.update_event(
    event_id_param UUID,
    title_param TEXT,
    description_param TEXT,
    university_param TEXT,
    location_param TEXT,
    event_date_param TIMESTAMP WITH TIME ZONE,
    image_url_param TEXT,
    organizer_club_param TEXT,
    category_param TEXT DEFAULT NULL,
    has_form_param BOOLEAN DEFAULT FALSE,
    form_questions_param JSONB DEFAULT '[]'::jsonb
)
RETURNS campus_events.events AS $$
DECLARE
    v_result campus_events.events;
BEGIN
    UPDATE campus_events.events
    SET title = title_param,
        description = description_param,
        university = university_param,
        location = location_param,
        event_date = event_date_param,
        image_url = image_url_param,
        organizer_club = organizer_club_param,
        category = category_param,
        has_form = has_form_param,
        form_questions = form_questions_param
    WHERE id = event_id_param
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. submit_form
CREATE OR REPLACE FUNCTION campus_events.submit_form(
    clerk_id_param TEXT,
    event_id_param UUID,
    answers_param JSONB
)
RETURNS campus_events.submissions AS $$
DECLARE
    v_user_uuid UUID;
    v_result campus_events.submissions;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

    INSERT INTO campus_events.submissions (
        event_id,
        user_id,
        answers
    ) VALUES (
        event_id_param,
        v_user_uuid,
        answers_param
    )
    ON CONFLICT (event_id, user_id)
    DO UPDATE SET 
        answers = EXCLUDED.answers,
        created_at = NOW()
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. get_submissions
CREATE OR REPLACE FUNCTION campus_events.get_submissions(
    event_id_param UUID
)
RETURNS TABLE (
    id UUID,
    event_id UUID,
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    answers JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.event_id,
        s.user_id,
        u.username,
        u.avatar_url,
        s.answers,
        s.created_at
    FROM campus_events.submissions s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.event_id = event_id_param
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA campus_events TO anon, authenticated, service_role;
