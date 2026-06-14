CREATE TABLE public.feed_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    username TEXT,
    user_avatar TEXT,
    app_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
