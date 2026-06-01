DROP FUNCTION IF EXISTS tutor_crm.add_lesson(TEXT, UUID, DATE, TIME, TIME, TEXT, TEXT);

CREATE OR REPLACE FUNCTION tutor_crm.add_lesson(
    clerk_id_param TEXT,
    student_id_param UUID,
    lesson_date_param DATE,
    start_time_param TIME,
    end_time_param TIME,
    notes_param TEXT,
    next_lesson_plan_param TEXT
)
RETURNS SETOF tutor_crm.lessons AS $$
DECLARE
    v_new_lesson tutor_crm.lessons;
BEGIN
    INSERT INTO tutor_crm.lessons (
        clerk_id, student_id, lesson_date, start_time, end_time, notes, next_lesson_plan
    ) VALUES (
        clerk_id_param, student_id_param, lesson_date_param, start_time_param, end_time_param, notes_param, next_lesson_plan_param
    ) RETURNING * INTO v_new_lesson;
    
    RETURN NEXT v_new_lesson;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
