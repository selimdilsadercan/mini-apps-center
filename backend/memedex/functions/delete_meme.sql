-- Drop old function
DROP FUNCTION IF EXISTS memedex.delete_meme(UUID);

-- RPC: Delete a meme
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
