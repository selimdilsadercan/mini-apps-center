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

-- Ensure selected_university and firebase_id columns exist (Migration script rerun support)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'selected_university'
    ) THEN
        ALTER TABLE public.users ADD COLUMN selected_university TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'firebase_id'
    ) THEN
        ALTER TABLE public.users ADD COLUMN firebase_id TEXT UNIQUE;
    END IF;
END $$;

-- Indexes for Users
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_local_clerk_id ON public.users(local_clerk_id) WHERE local_clerk_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_id ON public.users(firebase_id) WHERE firebase_id IS NOT NULL;

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

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'is_onboarding_finished'
    ) THEN
        ALTER TABLE public.user_preferences ADD COLUMN is_onboarding_finished BOOLEAN NOT NULL DEFAULT FALSE;
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

-- 4. User Notification Opt-ins (genel JSON wrapper — uygulama bazlı bildirim izinleri)
-- apps örneği:
-- {
--   "itu_yemekhane": { "enabled": true, "last_lunch_notified_date": "2026-06-22" },
--   "daily_weather": { "enabled": true, "notify_hour": 7 }
-- }
CREATE TABLE IF NOT EXISTS public.user_notification_opt_ins (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    apps JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notification_opt_ins_apps
ON public.user_notification_opt_ins USING gin (apps);

-- Eski ITU-specific tablodan taşı (varsa)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'itu_yemekhane' AND table_name = 'notification_preferences'
    ) THEN
        INSERT INTO public.user_notification_opt_ins (user_id, apps, updated_at)
        SELECT
            np.user_id,
            jsonb_build_object(
                'itu_yemekhane',
                jsonb_strip_nulls(
                    jsonb_build_object(
                        'enabled', np.notifications_enabled,
                        'last_lunch_notified_date', np.last_lunch_notified_date,
                        'last_dinner_notified_date', np.last_dinner_notified_date
                    )
                )
            ),
            COALESCE(np.updated_at, NOW())
        FROM itu_yemekhane.notification_preferences np
        ON CONFLICT (user_id) DO UPDATE SET
            apps = public.user_notification_opt_ins.apps || EXCLUDED.apps,
            updated_at = GREATEST(public.user_notification_opt_ins.updated_at, EXCLUDED.updated_at);

        -- Eski RPC'ler tablo tipine bağlı; önce fonksiyonları kaldır
        DROP FUNCTION IF EXISTS itu_yemekhane.get_notification_preferences(TEXT);
        DROP FUNCTION IF EXISTS itu_yemekhane.upsert_notification_preferences(TEXT, BOOLEAN);
        DROP TABLE itu_yemekhane.notification_preferences;
    END IF;
END $$;

-- 5. Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
