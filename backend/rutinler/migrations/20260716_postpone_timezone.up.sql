DROP FUNCTION IF EXISTS rutinler.postpone_entry(UUID, TEXT);
CREATE OR REPLACE FUNCTION rutinler.postpone_entry(
    entry_id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_tomorrow_istanbul DATE;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    v_tomorrow_istanbul := ((NOW() AT TIME ZONE 'Europe/Istanbul')::date + INTERVAL '1 day')::date;

    UPDATE rutinler.entries
    SET postponed_until = (v_tomorrow_istanbul::timestamp AT TIME ZONE 'Europe/Istanbul')
    WHERE id = entry_id_param AND user_id = v_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
