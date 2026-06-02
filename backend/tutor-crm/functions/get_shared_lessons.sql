DROP FUNCTION IF EXISTS tutor_crm.get_shared_lessons(UUID);

CREATE OR REPLACE FUNCTION tutor_crm.get_shared_lessons(share_id_param UUID)
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
DECLARE
    v_clerk_id TEXT;
    v_is_active BOOLEAN;
    v_allow_student_names BOOLEAN;
BEGIN
    SELECT shares.clerk_id, shares.is_active, shares.allow_student_names 
    INTO v_clerk_id, v_is_active, v_allow_student_names 
    FROM tutor_crm.shares 
    WHERE shares.id = share_id_param;

    IF v_is_active = TRUE THEN
        RETURN QUERY 
        SELECT 
            l.id, 
            l.student_id, 
            CASE WHEN v_allow_student_names = TRUE THEN s.name ELSE s.subject || ' Dersi' END as student_name, 
            l.clerk_id, 
            l.lesson_date, 
            l.start_time, 
            l.end_time, 
            CASE WHEN v_allow_student_names = TRUE THEN l.notes ELSE '' END as notes, 
            CASE WHEN v_allow_student_names = TRUE THEN l.next_lesson_plan ELSE '' END as next_lesson_plan, 
            l.status, 
            l.created_at 
        FROM tutor_crm.lessons l 
        JOIN tutor_crm.students s ON l.student_id = s.id 
        WHERE l.clerk_id = v_clerk_id 
        ORDER BY l.lesson_date DESC, l.start_time DESC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
