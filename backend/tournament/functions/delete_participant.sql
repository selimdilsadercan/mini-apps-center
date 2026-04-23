-- Drop old function
DROP FUNCTION IF EXISTS public.tournament_delete_participant(UUID);

-- Delete Participant RPC
CREATE OR REPLACE FUNCTION tournament.delete_participant(participant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM tournament.participants WHERE id = participant_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
