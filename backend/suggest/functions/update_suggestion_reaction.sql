DROP FUNCTION IF EXISTS suggest.update_suggestion_reaction(UUID, TEXT);

CREATE OR REPLACE FUNCTION suggest.update_suggestion_reaction(
    suggestion_id_param UUID,
    reaction_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE suggest.suggestions
    SET reaction = reaction_param
    WHERE id = suggestion_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
