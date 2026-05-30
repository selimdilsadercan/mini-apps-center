CREATE SCHEMA IF NOT EXISTS chocolate_db;

-- Product catalog lives in backend/chocolate-db/data/products.json (slug IDs).
-- DB stores reviews and per-user state only.

CREATE TABLE chocolate_db.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chocolate_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    reviewer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chocolate_db.user_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL,
    chocolate_id TEXT NOT NULL,
    state TEXT CHECK (state IN ('tried', 'wishlist', 'dislike')),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (clerk_id, chocolate_id)
);

-- Permissions
GRANT USAGE ON SCHEMA chocolate_db TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA chocolate_db TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA chocolate_db TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA chocolate_db TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA chocolate_db GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA chocolate_db GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA chocolate_db GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
