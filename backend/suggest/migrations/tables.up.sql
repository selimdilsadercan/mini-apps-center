--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (clerk_id TEXT -> user_id UUID) & share_id fix
DO $$ 
BEGIN 
    -- suggestions table: sender_clerk_id -> sender_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'suggest' AND table_name = 'suggestions' AND column_name = 'sender_clerk_id') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'suggest' AND table_name = 'suggestions' AND column_name = 'sender_id') THEN
            ALTER TABLE suggest.suggestions ADD COLUMN sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        UPDATE suggest.suggestions s
        SET sender_id = u.id
        FROM public.users u
        WHERE s.sender_clerk_id = u.clerk_id OR s.sender_clerk_id = u.local_clerk_id;

        -- Delete orphaned rows
        DELETE FROM suggest.suggestions WHERE sender_id IS NULL;

        ALTER TABLE suggest.suggestions ALTER COLUMN sender_id SET NOT NULL;
        ALTER TABLE suggest.suggestions DROP COLUMN sender_clerk_id;
    END IF;

    -- Ensure share_id column exists and has a default value
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'suggest' AND table_name = 'suggestions' AND column_name = 'share_id') THEN
        ALTER TABLE suggest.suggestions ADD COLUMN share_id TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8);
        -- Backfill existing rows
        UPDATE suggest.suggestions SET share_id = substring(md5(random()::text), 1, 8) WHERE share_id IS NULL;
        ALTER TABLE suggest.suggestions ALTER COLUMN share_id SET NOT NULL;
    ELSE
        -- Ensure default value is set for existing column
        ALTER TABLE suggest.suggestions ALTER COLUMN share_id SET DEFAULT substring(md5(random()::text), 1, 8);
        -- Ensure NOT NULL
        UPDATE suggest.suggestions SET share_id = substring(md5(random()::text), 1, 8) WHERE share_id IS NULL;
        ALTER TABLE suggest.suggestions ALTER COLUMN share_id SET NOT NULL;
    END IF;

    -- recipients table: recipient_clerk_id -> recipient_id
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'suggest' AND table_name = 'recipients' AND column_name = 'recipient_clerk_id') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'suggest' AND table_name = 'recipients' AND column_name = 'recipient_id') THEN
            ALTER TABLE suggest.recipients ADD COLUMN recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        UPDATE suggest.recipients r
        SET recipient_id = u.id
        FROM public.users u
        WHERE r.recipient_clerk_id = u.clerk_id OR r.recipient_clerk_id = u.local_clerk_id;

        -- Delete orphaned rows
        DELETE FROM suggest.recipients WHERE recipient_id IS NULL;

        ALTER TABLE suggest.recipients ALTER COLUMN recipient_id SET NOT NULL;
        ALTER TABLE suggest.recipients DROP COLUMN recipient_clerk_id;
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS suggest;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA suggest TO anon, authenticated, service_role;

-- 2. Suggestions Table
CREATE TABLE IF NOT EXISTS suggest.suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('song', 'movie', 'tv', 'video', 'place', 'book')),
    title TEXT NOT NULL,
    short_note TEXT,
    rating DECIMAL CHECK (rating >= 0 AND rating <= 5),
    external_link TEXT,
    image_url TEXT,
    preview_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    reaction TEXT CHECK (reaction IN ('loved', 'skull', 'saved', 'mid', 'perfect')),
    is_daily_pick BOOLEAN DEFAULT FALSE,
    sender_deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Recipients Table
CREATE TABLE IF NOT EXISTS suggest.recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id UUID NOT NULL REFERENCES suggest.suggestions(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'saved', 'completed', 'ignored')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(suggestion_id, recipient_id)
);

-- 4. Indices
CREATE INDEX IF NOT EXISTS idx_suggest_suggestions_sender ON suggest.suggestions(sender_id);
CREATE INDEX IF NOT EXISTS idx_suggest_suggestions_share_id ON suggest.suggestions(share_id);
CREATE INDEX IF NOT EXISTS idx_suggest_recipients_recipient ON suggest.recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_suggest_recipients_suggestion ON suggest.recipients(suggestion_id);

-- 5. Grants
GRANT ALL ON ALL TABLES IN SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA suggest TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
