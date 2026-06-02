DROP FUNCTION IF EXISTS tutor_crm.get_share_settings(TEXT);

CREATE OR REPLACE FUNCTION tutor_crm.get_share_settings(clerk_id_param TEXT)
RETURNS SETOF tutor_crm.shares AS $$
DECLARE
    v_share tutor_crm.shares;
   BEGIN
    SELECT * INTO v_share FROM tutor_crm.shares WHERE clerk_id = clerk_id_param;
    IF NOT FOUND THEN
        INSERT INTO tutor_crm.shares (clerk_id) VALUES (clerk_id_param) RETURNING * INTO v_share;
    END IF;
    RETURN NEXT v_share;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
