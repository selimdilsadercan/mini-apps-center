DROP FUNCTION IF EXISTS suggest.delete_sent_suggestion(TEXT, TEXT);

CREATE OR REPLACE FUNCTION suggest.delete_sent_suggestion(
    sender_clerk_id_param TEXT,
    share_id_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE suggest.suggestions
    SET sender_deleted_at = NOW()
    WHERE sender_clerk_id = sender_clerk_id_param AND share_id = share_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
