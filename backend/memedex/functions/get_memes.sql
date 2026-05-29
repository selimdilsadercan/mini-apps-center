-- Drop old function
DROP FUNCTION IF EXISTS memedex.get_memes(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS memedex.get_memes(TEXT, TEXT, TEXT, UUID, BOOLEAN);

-- RPC: Get and search memes
CREATE OR REPLACE FUNCTION memedex.get_memes(
    search_param TEXT DEFAULT '',
    tag_param TEXT DEFAULT '',
    trend_param TEXT DEFAULT '',
    parent_id_param UUID DEFAULT NULL,
    only_parents_param BOOLEAN DEFAULT TRUE
)
RETURNS SETOF memedex.memes AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM memedex.memes
    WHERE 
        (search_param = '' OR title ILIKE '%' || search_param || '%' OR description ILIKE '%' || search_param || '%')
        AND (tag_param = '' OR tag_param = ANY(tags))
        AND (trend_param = '' OR trend_status = trend_param)
        AND (
            (parent_id_param IS NOT NULL AND parent_id = parent_id_param)
            OR (parent_id_param IS NULL AND (NOT only_parents_param OR parent_id IS NULL))
        )
    ORDER BY likes_count DESC, created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
