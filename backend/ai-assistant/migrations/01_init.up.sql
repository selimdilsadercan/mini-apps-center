CREATE SCHEMA IF NOT EXISTS ai_assistant;

CREATE TABLE IF NOT EXISTS ai_assistant.conversations (
    id TEXT PRIMARY KEY,
    user_clerk_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_assistant_conversations_user
    ON ai_assistant.conversations(user_clerk_id);

CREATE INDEX IF NOT EXISTS idx_ai_assistant_conversations_created_at
    ON ai_assistant.conversations(created_at DESC);

GRANT USAGE ON SCHEMA ai_assistant TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA ai_assistant TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ai_assistant TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA ai_assistant TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ai_assistant GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ai_assistant GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ai_assistant GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
