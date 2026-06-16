--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (clerk_id TEXT -> user_id UUID)
DO $$ 
BEGIN 
    -- chocolate_db.reviews: clerk_id -> user_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'chocolate_db' AND table_name = 'reviews' AND column_name = 'clerk_id') THEN
        ALTER TABLE chocolate_db.reviews RENAME COLUMN clerk_id TO clerk_id_old;
        ALTER TABLE chocolate_db.reviews ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        UPDATE chocolate_db.reviews r
        SET user_id = u.id
        FROM public.users u
        WHERE r.clerk_id_old = u.clerk_id OR r.clerk_id_old = u.local_clerk_id;
        
        ALTER TABLE chocolate_db.reviews DROP COLUMN clerk_id_old;
        
        -- Add unique constraint back
        ALTER TABLE chocolate_db.reviews ADD CONSTRAINT reviews_user_id_chocolate_id_key UNIQUE (user_id, chocolate_id);
    END IF;

    -- chocolate_db.user_states: clerk_id -> user_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'chocolate_db' AND table_name = 'user_states' AND column_name = 'clerk_id') THEN
        ALTER TABLE chocolate_db.user_states RENAME COLUMN clerk_id TO clerk_id_old;
        ALTER TABLE chocolate_db.user_states ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        UPDATE chocolate_db.user_states us
        SET user_id = u.id
        FROM public.users u
        WHERE us.clerk_id_old = u.clerk_id OR us.clerk_id_old = u.local_clerk_id;
        
        ALTER TABLE chocolate_db.user_states DROP COLUMN clerk_id_old;
        
        -- Add unique constraint back
        ALTER TABLE chocolate_db.user_states ADD CONSTRAINT user_states_user_id_chocolate_id_key UNIQUE (user_id, chocolate_id);
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS chocolate_db;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA chocolate_db TO anon, authenticated, service_role;

-- 2. Reviews Table
CREATE TABLE IF NOT EXISTS chocolate_db.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chocolate_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    comment TEXT,
    reviewer_name TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, chocolate_id)
);

-- 3. User States Table
CREATE TABLE IF NOT EXISTS chocolate_db.user_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    chocolate_id TEXT NOT NULL,
    state TEXT CHECK (state IN ('tried', 'wishlist', 'dislike')),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, chocolate_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_chocolate_reviews_user ON chocolate_db.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_chocolate_user_states_user ON chocolate_db.user_states(user_id);

-- 5. Grants
GRANT ALL ON ALL TABLES IN SCHEMA chocolate_db TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA chocolate_db TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA chocolate_db GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA chocolate_db GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA chocolate_db GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
