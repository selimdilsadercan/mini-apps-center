-- Birikim Schema
CREATE SCHEMA IF NOT EXISTS birikim;

-- Accounts/assets tracking table
CREATE TABLE IF NOT EXISTS birikim.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank_account', 'gold', 'foreign_currency', 'other')),
    balance NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TRY', -- e.g., 'TRY', 'USD', 'EUR', 'GOLD'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Savings targets/goals table
CREATE TABLE IF NOT EXISTS birikim.targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL,
    current_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TRY', -- e.g., 'TRY', 'USD', 'EUR', 'GOLD'
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Transaction history log
CREATE TABLE IF NOT EXISTS birikim.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    account_id UUID REFERENCES birikim.accounts(id) ON DELETE SET NULL,
    target_id UUID REFERENCES birikim.targets(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'target_allocation', 'target_refund')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_birikim_accounts_user ON birikim.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_birikim_targets_user ON birikim.targets(user_id);
CREATE INDEX IF NOT EXISTS idx_birikim_transactions_user ON birikim.transactions(user_id);

-- Schema and table grants
GRANT USAGE ON SCHEMA birikim TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA birikim TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA birikim TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA birikim TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA birikim GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA birikim GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA birikim GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
