--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS store;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA store TO anon, authenticated, service_role;

-- 1. Stores Table
CREATE TABLE IF NOT EXISTS store.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    contact_whatsapp TEXT,
    contact_instagram TEXT,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS store.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES store.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'TRY',
    image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    category TEXT NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_stores_user ON store.stores(created_user_id);
CREATE INDEX IF NOT EXISTS idx_store_products_store ON store.products(store_id);

-- Grants & Permissions
GRANT ALL ON ALL TABLES IN SCHEMA store TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA store TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA store GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA store GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA store GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
