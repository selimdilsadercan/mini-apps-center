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
    added_by_clerk_id TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO campus_concerts.concerts (
        artist,
        campus,
        date,
        description,
        image_url,
        added_by_clerk_id
    ) VALUES (
        artist_param,
        campus_param,
        date_param,
        description_param,
        image_url_param,
        added_by_clerk_id_param
    )
    RETURNING 
        campus_concerts.concerts.id,
        campus_concerts.concerts.artist,
        campus_concerts.concerts.campus,
        campus_concerts.concerts.date,
        campus_concerts.concerts.description,
        campus_concerts.concerts.image_url,
        campus_concerts.concerts.added_by_clerk_id,
        campus_concerts.concerts.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
