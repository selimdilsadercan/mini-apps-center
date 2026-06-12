DROP FUNCTION IF EXISTS suggest.mark_suggestion_opened(UUID);

CREATE OR REPLACE FUNCTION suggest.mark_suggestion_opened(
    suggestion_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE suggest.suggestions
    SET opened_at = NOW()
    WHERE id = suggestion_id_param AND opened_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
