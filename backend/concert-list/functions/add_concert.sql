DROP FUNCTION IF EXISTS concert_list.add_concert(TEXT, TEXT, DATE, TEXT, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION concert_list.add_concert(
    clerk_id_param TEXT,
    artist_param TEXT,
    date_param DATE,
    venue_param TEXT,
    notes_param TEXT,
    rating_param INTEGER
)
RETURNS SETOF concert_list.concerts AS $$
DECLARE
    v_new_concert concert_list.concerts;
BEGIN
    INSERT INTO concert_list.concerts (
        user_clerk_id, artist, date, venue, notes, rating
    ) VALUES (
        clerk_id_param, artist_param, date_param, venue_param, notes_param, rating_param
    ) RETURNING * INTO v_new_concert;
    
    RETURN NEXT v_new_concert;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
