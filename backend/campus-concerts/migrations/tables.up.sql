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
    -- campus_concerts.concerts: added_by_clerk_id -> added_by_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'campus_concerts' AND table_name = 'concerts' AND column_name = 'added_by_clerk_id') THEN
        ALTER TABLE campus_concerts.concerts RENAME COLUMN added_by_clerk_id TO added_by_clerk_id_old;
        ALTER TABLE campus_concerts.concerts ADD COLUMN added_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
        
        UPDATE campus_concerts.concerts c
        SET added_by_id = u.id
        FROM public.users u
        WHERE c.added_by_clerk_id_old = u.clerk_id OR c.added_by_clerk_id_old = u.local_clerk_id;
        
        ALTER TABLE campus_concerts.concerts DROP COLUMN added_by_clerk_id_old;
    END IF;

    -- campus_concerts.attendance: user_clerk_id -> user_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'campus_concerts' AND table_name = 'attendance' AND column_name = 'user_clerk_id') THEN
        ALTER TABLE campus_concerts.attendance RENAME COLUMN user_clerk_id TO user_clerk_id_old;
        ALTER TABLE campus_concerts.attendance ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        UPDATE campus_concerts.attendance a
        SET user_id = u.id
        FROM public.users u
        WHERE a.user_clerk_id_old = u.clerk_id OR a.user_clerk_id_old = u.local_clerk_id;
        
        ALTER TABLE campus_concerts.attendance DROP COLUMN user_clerk_id_old;
        
        -- Add unique constraint back
        ALTER TABLE campus_concerts.attendance ADD CONSTRAINT unique_user_concert UNIQUE (user_id, concert_id);
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS campus_concerts;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA campus_concerts TO anon, authenticated, service_role;

-- 2. Campus Concerts Table
CREATE TABLE IF NOT EXISTS campus_concerts.concerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist TEXT NOT NULL,
    campus TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    image_url TEXT,
    added_by_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS campus_concerts.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    concert_id UUID NOT NULL REFERENCES campus_concerts.concerts(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('went', 'going', 'interested')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, concert_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_campus_concerts_campus ON campus_concerts.concerts(campus);
CREATE INDEX IF NOT EXISTS idx_campus_concerts_date ON campus_concerts.concerts(date);
CREATE INDEX IF NOT EXISTS idx_campus_attendance_user ON campus_concerts.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_campus_attendance_concert ON campus_concerts.attendance(concert_id);

-- 5. Grants
GRANT ALL ON ALL TABLES IN SCHEMA campus_concerts TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA campus_concerts TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_concerts GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_concerts GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA campus_concerts GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
