-- ConcertList RPC Functions
-- 1. get_concerts(clerk_id_param TEXT)
-- 2. add_concert(clerk_id_param TEXT, artist_param TEXT, date_param DATE, venue_param TEXT, notes_param TEXT, rating_param INTEGER, friend_ids_param TEXT[], image_url_param TEXT)
-- 3. edit_concert(concert_id_param UUID, clerk_id_param TEXT, artist_param TEXT, date_param DATE, venue_param TEXT, notes_param TEXT, rating_param INTEGER, friend_ids_param TEXT[], image_url_param TEXT)
-- 4. delete_concert(concert_id_param UUID, clerk_id_param TEXT)
-- 5. bulk_import_concerts(clerk_id_param TEXT, p_concerts JSONB)

-- 1. get_concerts
DROP FUNCTION IF EXISTS concert_list.get_concerts(TEXT);
CREATE OR REPLACE FUNCTION concert_list.get_concerts(clerk_id_param TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    creator_username TEXT,
    creator_avatar TEXT,
    artist TEXT,
    date DATE,
    venue TEXT,
    notes TEXT,
    rating INTEGER,
    created_at TIMESTAMPTZ,
    friends JSONB,
    image_url TEXT
) AS $$
DECLARE
    v_user_uuid UUID;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        cu.username AS creator_username,
        cu.avatar_url AS creator_avatar,
        c.artist,
        c.date,
        c.venue,
        c.notes,
        c.rating,
        c.created_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', u.id,
                        'username', u.username,
                        'avatar', u.avatar_url
                    )
                )
                FROM concert_list.concert_friends cf
                JOIN public.users u ON cf.friend_id = u.id
                WHERE cf.concert_id = c.id
            ),
            '[]'::jsonb
        ) AS friends,
        c.image_url
    FROM concert_list.concerts c
    JOIN public.users cu ON c.user_id = cu.id
    WHERE c.user_id = v_user_uuid
       OR EXISTS (
           SELECT 1 FROM concert_list.concert_friends cf
           WHERE cf.concert_id = c.id AND cf.friend_id = v_user_uuid
       )
    ORDER BY c.date DESC, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. add_concert
DROP FUNCTION IF EXISTS concert_list.add_concert(TEXT, TEXT, DATE, TEXT, TEXT, INTEGER, TEXT[], TEXT);
CREATE OR REPLACE FUNCTION concert_list.add_concert(
    clerk_id_param TEXT,
    artist_param TEXT,
    date_param DATE,
    venue_param TEXT,
    notes_param TEXT,
    rating_param INTEGER,
    friend_ids_param TEXT[] DEFAULT '{}'::TEXT[],
    image_url_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    creator_username TEXT,
    creator_avatar TEXT,
    artist TEXT,
    date DATE,
    venue TEXT,
    notes TEXT,
    rating INTEGER,
    created_at TIMESTAMPTZ,
    friends JSONB,
    image_url TEXT
) AS $$
DECLARE
    v_user_uuid UUID;
    v_new_concert_id UUID;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

    INSERT INTO concert_list.concerts (
        user_id, artist, date, venue, notes, rating, image_url
    ) VALUES (
        v_user_uuid, artist_param, date_param, venue_param, notes_param, rating_param, image_url_param
    ) RETURNING concert_list.concerts.id INTO v_new_concert_id;
    
    -- Insert friends
    IF friend_ids_param IS NOT NULL AND array_length(friend_ids_param, 1) > 0 THEN
        INSERT INTO concert_list.concert_friends (concert_id, friend_id)
        SELECT v_new_concert_id, u.id
        FROM public.users u
        WHERE u.clerk_id = ANY(friend_ids_param) OR u.local_clerk_id = ANY(friend_ids_param);
    END IF;

    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        cu.username AS creator_username,
        cu.avatar_url AS creator_avatar,
        c.artist,
        c.date,
        c.venue,
        c.notes,
        c.rating,
        c.created_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', u.id,
                        'username', u.username,
                        'avatar', u.avatar_url
                    )
                )
                FROM concert_list.concert_friends cf
                JOIN public.users u ON cf.friend_id = u.id
                WHERE cf.concert_id = c.id
            ),
            '[]'::jsonb
        ) AS friends,
        c.image_url
    FROM concert_list.concerts c
    JOIN public.users cu ON c.user_id = cu.id
    WHERE c.id = v_new_concert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. edit_concert
