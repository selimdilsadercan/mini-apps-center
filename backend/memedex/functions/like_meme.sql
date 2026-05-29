-- Drop old function
DROP FUNCTION IF EXISTS memedex.like_meme(UUID);

-- RPC: Like/Upvote a meme
CREATE OR REPLACE FUNCTION memedex.like_meme(
    id_param UUID
)
RETURNS INT AS $$
DECLARE
    new_likes INT;
BEGIN
    UPDATE memedex.memes
    SET likes_count = likes_count + 1
    WHERE id = id_param
    RETURNING likes_count INTO new_likes;
    
    RETURN new_likes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
