-- Drop function if exists
DROP FUNCTION IF EXISTS budget.add_expense(UUID, TEXT, DECIMAL, UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS budget.add_expense(UUID, TEXT, DECIMAL, UUID, TEXT, JSONB, TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION budget.add_expense(
    project_id_param UUID,
    title_param TEXT,
    amount_param DECIMAL,
    payer_member_id_param UUID,
    category_param TEXT,
    shares_param JSONB,
    expense_date_param TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_expense_id UUID;
    v_share RECORD;
BEGIN
    -- 1. Insert Expense
    INSERT INTO budget.expenses (
        project_id, title, amount, payer_member_id, category, expense_date
    ) VALUES (
        project_id_param, title_param, amount_param, payer_member_id_param, category_param, expense_date_param
    ) RETURNING id INTO v_expense_id;

    -- 2. Insert Shares
    FOR v_share IN 
        SELECT (value->>'member_id')::UUID as member_id, (value->>'share_amount')::DECIMAL as share_amount
        FROM jsonb_array_elements(shares_param)
    LOOP
        INSERT INTO budget.expense_shares (
            expense_id, member_id, share_amount
        ) VALUES (
            v_expense_id, v_share.member_id, v_share.share_amount
        );
    END LOOP;

    RETURN v_expense_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
