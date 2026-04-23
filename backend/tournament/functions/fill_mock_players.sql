-- Drop old function
DROP FUNCTION IF EXISTS public.tournament_fill_mock_players(TEXT);

-- Fill Tournament with Mock Players RPC
CREATE OR REPLACE FUNCTION tournament.fill_mock_players(slug_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_tournament_id UUID;
    v_capacity INTEGER;
    v_current_count INTEGER;
    v_remaining INTEGER;
    v_mock_names TEXT[] := ARRAY[
        'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet',
        'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango',
        'Uniform', 'Victor', 'Whiskey', 'X-ray', 'Yankee', 'Zulu', 'Maverick', 'Goose', 'Iceman', 'Viper',
        'Phoenix', 'Rooster', 'Bob', 'Hangman', 'Coyote', 'Payback', 'Fanboy'
    ];
BEGIN
    -- Get tournament info
    SELECT id, capacity INTO v_tournament_id, v_capacity 
    FROM tournament.tournaments 
    WHERE slug = slug_param;

    IF v_tournament_id IS NULL THEN
        RAISE EXCEPTION 'Tournament not found';
    END IF;

    -- Count current participants
    SELECT COUNT(*) INTO v_current_count 
    FROM tournament.participants 
    WHERE tournament_id = v_tournament_id;

    v_remaining := v_capacity - v_current_count;

    IF v_remaining <= 0 THEN
        RETURN TRUE;
    END IF;

    -- Insert mock participants
    FOR i IN 1..v_remaining LOOP
        INSERT INTO tournament.participants (
            tournament_id, 
            username, 
            avatar
        ) VALUES (
            v_tournament_id,
            v_mock_names[floor(random() * array_length(v_mock_names, 1)) + 1] || '_' || floor(random() * 999)::TEXT,
            'https://api.dicebear.com/7.x/avataaars/svg?seed=' || md5(random()::text)
        );
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
