DROP FUNCTION IF EXISTS tutor_crm.get_students(TEXT);

CREATE OR REPLACE FUNCTION tutor_crm.get_students(clerk_id_param TEXT)
RETURNS SETOF tutor_crm.students AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM tutor_crm.students
    WHERE clerk_id = clerk_id_param
    ORDER BY name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
