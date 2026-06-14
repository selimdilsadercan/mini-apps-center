-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS budget;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA budget TO anon, authenticated, service_role;

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS budget.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_clerk_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    currency TEXT NOT NULL DEFAULT 'TRY',
    target_budget DECIMAL,
    group_type TEXT NOT NULL DEFAULT 'trip',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Members Table
CREATE TABLE IF NOT EXISTS budget.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES budget.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    clerk_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Expenses Table
CREATE TABLE IF NOT EXISTS budget.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES budget.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    payer_member_id UUID REFERENCES budget.members(id) ON DELETE CASCADE,
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category TEXT NOT NULL DEFAULT 'other',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Expense Shares Table
CREATE TABLE IF NOT EXISTS budget.expense_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES budget.expenses(id) ON DELETE CASCADE,
    member_id UUID REFERENCES budget.members(id) ON DELETE CASCADE,
    share_amount DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_budget_projects_creator ON budget.projects(creator_clerk_id);
CREATE INDEX IF NOT EXISTS idx_budget_members_project ON budget.members(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_project ON budget.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_shares_expense ON budget.expense_shares(expense_id);

-- 7. Database Functions (RPCs)

-- create_project RPC
CREATE OR REPLACE FUNCTION budget.create_project(
    creator_clerk_id_param TEXT,
    name_param TEXT,
    description_param TEXT,
    currency_param TEXT,
    target_budget_param DECIMAL,
    group_type_param TEXT,
    member_names_param TEXT[]
)
RETURNS UUID AS $$
DECLARE
    v_project_id UUID;
    v_member_name TEXT;
    v_user_name TEXT;
BEGIN
    INSERT INTO budget.projects (
        creator_clerk_id, name, description, currency, target_budget, group_type
    ) VALUES (
        creator_clerk_id_param, name_param, description_param, currency_param, target_budget_param, group_type_param
    ) RETURNING id INTO v_project_id;

    SELECT COALESCE(username, 'Ben') INTO v_user_name FROM public.users WHERE clerk_id = creator_clerk_id_param;
    IF v_user_name IS NULL OR v_user_name = '' THEN
        v_user_name := 'Ben';
    END IF;

    INSERT INTO budget.members (
        project_id, name, clerk_id
    ) VALUES (
        v_project_id, v_user_name, creator_clerk_id_param
    );

    IF member_names_param IS NOT NULL THEN
        FOREACH v_member_name IN ARRAY member_names_param
        LOOP
            IF TRIM(v_member_name) <> '' AND TRIM(v_member_name) <> v_user_name THEN
                INSERT INTO budget.members (
                    project_id, name
                ) VALUES (
                    v_project_id, TRIM(v_member_name)
                );
            END IF;
        END LOOP;
    END IF;

    RETURN v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_user_projects RPC
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
    created_at TIMESTAMP WITH TIME ZONE,
    member_count BIGINT
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
        p.created_at,
        COUNT(m.id) as member_count
    FROM budget.projects p
    LEFT JOIN budget.members m ON p.id = m.project_id
    WHERE p.creator_clerk_id = clerk_id_param
       OR p.id IN (SELECT project_id FROM budget.members WHERE clerk_id = clerk_id_param)
    GROUP BY p.id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- add_expense RPC
CREATE OR REPLACE FUNCTION budget.add_expense(
    project_id_param UUID,
    title_param TEXT,
    amount_param DECIMAL,
    payer_member_id_param UUID,
    category_param TEXT,
    shares_param JSONB
)
RETURNS UUID AS $$
DECLARE
    v_expense_id UUID;
    v_share RECORD;
BEGIN
    INSERT INTO budget.expenses (
        project_id, title, amount, payer_member_id, category
    ) VALUES (
        project_id_param, title_param, amount_param, payer_member_id_param, category_param
    ) RETURNING id INTO v_expense_id;

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

-- delete_expense RPC
CREATE OR REPLACE FUNCTION budget.delete_expense(
    expense_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM budget.expenses WHERE id = expense_id_param;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grants
GRANT ALL ON ALL TABLES IN SCHEMA budget TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA budget TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA budget TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA budget GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA budget GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA budget GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
