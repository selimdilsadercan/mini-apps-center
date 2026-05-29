-- Drop old function
DROP FUNCTION IF EXISTS memedex.update_meme(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS memedex.update_meme(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[]);

-- RPC: Update a meme
CREATE OR REPLACE FUNCTION memedex.update_meme(
    id_param UUID,
    title_param TEXT,
    trend_status_param TEXT,
    media_url_param TEXT
)
RETURNS SETOF memedex.memes AS $$
BEGIN
    RETURN QUERY
    UPDATE memedex.memes
    SET 
        title = title_param,
        trend_status = trend_status_param,
        media_url = media_url_param
    WHERE id = id_param
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
