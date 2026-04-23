-- Drop old function
DROP FUNCTION IF EXISTS public.tournament_fill_mock_players(TEXT);
DROP FUNCTION IF EXISTS tournament.fill_mock_players(TEXT);

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
    -- Avatar options to match frontend AVATAR_OPTIONS
    v_skins TEXT[] := ARRAY['f8d25c', 'ffdbb4', 'edb98a', 'd08b5b', 'ae5d29', '614335'];
    v_tops TEXT[] := ARRAY['bigHair', 'bob', 'bun', 'curly', 'curvy', 'dreads', 'frida', 'fro', 'shaggy', 'shortFlat', 'shortRound', 'sides'];
    v_mouths TEXT[] := ARRAY['concerned', 'default', 'disbelief', 'eating', 'grimace', 'sad', 'serious', 'smile', 'tongue'];
    v_eyes TEXT[] := ARRAY['closed', 'cry', 'default', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'wink'];
    v_clothing TEXT[] := ARRAY['blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtCrewNeck'];
    
    v_skin TEXT;
    v_top TEXT;
    v_mouth TEXT;
    v_eye TEXT;
    v_cloth TEXT;
    v_avatar_url TEXT;
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
        -- Randomize avatar parts
        v_skin := v_skins[floor(random() * array_length(v_skins, 1)) + 1];
        v_top := v_tops[floor(random() * array_length(v_tops, 1)) + 1];
        v_mouth := v_mouths[floor(random() * array_length(v_mouths, 1)) + 1];
        v_eye := v_eyes[floor(random() * array_length(v_eyes, 1)) + 1];
        v_cloth := v_clothing[floor(random() * array_length(v_clothing, 1)) + 1];
        
        -- Build URL with params matching frontend parser
        v_avatar_url := 'https://api.dicebear.com/9.x/avataaars/svg?' || 
                        'skinColor=' || v_skin || 
                        '&top=' || v_top || 
                        '&mouth=' || v_mouth || 
                        '&eyes=' || v_eye || 
                        '&clothing=' || v_cloth || 
                        '&clothesColor=65c9ff' ||
                        '&accessoriesProbability=0';

        INSERT INTO tournament.participants (
            tournament_id, 
            username, 
            avatar
        ) VALUES (
            v_tournament_id,
            v_mock_names[floor(random() * array_length(v_mock_names, 1)) + 1] || '_' || floor(random() * 999)::TEXT,
            v_avatar_url
        );
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
