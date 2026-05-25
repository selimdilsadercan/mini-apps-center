-- Drop old function if exists
DROP FUNCTION IF EXISTS iskambil.save_note(TEXT, TEXT, TEXT);

-- RPC: Kişisel notu kaydet veya güncelle
CREATE OR REPLACE FUNCTION iskambil.save_note(game_id_param TEXT, clerk_id_param TEXT, note_param TEXT)
RETURNS TEXT AS $$
BEGIN
    IF note_param IS NULL OR TRIM(note_param) = '' THEN
        DELETE FROM iskambil.notes 
        WHERE game_id = game_id_param AND clerk_id = clerk_id_param;
        RETURN NULL;
    ELSE
        INSERT INTO iskambil.notes (game_id, clerk_id, note, updated_at)
        VALUES (game_id_param, clerk_id_param, note_param, NOW())
        ON CONFLICT (game_id, clerk_id) 
        DO UPDATE SET note = EXCLUDED.note, updated_at = NOW();
        RETURN note_param;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
