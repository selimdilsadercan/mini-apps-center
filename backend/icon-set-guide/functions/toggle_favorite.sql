DROP FUNCTION IF EXISTS icon_set_guide.toggle_favorite(TEXT, TEXT);

CREATE OR REPLACE FUNCTION icon_set_guide.toggle_favorite(clerk_id_param TEXT, icon_set_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM icon_set_guide.favorites
        WHERE clerk_id = clerk_id_param AND icon_set_id = icon_set_id_param
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM icon_set_guide.favorites
        WHERE clerk_id = clerk_id_param AND icon_set_id = icon_set_id_param;
        RETURN FALSE;
    ELSE
        INSERT INTO icon_set_guide.favorites (clerk_id, icon_set_id)
        VALUES (clerk_id_param, icon_set_id_param);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
