--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) below.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition & Column Fixes
DO $$ 
BEGIN 
    -- budget.projects: creator_clerk_id -> creator_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'budget' AND table_name = 'projects' AND column_name = 'creator_clerk_id') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'budget' AND table_name = 'projects' AND column_name = 'creator_id') THEN
            ALTER TABLE budget.projects ADD COLUMN creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        UPDATE budget.projects p
        SET creator_id = u.id
        FROM public.users u
        WHERE p.creator_clerk_id = u.clerk_id OR p.creator_clerk_id = u.local_clerk_id;

        ALTER TABLE budget.projects DROP COLUMN creator_clerk_id;
    END IF;

    -- budget.members: clerk_id -> user_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'budget' AND table_name = 'members' AND column_name = 'clerk_id') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'budget' AND table_name = 'members' AND column_name = 'user_id') THEN
            ALTER TABLE budget.members ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
        END IF;

        UPDATE budget.members m
        SET user_id = u.id
        FROM public.users u
        WHERE m.clerk_id = u.clerk_id OR m.clerk_id = u.local_clerk_id;

        ALTER TABLE budget.members DROP COLUMN clerk_id;
    END IF;

    -- Ensure emoji column exists
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'budget' AND table_name = 'projects' AND column_name = 'emoji') THEN
        ALTER TABLE budget.projects ADD COLUMN emoji TEXT DEFAULT '🏖️';
    END IF;

    -- Ensure share_id column exists
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'budget' AND table_name = 'projects' AND column_name = 'share_id') THEN
        ALTER TABLE budget.projects ADD COLUMN share_id TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8);
        -- Backfill existing rows
        UPDATE budget.projects SET share_id = substring(md5(random()::text), 1, 8) WHERE share_id IS NULL;
        ALTER TABLE budget.projects ALTER COLUMN share_id SET NOT NULL;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS budget;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA budget TO anon, authenticated, service_role;

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS budget.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    currency TEXT NOT NULL DEFAULT 'TRY',
    target_budget DECIMAL,
    group_type TEXT NOT NULL DEFAULT 'trip',
    start_date DATE,
    end_date DATE,
    emoji TEXT DEFAULT '🏖️',
    share_id TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Members Table
CREATE TABLE IF NOT EXISTS budget.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES budget.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_budget_projects_creator ON budget.projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_budget_members_project ON budget.members(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_project ON budget.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_shares_expense ON budget.expense_shares(expense_id);

-- 7. Grants
GRANT ALL ON ALL TABLES IN SCHEMA budget TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA budget TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA budget GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA budget GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
