-- Friends table (in public schema)
CREATE TABLE IF NOT EXISTS public.friends (
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
CREATE INDEX IF NOT EXISTS idx_friends_user1 ON public.friends(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friends_user2 ON public.friends(user_id_2);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);

-- Grants
GRANT ALL ON TABLE public.friends TO anon, authenticated, service_role;
