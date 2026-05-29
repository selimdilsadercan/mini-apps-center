DROP FUNCTION IF EXISTS concert_list.bulk_import_concerts(TEXT, JSONB);

CREATE OR REPLACE FUNCTION concert_list.bulk_import_concerts(
    clerk_id_param TEXT,
    p_concerts JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_concert JSONB;
    v_artist TEXT;
    v_date DATE;
    v_venue TEXT;
    v_notes TEXT;
    v_rating INTEGER;
    v_inserted_count INTEGER := 0;
BEGIN
    FOR v_concert IN SELECT * FROM jsonb_array_elements(p_concerts)
    LOOP
        v_artist := v_concert->>'artist';
        v_date := (v_concert->>'date')::DATE;
        v_venue := v_concert->>'venue';
        v_notes := v_concert->>'notes';
        v_rating := (v_concert->>'rating')::INTEGER;

        -- Prevent duplicates: check if same artist on same date exists for this user
        IF NOT EXISTS (
            SELECT 1 FROM concert_list.concerts
            WHERE user_clerk_id = clerk_id_param
              AND LOWER(artist) = LOWER(v_artist)
              AND date = v_date
        ) THEN
            INSERT INTO concert_list.concerts (
                user_clerk_id, artist, date, venue, notes, rating
            ) VALUES (
                clerk_id_param, v_artist, v_date, v_venue, v_notes, v_rating
            );
            v_inserted_count := v_inserted_count + 1;
        END IF;
    END LOOP;

    RETURN v_inserted_count;
END;
$$;