DROP FUNCTION IF EXISTS concert_list.edit_concert(UUID, TEXT, TEXT, DATE, TEXT, TEXT, INTEGER, TEXT[], TEXT);
CREATE OR REPLACE FUNCTION concert_list.edit_concert(
    concert_id_param UUID,
    clerk_id_param TEXT,
    artist_param TEXT,
    date_param DATE,
    venue_param TEXT,
    notes_param TEXT,
    rating_param INTEGER,
    friend_ids_param TEXT[] DEFAULT '{}'::TEXT[],
    image_url_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    creator_username TEXT,
    creator_avatar TEXT,
    artist TEXT,
    date DATE,
    venue TEXT,
    notes TEXT,
    rating INTEGER,
    created_at TIMESTAMPTZ,
    friends JSONB,
    image_url TEXT
) AS $$
DECLARE
    v_user_uuid UUID;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

    -- Update concert (only if the caller is the owner)
    UPDATE concert_list.concerts
    SET artist = artist_param,
        date = date_param,
        venue = venue_param,
        notes = notes_param,
        rating = rating_param,
        image_url = image_url_param
    WHERE concerts.id = concert_id_param AND concerts.user_id = v_user_uuid;

    -- Update friends (first delete old associations, then insert new ones)
    -- Only do this if the caller is the owner
    IF FOUND THEN
        DELETE FROM concert_list.concert_friends
        WHERE concert_friends.concert_id = concert_id_param;

        IF friend_ids_param IS NOT NULL AND array_length(friend_ids_param, 1) > 0 THEN
            INSERT INTO concert_list.concert_friends (concert_id, friend_id)
            SELECT concert_id_param, u.id
            FROM public.users u
            WHERE u.clerk_id = ANY(friend_ids_param) OR u.local_clerk_id = ANY(friend_ids_param);
        END IF;
    END IF;

    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        cu.username AS creator_username,
        cu.avatar_url AS creator_avatar,
        c.artist,
        c.date,
        c.venue,
        c.notes,
        c.rating,
        c.created_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', u.id,
                        'username', u.username,
                        'avatar', u.avatar_url
                    )
                )
                FROM concert_list.concert_friends cf
                JOIN public.users u ON cf.friend_id = u.id
                WHERE cf.concert_id = c.id
            ),
            '[]'::jsonb
        ) AS friends,
        c.image_url
    FROM concert_list.concerts c
    JOIN public.users cu ON c.user_id = cu.id
    WHERE c.id = concert_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. delete_concert
DROP FUNCTION IF EXISTS concert_list.delete_concert(UUID, TEXT);
CREATE OR REPLACE FUNCTION concert_list.delete_concert(
    concert_id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_uuid UUID;
    deleted_rows INTEGER;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

    -- If owner, delete the concert
    DELETE FROM concert_list.concerts
    WHERE id = concert_id_param AND user_id = v_user_uuid;
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    
    -- If not owner, try to remove from friends list
    IF deleted_rows = 0 THEN
        DELETE FROM concert_list.concert_friends
        WHERE concert_id = concert_id_param AND friend_id = v_user_uuid;
        GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    END IF;
    
    RETURN deleted_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. bulk_import_concerts
DROP FUNCTION IF EXISTS concert_list.bulk_import_concerts(TEXT, JSONB);
CREATE OR REPLACE FUNCTION concert_list.bulk_import_concerts(
    clerk_id_param TEXT,
    p_concerts JSONB
)
RETURNS INTEGER AS $$
DECLARE
    v_user_uuid UUID;
    v_concert JSONB;
    v_artist TEXT;
    v_date DATE;
    v_venue TEXT;
    v_notes TEXT;
    v_rating INTEGER;
    v_inserted_count INTEGER := 0;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

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
            WHERE user_id = v_user_uuid
              AND LOWER(artist) = LOWER(v_artist)
              AND date = v_date
        ) THEN
            INSERT INTO concert_list.concerts (
                user_id, artist, date, venue, notes, rating
            ) VALUES (
                v_user_uuid, v_artist, v_date, v_venue, v_notes, v_rating
            );
            v_inserted_count := v_inserted_count + 1;
        END IF;
    END LOOP;

    RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
