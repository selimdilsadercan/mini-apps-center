DROP FUNCTION IF EXISTS suggest.mark_suggestion_opened(TEXT);
DROP FUNCTION IF EXISTS suggest.mark_suggestion_opened(UUID);

CREATE OR REPLACE FUNCTION suggest.mark_suggestion_opened(
    share_id_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE suggest.suggestions
    SET opened_at = NOW()
    WHERE share_id = share_id_param AND opened_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
