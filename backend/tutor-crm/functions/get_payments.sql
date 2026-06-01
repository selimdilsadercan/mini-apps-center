DROP FUNCTION IF EXISTS tutor_crm.get_payments(TEXT);

CREATE OR REPLACE FUNCTION tutor_crm.get_payments(clerk_id_param TEXT)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    student_name TEXT,
    clerk_id TEXT,
    amount DECIMAL,
    is_paid BOOLEAN,
    payment_date DATE,
    lesson_count INTEGER,
    month INTEGER,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.student_id, s.name as student_name, p.clerk_id, 
        p.amount, p.is_paid, p.payment_date, p.lesson_count, 
        p.month, p.year, p.created_at
    FROM tutor_crm.payments p
    JOIN tutor_crm.students s ON p.student_id = s.id
    WHERE p.clerk_id = clerk_id_param
    ORDER BY p.year DESC, p.month DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
