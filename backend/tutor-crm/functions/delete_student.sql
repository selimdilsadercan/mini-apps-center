DROP FUNCTION IF EXISTS tutor_crm.delete_student(UUID, TEXT);

CREATE OR REPLACE FUNCTION tutor_crm.delete_student(
    student_id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM tutor_crm.students 
    WHERE id = student_id_param AND clerk_id = clerk_id_param;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
