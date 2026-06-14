-- Budget RPC Functions

-- 1. add_expense
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

-- 2. create_project
DROP FUNCTION IF EXISTS budget.create_project(TEXT, TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS budget.create_project(TEXT, TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT[], DATE, DATE);

CREATE OR REPLACE FUNCTION budget.create_project(
    creator_clerk_id_param TEXT,
    name_param TEXT,
    description_param TEXT,
    currency_param TEXT,
    target_budget_param DECIMAL,
    group_type_param TEXT,
    member_names_param TEXT[],
    start_date_param DATE DEFAULT NULL,
    end_date_param DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_project_id UUID;
    v_member_name TEXT;
    v_user_name TEXT;
BEGIN
    -- 1. Insert Project
    INSERT INTO budget.projects (
        creator_clerk_id, name, description, currency, target_budget, group_type, start_date, end_date
    ) VALUES (
        creator_clerk_id_param, name_param, description_param, currency_param, target_budget_param, group_type_param, start_date_param, end_date_param
    ) RETURNING id INTO v_project_id;

    -- 2. Fetch Creator's Name to auto-associate as a member
    SELECT COALESCE(username, 'Ben') INTO v_user_name FROM public.users WHERE clerk_id = creator_clerk_id_param;
    IF v_user_name IS NULL OR v_user_name = '' THEN
        v_user_name := 'Ben';
    END IF;

    -- Insert Creator as first member
    INSERT INTO budget.members (
        project_id, name, clerk_id
    ) VALUES (
        v_project_id, v_user_name, creator_clerk_id_param
    );

    -- 3. Insert other members
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

-- 3. delete_expense
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

-- 4. get_user_projects
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

-- 5. update_expense
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

-- 6. update_project
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

-- 7. Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA budget TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA budget GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
