DROP FUNCTION IF EXISTS tutor_crm.get_lessons(TEXT);

CREATE OR REPLACE FUNCTION tutor_crm.get_lessons(clerk_id_param TEXT)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    student_name TEXT,
    clerk_id TEXT,
    lesson_date DATE,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    next_lesson_plan TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id, l.student_id, s.name as student_name, l.clerk_id, 
        l.lesson_date, l.start_time, l.end_time, 
        l.notes, l.next_lesson_plan, l.status, l.created_at
    FROM tutor_crm.lessons l
    JOIN tutor_crm.students s ON l.student_id = s.id
    WHERE l.clerk_id = clerk_id_param
    ORDER BY l.lesson_date DESC, l.start_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
