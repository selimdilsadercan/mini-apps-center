-- Add pinned_apps and last_used_apps to user_preferences
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'pinned_apps'
    ) THEN
        ALTER TABLE public.user_preferences ADD COLUMN pinned_apps JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_preferences' AND column_name = 'last_used_apps'
    ) THEN
        ALTER TABLE public.user_preferences ADD COLUMN last_used_apps JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
END $$;
