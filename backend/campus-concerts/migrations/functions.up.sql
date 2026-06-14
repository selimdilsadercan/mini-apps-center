-- CampusConcerts RPC Functions

-- 1. get_concerts
DROP FUNCTION IF EXISTS campus_concerts.get_concerts(TEXT);
CREATE OR REPLACE FUNCTION campus_concerts.get_concerts(clerk_id_param TEXT)
RETURNS TABLE (
    id UUID,
    artist TEXT,
    campus TEXT,
    date DATE,
    description TEXT,
    image_url TEXT,
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
        c.id,
        c.artist,
        c.campus,
        c.date,
        c.description,
        c.image_url,
        c.added_by_id,
        cu.username AS creator_username,
        cu.avatar_url AS creator_avatar,
        c.created_at,
        (
            SELECT att.status 
            FROM campus_concerts.attendance att 
            WHERE att.concert_id = c.id AND att.user_id = v_user_uuid
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
                FROM campus_concerts.attendance att
                JOIN public.users u ON att.user_id = u.id
                WHERE att.concert_id = c.id
            ),
            '[]'::jsonb
        ) AS attendees
    FROM campus_concerts.concerts c
    LEFT JOIN public.users cu ON c.added_by_id = cu.id
    ORDER BY c.date DESC, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. add_concert
DROP FUNCTION IF EXISTS campus_concerts.add_concert(TEXT, TEXT, DATE, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION campus_concerts.add_concert(
    artist_param TEXT,
    campus_param TEXT,
    date_param DATE,
    description_param TEXT,
    image_url_param TEXT,
    added_by_clerk_id_param TEXT
)
RETURNS TABLE (
    id UUID,
    artist TEXT,
    campus TEXT,
    date DATE,
    description TEXT,
    image_url TEXT,
    added_by_id UUID,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_added_by_uuid UUID;
BEGIN
    v_added_by_uuid := public.get_internal_user_id(added_by_clerk_id_param);

    RETURN QUERY
    INSERT INTO campus_concerts.concerts (
        artist,
        campus,
        date,
        description,
        image_url,
        added_by_id
    ) VALUES (
        artist_param,
        campus_param,
        date_param,
        description_param,
        image_url_param,
        v_added_by_uuid
    )
    RETURNING 
        campus_concerts.concerts.id,
        campus_concerts.concerts.artist,
        campus_concerts.concerts.campus,
        campus_concerts.concerts.date,
        campus_concerts.concerts.description,
        campus_concerts.concerts.image_url,
        campus_concerts.concerts.added_by_id,
        campus_concerts.concerts.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. set_attendance
DROP FUNCTION IF EXISTS campus_concerts.set_attendance(TEXT, UUID, TEXT);
CREATE OR REPLACE FUNCTION campus_concerts.set_attendance(
    clerk_id_param TEXT,
    concert_id_param UUID,
    status_param TEXT
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    concert_id UUID,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_uuid UUID;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

    IF status_param IS NULL OR status_param = 'none' OR status_param = '' THEN
        RETURN QUERY
        DELETE FROM campus_concerts.attendance
        WHERE campus_concerts.attendance.user_id = v_user_uuid AND campus_concerts.attendance.concert_id = concert_id_param
        RETURNING 
            campus_concerts.attendance.id,
            campus_concerts.attendance.user_id,
            campus_concerts.attendance.concert_id,
            campus_concerts.attendance.status,
            campus_concerts.attendance.created_at;
    ELSE
        RETURN QUERY
        INSERT INTO campus_concerts.attendance (
            user_id,
            concert_id,
            status
        ) VALUES (
            v_user_uuid,
            concert_id_param,
            status_param
        )
        ON CONFLICT (user_id, concert_id)
        DO UPDATE SET 
            status = EXCLUDED.status,
            created_at = NOW()
        RETURNING 
            campus_concerts.attendance.id,
            campus_concerts.attendance.user_id,
            campus_concerts.attendance.concert_id,
            campus_concerts.attendance.status,
            campus_concerts.attendance.created_at;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA campus_concerts TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_concerts GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
