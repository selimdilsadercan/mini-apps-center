DROP FUNCTION IF EXISTS tutor_crm.toggle_share(TEXT, BOOLEAN, BOOLEAN);

CREATE OR REPLACE FUNCTION tutor_crm.toggle_share(
    clerk_id_param TEXT,
    is_active_param BOOLEAN,
    allow_student_names_param BOOLEAN
)
RETURNS SETOF tutor_crm.shares AS $$
DECLARE
    v_share tutor_crm.shares;
BEGIN
    INSERT INTO tutor_crm.shares (clerk_id, is_active, allow_student_names)
    VALUES (clerk_id_param, is_active_param, allow_student_names_param)
    ON CONFLICT (clerk_id) DO UPDATE
    SET is_active = is_active_param,
        allow_student_names = allow_student_names_param
    RETURNING * INTO v_share;
    
    RETURN NEXT v_share;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
