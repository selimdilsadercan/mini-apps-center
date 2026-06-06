DROP FUNCTION IF EXISTS campus_concerts.set_attendance(TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION campus_concerts.set_attendance(
    clerk_id_param TEXT,
    concert_id_param UUID,
    status_param TEXT
)
RETURNS TABLE (
    id UUID,
    user_clerk_id TEXT,
    concert_id UUID,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    IF status_param IS NULL OR status_param = 'none' OR status_param = '' THEN
        RETURN QUERY
        DELETE FROM campus_concerts.attendance
        WHERE user_clerk_id = clerk_id_param AND concert_id = concert_id_param
        RETURNING 
            campus_concerts.attendance.id,
            campus_concerts.attendance.user_clerk_id,
            campus_concerts.attendance.concert_id,
            campus_concerts.attendance.status,
            campus_concerts.attendance.created_at;
    ELSE
        RETURN QUERY
        INSERT INTO campus_concerts.attendance (
            user_clerk_id,
            concert_id,
            status
        ) VALUES (
            clerk_id_param,
            concert_id_param,
            status_param
        )
        ON CONFLICT (user_clerk_id, concert_id)
        DO UPDATE SET 
            status = EXCLUDED.status,
            created_at = NOW()
        RETURNING 
            campus_concerts.attendance.id,
            campus_concerts.attendance.user_clerk_id,
            campus_concerts.attendance.concert_id,
            campus_concerts.attendance.status,
            campus_concerts.attendance.created_at;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
