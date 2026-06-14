-- Drop function if exists
DROP FUNCTION IF EXISTS budget.delete_expense(UUID);

CREATE OR REPLACE FUNCTION budget.delete_expense(
    expense_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM budget.expenses WHERE id = expense_id_param;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
