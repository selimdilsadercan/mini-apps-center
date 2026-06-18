-- 1. Users Table (Core)
-- Note: The base 'users' table is often created by Encore or Supabase Auth, 
-- but we ensure our custom columns and structure exist.
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT UNIQUE NOT NULL,
    local_clerk_id TEXT UNIQUE,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    selected_university TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure selected_university column exists (Migration script rerun support)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'selected_university'
    ) THEN
        ALTER TABLE public.users ADD COLUMN selected_university TEXT;
    END IF;
END $$;

-- Indexes for Users
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_local_clerk_id ON public.users(local_clerk_id) WHERE local_clerk_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    app_order JSONB NOT NULL DEFAULT '[]',
    selected_university TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure selected_university column exists in user_preferences as well
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'selected_university'
    ) THEN
        ALTER TABLE public.user_preferences ADD COLUMN selected_university TEXT;
    END IF;
END $$;

-- 3. User FCM Tokens Table
CREATE TABLE IF NOT EXISTS public.user_fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    device_type TEXT, -- 'web', 'ios', 'android'
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(clerk_id, fcm_token)
);

CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_clerk_id ON public.user_fcm_tokens(clerk_id);
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_token ON public.user_fcm_tokens(fcm_token);

-- 4. Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
