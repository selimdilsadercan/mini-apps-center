DROP FUNCTION IF EXISTS tutor_crm.update_lesson(UUID, TEXT, DATE, TIME, TIME);

CREATE OR REPLACE FUNCTION tutor_crm.update_lesson(
    lesson_id_param UUID,
    clerk_id_param TEXT,
    lesson_date_param DATE,
    start_time_param TIME,
    end_time_param TIME
)
RETURNS SETOF tutor_crm.lessons AS $$
DECLARE
    v_updated_lesson tutor_crm.lessons;
BEGIN
    UPDATE tutor_crm.lessons
    SET 
        lesson_date = lesson_date_param,
        start_time = start_time_param,
        end_time = end_time_param
    WHERE 
        id = lesson_id_param AND clerk_id = clerk_id_param
    RETURNING * INTO v_updated_lesson;
    
    RETURN NEXT v_updated_lesson;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
