DROP FUNCTION IF EXISTS suggest.update_suggestion_reaction(TEXT, TEXT);
DROP FUNCTION IF EXISTS suggest.update_suggestion_reaction(UUID, TEXT);

CREATE OR REPLACE FUNCTION suggest.update_suggestion_reaction(
    share_id_param TEXT,
    reaction_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE suggest.suggestions
    SET reaction = reaction_param
    WHERE share_id = share_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
