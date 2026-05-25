-- Drop old function if exists
DROP FUNCTION IF EXISTS iskambil.get_games(TEXT);

-- RPC: Oyunları kullanıcıya özel favori ve not bilgisiyle getir
CREATE OR REPLACE FUNCTION iskambil.get_games(clerk_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    rules JSONB,
    min_players INT,
    max_players INT,
    deck_count TEXT,
    category TEXT,
    is_favorite BOOLEAN,
    user_note TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.name,
        g.description,
        g.rules,
        g.min_players,
        g.max_players,
        g.deck_count,
        g.category,
        COALESCE(EXISTS (
            SELECT 1 FROM iskambil.favorites f 
            WHERE f.game_id = g.id AND f.clerk_id = clerk_id_param
        ), FALSE) AS is_favorite,
        n.note AS user_note
    FROM iskambil.games g
    LEFT JOIN iskambil.notes n ON n.game_id = g.id AND n.clerk_id = clerk_id_param
    ORDER BY g.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
