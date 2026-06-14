DROP FUNCTION IF EXISTS birikim.add_transaction(TEXT, UUID, UUID, NUMERIC, TEXT, TEXT);
CREATE OR REPLACE FUNCTION birikim.add_transaction(
    p_user_id TEXT,
    p_account_id UUID,
    p_target_id UUID,
    p_amount NUMERIC,
    p_type TEXT,
    p_description TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tx_id UUID;
BEGIN
    -- 1. Insert transaction record
    INSERT INTO birikim.transactions (user_id, account_id, target_id, amount, type, description)
    VALUES (p_user_id, p_account_id, p_target_id, p_amount, p_type, p_description)
    RETURNING id INTO v_tx_id;

    -- 2. Adjust account or target balance based on transaction type
    IF p_type = 'deposit' AND p_account_id IS NOT NULL THEN
        UPDATE birikim.accounts 
        SET balance = balance + p_amount
        WHERE id = p_account_id AND user_id = p_user_id;

    ELSIF p_type = 'withdraw' AND p_account_id IS NOT NULL THEN
        UPDATE birikim.accounts 
        SET balance = balance - p_amount
        WHERE id = p_account_id AND user_id = p_user_id;

    ELSIF p_type = 'target_allocation' AND p_target_id IS NOT NULL THEN
        -- Increase the target current amount
        UPDATE birikim.targets
        SET current_amount = current_amount + p_amount
        WHERE id = p_target_id AND user_id = p_user_id;
        
        -- Optionally decrease from the source account if provided
        IF p_account_id IS NOT NULL THEN
            UPDATE birikim.accounts
            SET balance = balance - p_amount
            WHERE id = p_account_id AND user_id = p_user_id;
        END IF;

    ELSIF p_type = 'target_refund' AND p_target_id IS NOT NULL THEN
        -- Decrease target current amount
        UPDATE birikim.targets
        SET current_amount = current_amount - p_amount
        WHERE id = p_target_id AND user_id = p_user_id;
        
        -- Optionally increase destination account if provided
        IF p_account_id IS NOT NULL THEN
            UPDATE birikim.accounts
            SET balance = balance + p_amount
            WHERE id = p_account_id AND user_id = p_user_id;
        END IF;
    END IF;

    RETURN v_tx_id;
END;
$$;
