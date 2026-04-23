-- Update Participant RPC
CREATE OR REPLACE FUNCTION tournament.update_participant(
    participant_id UUID,
    username_param TEXT,
    avatar_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE tournament.participants
    SET username = username_param,
        avatar = avatar_param
    WHERE id = participant_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
