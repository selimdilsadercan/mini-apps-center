--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- 2026-06-20: Decoupled businesses to central business service. Integrated user_favorites table.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS digital_menu;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA digital_menu TO anon, authenticated, service_role;

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS digital_menu.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES business.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS digital_menu.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES digital_menu.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    dietary_flags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS digital_menu.tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES business.businesses(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(business_id, table_number)
);

CREATE TABLE IF NOT EXISTS digital_menu.waiter_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES business.businesses(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'resolved'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS digital_menu.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    business_id TEXT NOT NULL REFERENCES business.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, business_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_dm_categories_business ON digital_menu.categories(business_id);
CREATE INDEX IF NOT EXISTS idx_dm_items_category ON digital_menu.items(category_id);
CREATE INDEX IF NOT EXISTS idx_dm_tables_business ON digital_menu.tables(business_id);
CREATE INDEX IF NOT EXISTS idx_dm_waiter_calls_business ON digital_menu.waiter_calls(business_id);
CREATE INDEX IF NOT EXISTS idx_dm_user_favorites_user ON digital_menu.user_favorites(user_id);

-- 4. Grants & Permissions
GRANT ALL ON ALL TABLES IN SCHEMA digital_menu TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA digital_menu TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA digital_menu GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA digital_menu GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA digital_menu GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
