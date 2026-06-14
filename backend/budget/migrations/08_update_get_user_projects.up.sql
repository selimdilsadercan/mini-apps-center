-- Redefine get_user_projects to return start_date, end_date, and total_spent
DROP FUNCTION IF EXISTS budget.get_user_projects(TEXT);

CREATE OR REPLACE FUNCTION budget.get_user_projects(
    clerk_id_param TEXT
)
RETURNS TABLE (
    id UUID,
    creator_clerk_id TEXT,
    name TEXT,
    description TEXT,
    currency TEXT,
    target_budget DECIMAL,
    group_type TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    member_count BIGINT,
    total_spent DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.creator_clerk_id,
        p.name,
        p.description,
        p.currency,
        p.target_budget,
        p.group_type,
        p.start_date,
        p.end_date,
        p.created_at,
        (SELECT COUNT(*) FROM budget.members m WHERE m.project_id = p.id)::BIGINT as member_count,
        COALESCE((SELECT SUM(amount) FROM budget.expenses e WHERE e.project_id = p.id), 0)::DECIMAL as total_spent
    FROM budget.projects p
    WHERE p.creator_clerk_id = clerk_id_param
       OR p.id IN (SELECT project_id FROM budget.members WHERE clerk_id = clerk_id_param)
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
