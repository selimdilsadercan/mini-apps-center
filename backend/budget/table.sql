-- Budget Schema
CREATE SCHEMA IF NOT EXISTS budget;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA budget TO anon, authenticated, service_role;

-- Projects Table
CREATE TABLE IF NOT EXISTS budget.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_clerk_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    currency TEXT NOT NULL DEFAULT 'TRY',
    target_budget DECIMAL,
    group_type TEXT NOT NULL DEFAULT 'trip', -- 'trip', 'home', 'event', 'other'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members Table (either associated with a clerk user or simple guest names)
CREATE TABLE IF NOT EXISTS budget.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES budget.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    clerk_id TEXT, -- Optional link to registered user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS budget.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES budget.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    payer_member_id UUID REFERENCES budget.members(id) ON DELETE CASCADE,
    expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category TEXT NOT NULL DEFAULT 'other', -- 'food', 'transport', 'lodging', 'activity', 'shopping', 'other'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense Shares Table
CREATE TABLE IF NOT EXISTS budget.expense_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES budget.expenses(id) ON DELETE CASCADE,
    member_id UUID REFERENCES budget.members(id) ON DELETE CASCADE,
    share_amount DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_budget_projects_creator ON budget.projects(creator_clerk_id);
CREATE INDEX IF NOT EXISTS idx_budget_members_project ON budget.members(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_project ON budget.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_shares_expense ON budget.expense_shares(expense_id);

-- Ensure all permissions are set up
GRANT ALL ON ALL TABLES IN SCHEMA budget TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA budget TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA budget TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA budget GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA budget GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA budget GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
