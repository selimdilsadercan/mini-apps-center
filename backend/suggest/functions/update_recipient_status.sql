DROP FUNCTION IF EXISTS suggest.update_recipient_status(TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION suggest.update_recipient_status(
    recipient_clerk_id_param TEXT,
    suggestion_id_param UUID,
    status_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated INT;
BEGIN
    UPDATE suggest.recipients
    SET status = status_param,
        updated_at = NOW()
    WHERE recipient_clerk_id = recipient_clerk_id_param
      AND suggestion_id = suggestion_id_param;
      
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
