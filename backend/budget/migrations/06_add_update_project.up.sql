-- Drop function if exists
DROP FUNCTION IF EXISTS budget.update_project(UUID, TEXT, TEXT, TEXT, DECIMAL, TEXT, DATE, DATE);

CREATE OR REPLACE FUNCTION budget.update_project(
    project_id_param UUID,
    name_param TEXT,
    description_param TEXT,
    currency_param TEXT,
    target_budget_param DECIMAL,
    group_type_param TEXT,
    start_date_param DATE,
    end_date_param DATE
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE budget.projects 
    SET name = name_param,
        description = description_param,
        currency = currency_param,
        target_budget = target_budget_param,
        group_type = group_type_param,
        start_date = start_date_param,
        end_date = end_date_param
    WHERE id = project_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
