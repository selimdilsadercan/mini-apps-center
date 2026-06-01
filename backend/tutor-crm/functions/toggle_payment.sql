DROP FUNCTION IF EXISTS tutor_crm.toggle_payment(UUID, TEXT);

CREATE OR REPLACE FUNCTION tutor_crm.toggle_payment(
    payment_id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_status BOOLEAN;
BEGIN
    SELECT is_paid INTO v_current_status 
    FROM tutor_crm.payments 
    WHERE id = payment_id_param AND clerk_id = clerk_id_param;
    
    IF v_current_status IS NULL THEN
        RETURN FALSE;
    END IF;
    
    UPDATE tutor_crm.payments 
    SET is_paid = NOT v_current_status 
    WHERE id = payment_id_param AND clerk_id = clerk_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
