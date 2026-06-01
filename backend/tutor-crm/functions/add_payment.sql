DROP FUNCTION IF EXISTS tutor_crm.add_payment(TEXT, UUID, DECIMAL, BOOLEAN, DATE, INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION tutor_crm.add_payment(
    clerk_id_param TEXT,
    student_id_param UUID,
    amount_param DECIMAL,
    is_paid_param BOOLEAN,
    payment_date_param DATE,
    lesson_count_param INTEGER,
    month_param INTEGER,
    year_param INTEGER
)
RETURNS SETOF tutor_crm.payments AS $$
DECLARE
    v_new_payment tutor_crm.payments;
BEGIN
    INSERT INTO tutor_crm.payments (
        clerk_id, student_id, amount, is_paid, payment_date, lesson_count, month, year
    ) VALUES (
        clerk_id_param, student_id_param, amount_param, is_paid_param, payment_date_param, lesson_count_param, month_param, year_param
    ) RETURNING * INTO v_new_payment;
    
    RETURN NEXT v_new_payment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
