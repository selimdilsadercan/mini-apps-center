DROP FUNCTION IF EXISTS tutor_crm.update_student(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL);

CREATE OR REPLACE FUNCTION tutor_crm.update_student(
    student_id_param UUID,
    clerk_id_param TEXT,
    name_param TEXT,
    subject_param TEXT,
    level_param TEXT,
    parent_contact_param TEXT,
    hourly_rate_param DECIMAL
)
RETURNS SETOF tutor_crm.students AS $$
DECLARE
    v_student tutor_crm.students;
BEGIN
    UPDATE tutor_crm.students
    SET name = name_param,
        subject = subject_param,
        level = level_param,
        parent_contact = parent_contact_param,
        hourly_rate = hourly_rate_param
    WHERE id = student_id_param AND clerk_id = clerk_id_param
    RETURNING * INTO v_student;
    
    RETURN NEXT v_student;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
