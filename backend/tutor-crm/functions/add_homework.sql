DROP FUNCTION IF EXISTS tutor_crm.add_homework(TEXT, UUID, TEXT, DATE);

CREATE OR REPLACE FUNCTION tutor_crm.add_homework(
    clerk_id_param TEXT,
    student_id_param UUID,
    task_param TEXT,
    due_date_param DATE
)
RETURNS SETOF tutor_crm.homeworks AS $$
DECLARE
    v_new_homework tutor_crm.homeworks;
BEGIN
    INSERT INTO tutor_crm.homeworks (
        clerk_id, student_id, task, due_date
    ) VALUES (
        clerk_id_param, student_id_param, task_param, due_date_param
    ) RETURNING * INTO v_new_homework;
    
    RETURN NEXT v_new_homework;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
