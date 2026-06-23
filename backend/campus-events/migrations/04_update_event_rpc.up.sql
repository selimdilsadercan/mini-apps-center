-- 5. update_event
DROP FUNCTION IF EXISTS campus_events.update_event(UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION campus_events.update_event(
    event_id_param UUID,
    title_param TEXT,
    description_param TEXT,
    university_param TEXT,
    location_param TEXT,
    event_date_param TIMESTAMP WITH TIME ZONE,
    image_url_param TEXT,
    organizer_club_param TEXT,
    category_param TEXT DEFAULT NULL
)
RETURNS campus_events.events AS $$
DECLARE
    v_result campus_events.events;
BEGIN
    UPDATE campus_events.events
    SET title = title_param,
        description = description_param,
        university = university_param,
        location = location_param,
        event_date = event_date_param,
        image_url = image_url_param,
        organizer_club = organizer_club_param,
        category = category_param
    WHERE id = event_id_param
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT ALL ON FUNCTION campus_events.update_event(UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
