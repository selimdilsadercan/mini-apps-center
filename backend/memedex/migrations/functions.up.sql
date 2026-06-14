-- FUNCTIONS
-- 1. memedex.get_memes
-- 2. memedex.create_meme
-- 3. memedex.like_meme
-- 4. memedex.update_meme
-- 5. memedex.delete_meme

-- 1. Get Memes
DROP FUNCTION IF EXISTS memedex.get_memes(TEXT, TEXT, TEXT, UUID, BOOLEAN, INT, INT);
DROP FUNCTION IF EXISTS memedex.get_memes(TEXT, TEXT, TEXT, UUID, BOOLEAN, INT, INT, TEXT);

CREATE OR REPLACE FUNCTION memedex.get_memes(
    search_param TEXT DEFAULT '',
    tag_param TEXT DEFAULT '',
    trend_param TEXT DEFAULT '',
    parent_id_param UUID DEFAULT NULL,
    only_parents_param BOOLEAN DEFAULT TRUE,
    limit_param INT DEFAULT 32,
    offset_param INT DEFAULT 0,
    clerk_id_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    context TEXT,
    example TEXT,
    trend_status TEXT,
    media_url TEXT,
    tags TEXT[],
    likes_count INT,
    creator_id UUID,
    creator_username TEXT,
    creator_avatar TEXT,
    created_at TIMESTAMPTZ,
    parent_id UUID,
    is_liked BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.description,
        m.context,
        m.example,
        m.trend_status,
        m.media_url,
        m.tags,
        m.likes_count,
        m.creator_id,
        u.username AS creator_username,
        u.avatar_url AS creator_avatar,
        m.created_at,
        m.parent_id,
        EXISTS (SELECT 1 FROM memedex.likes l WHERE l.meme_id = m.id AND l.user_id = v_user_id) AS is_liked
    FROM memedex.memes m
    LEFT JOIN public.users u ON m.creator_id = u.id
    WHERE 
        (search_param = '' OR m.title ILIKE '%' || search_param || '%' OR m.description ILIKE '%' || search_param || '%')
        AND (tag_param = '' OR tag_param = ANY(m.tags))
        AND (trend_param = '' OR m.trend_status = trend_param)
        AND (
            (parent_id_param IS NOT NULL AND m.parent_id = parent_id_param)
            OR (parent_id_param IS NULL AND (NOT only_parents_param OR m.parent_id IS NULL))
        )
    ORDER BY m.likes_count DESC, m.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Meme
DROP FUNCTION IF EXISTS memedex.create_meme(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, UUID);
CREATE OR REPLACE FUNCTION memedex.create_meme(
    title_param TEXT,
    description_param TEXT DEFAULT '',
    context_param TEXT DEFAULT '',
    example_param TEXT DEFAULT '',
    trend_status_param TEXT DEFAULT 'Trending',
    media_url_param TEXT DEFAULT '',
    tags_param TEXT[] DEFAULT '{}',
    clerk_id_param TEXT DEFAULT NULL,
    parent_id_param UUID DEFAULT NULL
)
RETURNS memedex.memes AS $$
DECLARE
    v_user_id UUID;
    v_result memedex.memes;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    INSERT INTO memedex.memes (
        title,
        description,
        context,
        example,
        trend_status,
        media_url,
        tags,
        creator_id,
        parent_id
    ) VALUES (
        title_param,
        description_param,
        context_param,
        example_param,
        trend_status_param,
        media_url_param,
        tags_param,
        v_user_id,
        parent_id_param
    )
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Like Meme
DROP FUNCTION IF EXISTS memedex.like_meme(UUID);
DROP FUNCTION IF EXISTS memedex.like_meme(UUID, TEXT);
CREATE OR REPLACE FUNCTION memedex.like_meme(
    id_param UUID,
    clerk_id_param TEXT
)
RETURNS INT AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT EXISTS (SELECT 1 FROM memedex.likes WHERE user_id = v_user_id AND meme_id = id_param) INTO v_exists;

    IF v_exists THEN
        DELETE FROM memedex.likes WHERE user_id = v_user_id AND meme_id = id_param;
        UPDATE memedex.memes SET likes_count = GREATEST(0, likes_count - 1) WHERE id = id_param;
    ELSE
        INSERT INTO memedex.likes (user_id, meme_id) VALUES (v_user_id, id_param);
        UPDATE memedex.memes SET likes_count = likes_count + 1 WHERE id = id_param;
    END IF;
    
    RETURN (SELECT likes_count FROM memedex.memes WHERE id = id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update Meme
DROP FUNCTION IF EXISTS memedex.update_meme(UUID, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION memedex.update_meme(
    id_param UUID,
    title_param TEXT,
    trend_status_param TEXT,
    media_url_param TEXT
)
RETURNS memedex.memes AS $$
DECLARE
    v_result memedex.memes;
BEGIN
    UPDATE memedex.memes
    SET 
        title = title_param,
        trend_status = trend_status_param,
        media_url = media_url_param
    WHERE id = id_param
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Delete Meme
DROP FUNCTION IF EXISTS memedex.delete_meme(UUID);
CREATE OR REPLACE FUNCTION memedex.delete_meme(
    id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM memedex.memes
    WHERE id = id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
