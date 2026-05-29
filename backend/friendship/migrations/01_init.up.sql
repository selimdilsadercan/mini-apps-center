-- Create friendship schema
CREATE SCHEMA IF NOT EXISTS friendship;

-- Create friends table
CREATE TABLE IF NOT EXISTS friendship.friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    user_id_2 TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
    sender_id TEXT NOT NULL REFERENCES public.users(clerk_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id_1, user_id_2)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friendship_friends_user1 ON friendship.friends(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendship_friends_user2 ON friendship.friends(user_id_2);
CREATE INDEX IF NOT EXISTS idx_friendship_friends_status ON friendship.friends(status);

-- Grants
GRANT USAGE ON SCHEMA friendship TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA friendship TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA friendship TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA friendship TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA friendship GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA friendship GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA friendship GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
