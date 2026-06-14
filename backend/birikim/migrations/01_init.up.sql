-- Initial migration for Birikim Savings Tracker
CREATE SCHEMA IF NOT EXISTS birikim;

-- Accounts/assets tracking table
CREATE TABLE IF NOT EXISTS birikim.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank_account', 'gold', 'foreign_currency', 'other')),
    balance NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TRY',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Savings targets/goals table
CREATE TABLE IF NOT EXISTS birikim.targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL,
    current_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TRY',
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

-- Functions definitions

-- 1. get_accounts
CREATE OR REPLACE FUNCTION birikim.get_accounts(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    name TEXT,
    type TEXT,
    balance NUMERIC,
    currency TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        a.name,
        a.type,
        a.balance,
        a.currency,
        a.created_at
    FROM birikim.accounts a
    WHERE a.user_id = p_user_id
    ORDER BY a.created_at DESC;
END;
$$;

-- 2. get_targets
CREATE OR REPLACE FUNCTION birikim.get_targets(p_user_id TEXT)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    title TEXT,
    target_amount NUMERIC,
    current_amount NUMERIC,
    currency TEXT,
    target_date DATE,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.user_id,
        t.title,
        t.target_amount,
        t.current_amount,
        t.currency,
        t.target_date,
        t.created_at
    FROM birikim.targets t
    WHERE t.user_id = p_user_id
    ORDER BY t.created_at DESC;
END;
$$;

-- 3. get_transactions
CREATE OR REPLACE FUNCTION birikim.get_transactions(
    p_user_id TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    account_id UUID,
    account_name TEXT,
    target_id UUID,
    target_title TEXT,
    amount NUMERIC,
    type TEXT,
    description TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tx.id,
        tx.user_id,
        tx.account_id,
        a.name as account_name,
        tx.target_id,
        t.title as target_title,
        tx.amount,
        tx.type,
        tx.description,
        tx.created_at
    FROM birikim.transactions tx
    LEFT JOIN birikim.accounts a ON tx.account_id = a.id
    LEFT JOIN birikim.targets t ON tx.target_id = t.id
    WHERE tx.user_id = p_user_id
    ORDER BY tx.created_at DESC
    LIMIT p_limit;
END;
$$;

-- 4. upsert_account
CREATE OR REPLACE FUNCTION birikim.upsert_account(
    p_id UUID,
    p_user_id TEXT,
    p_name TEXT,
    p_type TEXT,
    p_balance NUMERIC,
    p_currency TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id IS NULL THEN
        INSERT INTO birikim.accounts (user_id, name, type, balance, currency)
        VALUES (p_user_id, p_name, p_type, p_balance, p_currency)
        RETURNING id INTO v_id;
    ELSE
        UPDATE birikim.accounts
        SET name = p_name,
            type = p_type,
            balance = p_balance,
            currency = p_currency
        WHERE id = p_id AND user_id = p_user_id
        RETURNING id INTO v_id;
    END IF;
    
    RETURN v_id;
END;
$$;

-- 5. delete_account
CREATE OR REPLACE FUNCTION birikim.delete_account(
    p_id UUID,
    p_user_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM birikim.accounts
    WHERE id = p_id AND user_id = p_user_id;
    RETURN FOUND;
END;
$$;

-- 6. upsert_target
CREATE OR REPLACE FUNCTION birikim.upsert_target(
    p_id UUID,
    p_user_id TEXT,
    p_title TEXT,
    p_target_amount NUMERIC,
    p_current_amount NUMERIC,
    p_currency TEXT,
    p_target_date DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id IS NULL THEN
        INSERT INTO birikim.targets (user_id, title, target_amount, current_amount, currency, target_date)
        VALUES (p_user_id, p_title, p_target_amount, p_current_amount, p_currency, p_target_date)
        RETURNING id INTO v_id;
    ELSE
        UPDATE birikim.targets
        SET title = p_title,
            target_amount = p_target_amount,
            current_amount = p_current_amount,
            currency = p_currency,
            target_date = p_target_date
        WHERE id = p_id AND user_id = p_user_id
        RETURNING id INTO v_id;
    END IF;
    
    RETURN v_id;
END;
$$;

-- 7. delete_target
CREATE OR REPLACE FUNCTION birikim.delete_target(
    p_id UUID,
    p_user_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM birikim.targets
    WHERE id = p_id AND user_id = p_user_id;
    RETURN FOUND;
END;
$$;

-- 8. add_transaction
CREATE OR REPLACE FUNCTION birikim.add_transaction(
    p_user_id TEXT,
    p_account_id UUID,
    p_target_id UUID,
    p_amount NUMERIC,
    p_type TEXT,
    p_description TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tx_id UUID;
BEGIN
    -- 1. Insert transaction record
    INSERT INTO birikim.transactions (user_id, account_id, target_id, amount, type, description)
    VALUES (p_user_id, p_account_id, p_target_id, p_amount, p_type, p_description)
    RETURNING id INTO v_tx_id;

    -- 2. Adjust account or target balance based on transaction type
    IF p_type = 'deposit' AND p_account_id IS NOT NULL THEN
        UPDATE birikim.accounts 
        SET balance = balance + p_amount
        WHERE id = p_account_id AND user_id = p_user_id;

    ELSIF p_type = 'withdraw' AND p_account_id IS NOT NULL THEN
        UPDATE birikim.accounts 
        SET balance = balance - p_amount
        WHERE id = p_account_id AND user_id = p_user_id;

    ELSIF p_type = 'target_allocation' AND p_target_id IS NOT NULL THEN
        -- Increase the target current amount
        UPDATE birikim.targets
        SET current_amount = current_amount + p_amount
        WHERE id = p_target_id AND user_id = p_user_id;
        
        -- Optionally decrease from the source account if provided
        IF p_account_id IS NOT NULL THEN
            UPDATE birikim.accounts
            SET balance = balance - p_amount
            WHERE id = p_account_id AND user_id = p_user_id;
        END IF;

    ELSIF p_type = 'target_refund' AND p_target_id IS NOT NULL THEN
        -- Decrease target current amount
        UPDATE birikim.targets
        SET current_amount = current_amount - p_amount
        WHERE id = p_target_id AND user_id = p_user_id;
        
        -- Optionally increase destination account if provided
        IF p_account_id IS NOT NULL THEN
            UPDATE birikim.accounts
            SET balance = balance + p_amount
            WHERE id = p_account_id AND user_id = p_user_id;
        END IF;
    END IF;

    RETURN v_tx_id;
END;
$$;

-- Permissions Grants
GRANT USAGE ON SCHEMA birikim TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA birikim TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA birikim TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA birikim TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA birikim GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA birikim GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA birikim GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
