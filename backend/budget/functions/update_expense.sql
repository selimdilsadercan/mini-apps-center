-- Drop function if exists
DROP FUNCTION IF EXISTS budget.update_expense(UUID, TEXT, DECIMAL, UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS budget.update_expense(UUID, TEXT, DECIMAL, UUID, TEXT, JSONB, TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION budget.update_expense(
    expense_id_param UUID,
    title_param TEXT,
    amount_param DECIMAL,
    payer_member_id_param UUID,
    category_param TEXT,
    shares_param JSONB,
    expense_date_param TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_share RECORD;
BEGIN
    -- 1. Update the main expense row
    UPDATE budget.expenses 
    SET title = title_param,
        amount = amount_param,
        payer_member_id = payer_member_id_param,
        category = category_param,
        expense_date = expense_date_param
    WHERE id = expense_id_param;

    -- 2. Clear old shares
    DELETE FROM budget.expense_shares WHERE expense_id = expense_id_param;

    -- 3. Re-insert new shares
    FOR v_share IN 
        SELECT (value->>'member_id')::UUID as member_id, (value->>'share_amount')::DECIMAL as share_amount
        FROM jsonb_array_elements(shares_param)
    LOOP
        INSERT INTO budget.expense_shares (
            expense_id, member_id, share_amount
        ) VALUES (
            expense_id_param, v_share.member_id, v_share.share_amount
        );
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
