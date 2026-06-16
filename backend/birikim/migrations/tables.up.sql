--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (user_id TEXT -> user_id UUID)
DO $$ 
BEGIN 
    -- birikim.accounts
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'birikim' AND table_name = 'accounts' AND column_name = 'user_id' AND data_type = 'text') THEN
        ALTER TABLE birikim.accounts RENAME COLUMN user_id TO user_clerk_id;
        ALTER TABLE birikim.accounts ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        UPDATE birikim.accounts a
        SET user_id = u.id
        FROM public.users u
        WHERE a.user_clerk_id = u.clerk_id OR a.user_clerk_id = u.local_clerk_id;
        
        ALTER TABLE birikim.accounts DROP COLUMN user_clerk_id;
    END IF;

    -- birikim.targets
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'birikim' AND table_name = 'targets' AND column_name = 'user_id' AND data_type = 'text') THEN
        ALTER TABLE birikim.targets RENAME COLUMN user_id TO user_clerk_id;
        ALTER TABLE birikim.targets ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        UPDATE birikim.targets t
        SET user_id = u.id
        FROM public.users u
        WHERE t.user_clerk_id = u.clerk_id OR t.user_clerk_id = u.local_clerk_id;
        
        ALTER TABLE birikim.targets DROP COLUMN user_clerk_id;
    END IF;

    -- birikim.transactions
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'birikim' AND table_name = 'transactions' AND column_name = 'user_id' AND data_type = 'text') THEN
        ALTER TABLE birikim.transactions RENAME COLUMN user_id TO user_clerk_id;
        ALTER TABLE birikim.transactions ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        UPDATE birikim.transactions tx
        SET user_id = u.id
        FROM public.users u
        WHERE tx.user_clerk_id = u.clerk_id OR tx.user_clerk_id = u.local_clerk_id;
        
        ALTER TABLE birikim.transactions DROP COLUMN user_clerk_id;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS birikim;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA birikim TO anon, authenticated, service_role;

-- 2. Accounts/assets tracking table
CREATE TABLE IF NOT EXISTS birikim.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank_account', 'gold', 'foreign_currency', 'other')),
    balance NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TRY', -- e.g., 'TRY', 'USD', 'EUR', 'GOLD'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Savings targets/goals table
CREATE TABLE IF NOT EXISTS birikim.targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL,
    current_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TRY', -- e.g., 'TRY', 'USD', 'EUR', 'GOLD'
    target_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Transaction history log
CREATE TABLE IF NOT EXISTS birikim.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES birikim.accounts(id) ON DELETE SET NULL,
    target_id UUID REFERENCES birikim.targets(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'target_allocation', 'target_refund')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_birikim_accounts_user ON birikim.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_birikim_targets_user ON birikim.targets(user_id);
CREATE INDEX IF NOT EXISTS idx_birikim_transactions_user ON birikim.transactions(user_id);

-- 6. Grants
GRANT ALL ON ALL TABLES IN SCHEMA birikim TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA birikim TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA birikim TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA birikim GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA birikim GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA birikim GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
