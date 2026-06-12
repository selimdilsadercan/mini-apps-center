DROP FUNCTION IF EXISTS suggest.update_recipient_status(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS suggest.update_recipient_status(TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION suggest.update_recipient_status(
    recipient_clerk_id_param TEXT,
    share_id_param TEXT,
    status_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_suggestion_id UUID;
    v_updated INT;
BEGIN
    SELECT id INTO v_suggestion_id FROM suggest.suggestions WHERE share_id = share_id_param;
    IF v_suggestion_id IS NULL THEN
        RETURN FALSE;
    END IF;

    UPDATE suggest.recipients
    SET status = status_param,
        updated_at = NOW()
    WHERE recipient_clerk_id = recipient_clerk_id_param
      AND suggestion_id = v_suggestion_id;
      
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
