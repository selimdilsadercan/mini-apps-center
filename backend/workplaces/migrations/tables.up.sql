-- Squashed migrations for workplaces service

-- 1. Create schema
CREATE SCHEMA IF NOT EXISTS workplaces;

-- 2. Places table
CREATE TABLE IF NOT EXISTS workplaces.places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    note TEXT,
    url TEXT,
    tags TEXT[] DEFAULT '{}',
    wifi BOOLEAN DEFAULT FALSE,
    parking BOOLEAN DEFAULT FALSE,
    power_outlets BOOLEAN DEFAULT FALSE,
    quiet_level INTEGER DEFAULT 3, -- 1-5
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    district TEXT,
    image_url TEXT,
    address TEXT,
    rating NUMERIC,
    user_ratings_total INTEGER,
    metadata JSONB DEFAULT '{}',
    approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data migration for places (suggested_by TEXT -> user_id UUID)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'workplaces' AND table_name = 'places' AND column_name = 'suggested_by') THEN
        -- Add user_id if not exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'workplaces' AND table_name = 'places' AND column_name = 'user_id') THEN
            ALTER TABLE workplaces.places ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
        END IF;

        -- Migrate data
        UPDATE workplaces.places p
        SET user_id = u.id
        FROM public.users u
        WHERE p.suggested_by = u.clerk_id OR p.suggested_by = u.id::text;

        -- Drop old column
        ALTER TABLE workplaces.places DROP COLUMN suggested_by;
    END IF;
END $$;

-- 3. Favorites table
CREATE TABLE IF NOT EXISTS workplaces.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES workplaces.places(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (place_id, user_id)
);

-- Data migration for favorites (clerk_id TEXT -> user_id UUID)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'workplaces' AND table_name = 'favorites' AND column_name = 'clerk_id') THEN
        -- Add user_id if not exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'workplaces' AND table_name = 'favorites' AND column_name = 'user_id') THEN
            ALTER TABLE workplaces.favorites ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        -- Migrate data
        UPDATE workplaces.favorites f
        SET user_id = u.id
        FROM public.users u
        WHERE f.clerk_id = u.clerk_id OR f.clerk_id = u.id::text;

        -- Delete orphaned rows
        DELETE FROM workplaces.favorites WHERE user_id IS NULL;

        -- Set NOT NULL and UNIQUE
        ALTER TABLE workplaces.favorites ALTER COLUMN user_id SET NOT NULL;
        
        -- Drop old column and handle unique constraint
        ALTER TABLE workplaces.favorites DROP CONSTRAINT IF EXISTS favorites_place_id_clerk_id_key;
        ALTER TABLE workplaces.favorites DROP COLUMN clerk_id;
        
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'favorites_place_id_user_id_key') THEN
            ALTER TABLE workplaces.favorites ADD CONSTRAINT favorites_place_id_user_id_key UNIQUE (place_id, user_id);
        END IF;
    END IF;
END $$;

-- 4. Visited table
CREATE TABLE IF NOT EXISTS workplaces.visited (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES workplaces.places(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (place_id, user_id)
);

-- Data migration for visited (clerk_id TEXT -> user_id UUID)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'workplaces' AND table_name = 'visited' AND column_name = 'clerk_id') THEN
        -- Add user_id if not exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'workplaces' AND table_name = 'visited' AND column_name = 'user_id') THEN
            ALTER TABLE workplaces.visited ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        -- Migrate data
        UPDATE workplaces.visited v
        SET user_id = u.id
        FROM public.users u
        WHERE v.clerk_id = u.clerk_id OR v.clerk_id = u.id::text;

        -- Delete orphaned rows
        DELETE FROM workplaces.visited WHERE user_id IS NULL;

        -- Set NOT NULL and UNIQUE
        ALTER TABLE workplaces.visited ALTER COLUMN user_id SET NOT NULL;
        
        -- Drop old column and handle unique constraint
        ALTER TABLE workplaces.visited DROP CONSTRAINT IF EXISTS visited_place_id_clerk_id_key;
        ALTER TABLE workplaces.visited DROP COLUMN clerk_id;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'visited_place_id_user_id_key') THEN
            ALTER TABLE workplaces.visited ADD CONSTRAINT visited_place_id_user_id_key UNIQUE (place_id, user_id);
        END IF;
    END IF;
END $$;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_workplaces_favorites_user_id ON workplaces.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_workplaces_favorites_place_id ON workplaces.favorites(place_id);
CREATE INDEX IF NOT EXISTS idx_workplaces_visited_user_id ON workplaces.visited(user_id);
CREATE INDEX IF NOT EXISTS idx_workplaces_visited_place_id ON workplaces.visited(place_id);

-- 6. Grants
GRANT USAGE ON SCHEMA workplaces TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA workplaces TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA workplaces TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA workplaces TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA workplaces GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA workplaces GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA workplaces GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
