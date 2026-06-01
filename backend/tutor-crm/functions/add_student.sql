DROP FUNCTION IF EXISTS tutor_crm.add_student(TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL);

CREATE OR REPLACE FUNCTION tutor_crm.add_student(
    clerk_id_param TEXT,
    name_param TEXT,
    subject_param TEXT,
    level_param TEXT,
    parent_contact_param TEXT,
    hourly_rate_param DECIMAL
)
RETURNS SETOF tutor_crm.students AS $$
DECLARE
    v_new_student tutor_crm.students;
BEGIN
    INSERT INTO tutor_crm.students (
        clerk_id, name, subject, level, parent_contact, hourly_rate
    ) VALUES (
        clerk_id_param, name_param, subject_param, level_param, parent_contact_param, hourly_rate_param
    ) RETURNING * INTO v_new_student;
    
    RETURN NEXT v_new_student;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
