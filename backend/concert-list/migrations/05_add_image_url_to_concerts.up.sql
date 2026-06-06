ALTER TABLE concert_list.concerts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Recreate functions with image_url support
DROP FUNCTION IF EXISTS concert_list.get_concerts(TEXT);
CREATE OR REPLACE FUNCTION concert_list.get_concerts(clerk_id_param TEXT)
RETURNS TABLE (
    id UUID,
    user_clerk_id TEXT,
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
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.user_clerk_id,
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
                        'id', u.clerk_id,
                        'username', u.username,
                        'avatar', u.avatar_url
                    )
                )
                FROM concert_list.concert_friends cf
                JOIN public.users u ON cf.friend_clerk_id = u.clerk_id
                WHERE cf.concert_id = c.id
            ),
            '[]'::jsonb
        ) AS friends,
        c.image_url
    FROM concert_list.concerts c
    JOIN public.users cu ON c.user_clerk_id = cu.clerk_id
    WHERE c.user_clerk_id = clerk_id_param
       OR EXISTS (
           SELECT 1 FROM concert_list.concert_friends cf
           WHERE cf.concert_id = c.id AND cf.friend_clerk_id = clerk_id_param
       )
    ORDER BY c.date DESC, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP FUNCTION IF EXISTS concert_list.add_concert(TEXT, TEXT, DATE, TEXT, TEXT, INTEGER, TEXT[]);
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
    user_clerk_id TEXT,
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
    v_new_concert_id UUID;
BEGIN
    INSERT INTO concert_list.concerts (
        user_clerk_id, artist, date, venue, notes, rating, image_url
    ) VALUES (
        clerk_id_param, artist_param, date_param, venue_param, notes_param, rating_param, image_url_param
    ) RETURNING concert_list.concerts.id INTO v_new_concert_id;
    
    -- Insert friends
    IF friend_ids_param IS NOT NULL AND array_length(friend_ids_param, 1) > 0 THEN
        INSERT INTO concert_list.concert_friends (concert_id, friend_clerk_id)
        SELECT v_new_concert_id, unnest(friend_ids_param);
    END IF;

    RETURN QUERY
    SELECT 
        c.id,
        c.user_clerk_id,
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
                        'id', u.clerk_id,
                        'username', u.username,
                        'avatar', u.avatar_url
                    )
                )
                FROM concert_list.concert_friends cf
                JOIN public.users u ON cf.friend_clerk_id = u.clerk_id
                WHERE cf.concert_id = c.id
            ),
            '[]'::jsonb
        ) AS friends,
        c.image_url
    FROM concert_list.concerts c
    JOIN public.users cu ON c.user_clerk_id = cu.clerk_id
    WHERE c.id = v_new_concert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP FUNCTION IF EXISTS concert_list.edit_concert(UUID, TEXT, TEXT, DATE, TEXT, TEXT, INTEGER, TEXT[]);
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
    user_clerk_id TEXT,
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
BEGIN
    -- Update concert (only if the caller is the owner)
    UPDATE concert_list.concerts
    SET artist = artist_param,
        date = date_param,
        venue = venue_param,
        notes = notes_param,
        rating = rating_param,
        image_url = image_url_param
    WHERE concerts.id = concert_id_param AND concerts.user_clerk_id = clerk_id_param;

    -- Update friends (first delete old associations, then insert new ones)
    -- Only do this if the caller is the owner
    IF FOUND THEN
        DELETE FROM concert_list.concert_friends
        WHERE concert_friends.concert_id = concert_id_param;

        IF friend_ids_param IS NOT NULL AND array_length(friend_ids_param, 1) > 0 THEN
            INSERT INTO concert_list.concert_friends (concert_id, friend_clerk_id)
            SELECT concert_id_param, unnest(friend_ids_param);
        END IF;
    END IF;

    RETURN QUERY
    SELECT 
        c.id,
        c.user_clerk_id,
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
                        'id', u.clerk_id,
                        'username', u.username,
                        'avatar', u.avatar_url
                    )
                )
                FROM concert_list.concert_friends cf
                JOIN public.users u ON cf.friend_clerk_id = u.clerk_id
                WHERE cf.concert_id = c.id
            ),
            '[]'::jsonb
        ) AS friends,
        c.image_url
    FROM concert_list.concerts c
    JOIN public.users cu ON c.user_clerk_id = cu.clerk_id
    WHERE c.id = concert_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
