-- ConcertList RPC Functions (places link + info_url + status planned/attended)

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
    place_id UUID,
    notes TEXT,
    rating INTEGER,
    created_at TIMESTAMPTZ,
    friends JSONB,
    image_url TEXT,
    info_url TEXT,
    status TEXT,
    upcoming_concert_id UUID
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
        COALESCE(p.name, c.venue) AS venue,
        c.place_id,
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
        c.image_url,
        c.info_url,
        c.status,
        c.upcoming_concert_id
    FROM concert_list.concerts c
    JOIN public.users cu ON c.user_id = cu.id
    LEFT JOIN workplaces.places p ON c.place_id = p.id
    WHERE c.user_id = v_user_uuid
       OR EXISTS (
           SELECT 1 FROM concert_list.concert_friends cf
           WHERE cf.concert_id = c.id AND cf.friend_id = v_user_uuid
       )
    ORDER BY c.date DESC, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS concert_list.add_concert(TEXT, TEXT, DATE, TEXT, TEXT, INTEGER, TEXT[], TEXT);
DROP FUNCTION IF EXISTS concert_list.add_concert(TEXT, TEXT, DATE, TEXT, TEXT, INTEGER, TEXT[], TEXT, UUID);
DROP FUNCTION IF EXISTS concert_list.add_concert(TEXT, TEXT, DATE, TEXT, TEXT, INTEGER, TEXT[], TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS concert_list.add_concert(TEXT, TEXT, DATE, TEXT, TEXT, INTEGER, TEXT[], TEXT, UUID, TEXT, TEXT, UUID);
CREATE OR REPLACE FUNCTION concert_list.add_concert(
    clerk_id_param TEXT,
    artist_param TEXT,
    date_param DATE,
    venue_param TEXT,
    notes_param TEXT,
    rating_param INTEGER,
    friend_ids_param TEXT[] DEFAULT '{}'::TEXT[],
    image_url_param TEXT DEFAULT NULL,
    place_id_param UUID DEFAULT NULL,
    info_url_param TEXT DEFAULT NULL,
    status_param TEXT DEFAULT 'attended',
    upcoming_concert_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    creator_username TEXT,
    creator_avatar TEXT,
    artist TEXT,
    date DATE,
    venue TEXT,
    place_id UUID,
    notes TEXT,
    rating INTEGER,
    created_at TIMESTAMPTZ,
    friends JSONB,
    image_url TEXT,
    info_url TEXT,
    status TEXT,
    upcoming_concert_id UUID
) AS $$
#variable_conflict use_column
DECLARE
    v_user_uuid UUID;
    v_new_concert_id UUID;
    v_venue TEXT;
    v_status TEXT;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);
    v_status := COALESCE(NULLIF(status_param, ''), 'attended');
    IF v_status NOT IN ('planned', 'attended') THEN
        v_status := 'attended';
    END IF;

    IF place_id_param IS NOT NULL THEN
        SELECT p.name INTO v_venue FROM workplaces.places p WHERE p.id = place_id_param;
    END IF;
    v_venue := COALESCE(v_venue, venue_param);

    INSERT INTO concert_list.concerts (
        user_id, artist, date, venue, place_id, notes, rating, image_url, info_url, status, upcoming_concert_id
    ) VALUES (
        v_user_uuid, artist_param, date_param, v_venue, place_id_param, notes_param, rating_param,
        image_url_param, info_url_param, v_status, upcoming_concert_id_param
    ) RETURNING concert_list.concerts.id INTO v_new_concert_id;

    IF friend_ids_param IS NOT NULL AND array_length(friend_ids_param, 1) > 0 THEN
        INSERT INTO concert_list.concert_friends (concert_id, friend_id)
        SELECT v_new_concert_id, u.id
        FROM public.users u
        WHERE u.clerk_id = ANY(friend_ids_param) OR u.local_clerk_id = ANY(friend_ids_param);
    END IF;

    RETURN QUERY
    SELECT
        c.id, c.user_id, cu.username, cu.avatar_url, c.artist, c.date,
        COALESCE(p.name, c.venue), c.place_id, c.notes, c.rating, c.created_at,
        COALESCE(
            (
                SELECT jsonb_agg(jsonb_build_object('id', u.id, 'username', u.username, 'avatar', u.avatar_url))
                FROM concert_list.concert_friends cf
                JOIN public.users u ON cf.friend_id = u.id
                WHERE cf.concert_id = c.id
            ), '[]'::jsonb
        ),
        c.image_url, c.info_url, c.status, c.upcoming_concert_id
    FROM concert_list.concerts c
    JOIN public.users cu ON c.user_id = cu.id
    LEFT JOIN workplaces.places p ON c.place_id = p.id
    WHERE c.id = v_new_concert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS concert_list.edit_concert(UUID, TEXT, TEXT, DATE, TEXT, TEXT, INTEGER, TEXT[], TEXT);
