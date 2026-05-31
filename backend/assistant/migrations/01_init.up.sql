CREATE SCHEMA IF NOT EXISTS assistant;

CREATE TABLE IF NOT EXISTS assistant.conversations (
    id TEXT PRIMARY KEY,
    user_clerk_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user
    ON assistant.conversations(user_clerk_id);

CREATE INDEX IF NOT EXISTS idx_assistant_conversations_created_at
    ON assistant.conversations(created_at DESC);

GRANT USAGE ON SCHEMA assistant TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA assistant TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA assistant TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA assistant TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA assistant GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA assistant GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA assistant GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
