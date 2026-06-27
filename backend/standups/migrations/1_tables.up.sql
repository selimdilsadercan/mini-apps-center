-- 1. Comedians Table
CREATE TABLE IF NOT EXISTS public.standup_comedians (
    id TEXT PRIMARY KEY DEFAULT substring(md5(random()::text), 1, 8),
    business_id TEXT REFERENCES business.businesses(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    bio TEXT,
    image_url TEXT,
    youtube_channel_id TEXT,
    instagram_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Shows Table
CREATE TABLE IF NOT EXISTS public.standup_shows (
    id TEXT PRIMARY KEY DEFAULT substring(md5(random()::text), 1, 8),
    comedian_id TEXT NOT NULL REFERENCES public.standup_comedians(id) ON DELETE CASCADE,
    venue_business_id TEXT REFERENCES business.businesses(id) ON DELETE SET NULL,
    venue_name TEXT, -- Fallback if not an Everything business
    title TEXT NOT NULL,
    description TEXT,
    show_date TIMESTAMPTZ NOT NULL,
    ticket_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Videos Table (YouTube content)
CREATE TABLE IF NOT EXISTS public.standup_videos (
    id TEXT PRIMARY KEY DEFAULT substring(md5(random()::text), 1, 8),
    comedian_id TEXT NOT NULL REFERENCES public.standup_comedians(id) ON DELETE CASCADE,
    youtube_video_id TEXT NOT NULL,
    title TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(comedian_id, youtube_video_id)
);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
