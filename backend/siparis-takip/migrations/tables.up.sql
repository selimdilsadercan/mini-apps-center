--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS siparis_takip;

GRANT USAGE ON SCHEMA siparis_takip TO anon, authenticated, service_role;

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS siparis_takip.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    instagram_username TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS siparis_takip.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES siparis_takip.customers(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'in_progress', 'ready', 'delivered', 'cancelled')),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline DATE,
    materials_notes TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_siparis_takip_customers_user ON siparis_takip.customers(created_user_id);
CREATE INDEX IF NOT EXISTS idx_siparis_takip_orders_user ON siparis_takip.orders(created_user_id);
CREATE INDEX IF NOT EXISTS idx_siparis_takip_orders_customer ON siparis_takip.orders(customer_id);

-- Grants & Permissions
GRANT ALL ON ALL TABLES IN SCHEMA siparis_takip TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA siparis_takip TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA siparis_takip GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA siparis_takip GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA siparis_takip GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