DROP FUNCTION IF EXISTS concert_list.edit_concert(UUID, TEXT, TEXT, DATE, TEXT, TEXT, INTEGER, TEXT[], TEXT, UUID);
DROP FUNCTION IF EXISTS concert_list.edit_concert(UUID, TEXT, TEXT, DATE, TEXT, TEXT, INTEGER, TEXT[], TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS concert_list.edit_concert(UUID, TEXT, TEXT, DATE, TEXT, TEXT, INTEGER, TEXT[], TEXT, UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION concert_list.edit_concert(
    concert_id_param UUID,
    clerk_id_param TEXT,
    artist_param TEXT,
    date_param DATE,
    venue_param TEXT,
    notes_param TEXT,
    rating_param INTEGER,
    friend_ids_param TEXT[] DEFAULT '{}'::TEXT[],
    image_url_param TEXT DEFAULT NULL,
    place_id_param UUID DEFAULT NULL,
    info_url_param TEXT DEFAULT NULL,
    status_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    creator_username TEXT,
    creator_avatar TEXT,
    artist TEXT,
    date DATE,
    venue TEXT,
    place_id UUID,
    notes TEXT,
    rating INTEGER,
    created_at TIMESTAMPTZ,
    friends JSONB,
    image_url TEXT,
    info_url TEXT,
    status TEXT,
    upcoming_concert_id UUID
) AS $$
#variable_conflict use_column
DECLARE
    v_user_uuid UUID;
    v_venue TEXT;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

    IF place_id_param IS NOT NULL THEN
        SELECT p.name INTO v_venue FROM workplaces.places p WHERE p.id = place_id_param;
    END IF;
    v_venue := COALESCE(v_venue, venue_param);

    UPDATE concert_list.concerts
    SET artist = artist_param,
        date = date_param,
        venue = v_venue,
        place_id = place_id_param,
        notes = notes_param,
        rating = rating_param,
        image_url = image_url_param,
        info_url = info_url_param,
        status = COALESCE(NULLIF(status_param, ''), concerts.status)
    WHERE concerts.id = concert_id_param AND concerts.user_id = v_user_uuid;

    IF FOUND THEN
        DELETE FROM concert_list.concert_friends WHERE concert_friends.concert_id = concert_id_param;

        IF friend_ids_param IS NOT NULL AND array_length(friend_ids_param, 1) > 0 THEN
            INSERT INTO concert_list.concert_friends (concert_id, friend_id)
            SELECT concert_id_param, u.id
            FROM public.users u
            WHERE u.clerk_id = ANY(friend_ids_param) OR u.local_clerk_id = ANY(friend_ids_param);
        END IF;
    END IF;

    RETURN QUERY
    SELECT
        c.id, c.user_id, cu.username, cu.avatar_url, c.artist, c.date,
        COALESCE(p.name, c.venue), c.place_id, c.notes, c.rating, c.created_at,
        COALESCE(
            (
                SELECT jsonb_agg(jsonb_build_object('id', u.id, 'username', u.username, 'avatar', u.avatar_url))
                FROM concert_list.concert_friends cf
                JOIN public.users u ON cf.friend_id = u.id
                WHERE cf.concert_id = c.id
            ), '[]'::jsonb
        ),
        c.image_url, c.info_url, c.status, c.upcoming_concert_id
    FROM concert_list.concerts c
    JOIN public.users cu ON c.user_id = cu.id
    LEFT JOIN workplaces.places p ON c.place_id = p.id
    WHERE c.id = concert_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

    DELETE FROM concert_list.concerts
    WHERE concerts.id = concert_id_param AND concerts.user_id = v_user_uuid;

    GET DIAGNOSTICS deleted_rows = ROW_COUNT;

    IF deleted_rows = 0 THEN
        DELETE FROM concert_list.concert_friends
        WHERE concert_id = concert_id_param AND friend_id = v_user_uuid;
        GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    END IF;

    RETURN deleted_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    v_place_id UUID;
    v_notes TEXT;
    v_rating INTEGER;
    v_info_url TEXT;
    v_inserted_count INTEGER := 0;
BEGIN
    v_user_uuid := public.get_internal_user_id(clerk_id_param);

    FOR v_concert IN SELECT * FROM jsonb_array_elements(p_concerts)
    LOOP
        v_artist := v_concert->>'artist';
        v_date := (v_concert->>'date')::DATE;
        v_venue := v_concert->>'venue';
        v_place_id := NULLIF(v_concert->>'place_id', '')::UUID;
        v_notes := v_concert->>'notes';
        v_rating := (v_concert->>'rating')::INTEGER;
        v_info_url := NULLIF(v_concert->>'info_url', '');

        IF v_place_id IS NOT NULL THEN
            SELECT p.name INTO v_venue FROM workplaces.places p WHERE p.id = v_place_id;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM concert_list.concerts
            WHERE user_id = v_user_uuid
              AND LOWER(artist) = LOWER(v_artist)
              AND date = v_date
              AND status = 'attended'
        ) THEN
            INSERT INTO concert_list.concerts (
                user_id, artist, date, venue, place_id, notes, rating, info_url, status
            ) VALUES (
                v_user_uuid, v_artist, v_date, v_venue, v_place_id, v_notes, v_rating, v_info_url, 'attended'
            );
            v_inserted_count := v_inserted_count + 1;
        END IF;
    END LOOP;

    RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
