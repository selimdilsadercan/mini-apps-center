-- Drop function if exists with old signature
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
