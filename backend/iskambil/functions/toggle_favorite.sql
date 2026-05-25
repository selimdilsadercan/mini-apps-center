-- Drop old function if exists
DROP FUNCTION IF EXISTS iskambil.toggle_favorite(TEXT, TEXT);

-- RPC: Favori durumunu değiştir
CREATE OR REPLACE FUNCTION iskambil.toggle_favorite(game_id_param TEXT, clerk_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    exists_val BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM iskambil.favorites 
        WHERE game_id = game_id_param AND clerk_id = clerk_id_param
    ) INTO exists_val;

    IF exists_val THEN
        DELETE FROM iskambil.favorites 
        WHERE game_id = game_id_param AND clerk_id = clerk_id_param;
        RETURN FALSE;
    ELSE
        INSERT INTO iskambil.favorites (game_id, clerk_id)
        VALUES (game_id_param, clerk_id_param);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
