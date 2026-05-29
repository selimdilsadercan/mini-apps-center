-- Drop old function
DROP FUNCTION IF EXISTS memedex.create_meme(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT);
DROP FUNCTION IF EXISTS memedex.create_meme(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, UUID);

-- RPC: Create a new meme
CREATE OR REPLACE FUNCTION memedex.create_meme(
    title_param TEXT,
    description_param TEXT DEFAULT '',
    context_param TEXT DEFAULT '',
    example_param TEXT DEFAULT '',
    trend_status_param TEXT DEFAULT 'Trending',
    media_url_param TEXT DEFAULT '',
    tags_param TEXT[] DEFAULT '{}',
    created_by_param TEXT DEFAULT 'Anonymous',
    parent_id_param UUID DEFAULT NULL
)
RETURNS SETOF memedex.memes AS $$
BEGIN
    RETURN QUERY
    INSERT INTO memedex.memes (
        title,
        description,
        context,
        example,
        trend_status,
        media_url,
        tags,
        created_by,
        parent_id
    ) VALUES (
        title_param,
        description_param,
        context_param,
        example_param,
        trend_status_param,
        media_url_param,
        tags_param,
        COALESCE(created_by_param, 'Anonymous'),
        parent_id_param
    )
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
