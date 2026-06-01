DROP FUNCTION IF EXISTS tutor_crm.get_homeworks(TEXT);

CREATE OR REPLACE FUNCTION tutor_crm.get_homeworks(clerk_id_param TEXT)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    student_name TEXT,
    clerk_id TEXT,
    task TEXT,
    due_date DATE,
    is_completed BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id, h.student_id, s.name as student_name, h.clerk_id, 
        h.task, h.due_date, h.is_completed, h.created_at
    FROM tutor_crm.homeworks h
    JOIN tutor_crm.students s ON h.student_id = s.id
    WHERE h.clerk_id = clerk_id_param
    ORDER BY h.due_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
