--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

-- 1. Migration: Internal UUID Transition (clerk_id TEXT -> user_id UUID)
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'friends' AND column_name = 'user_id_1' AND data_type = 'text') THEN
        -- Rename old columns
        ALTER TABLE public.friends RENAME COLUMN user_id_1 TO user_id_1_old;
        ALTER TABLE public.friends RENAME COLUMN user_id_2 TO user_id_2_old;
        ALTER TABLE public.friends RENAME COLUMN sender_id TO sender_id_old;
        
        -- Add new UUID columns
        ALTER TABLE public.friends ADD COLUMN user_id_1 UUID REFERENCES public.users(id) ON DELETE CASCADE;
        ALTER TABLE public.friends ADD COLUMN user_id_2 UUID REFERENCES public.users(id) ON DELETE CASCADE;
        ALTER TABLE public.friends ADD COLUMN sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
        
        -- Migrate data
        UPDATE public.friends f
        SET user_id_1 = u1.id,
            user_id_2 = u2.id,
            sender_id = us.id
        FROM public.users u1, public.users u2, public.users us
        WHERE (f.user_id_1_old = u1.clerk_id OR f.user_id_1_old = u1.local_clerk_id)
          AND (f.user_id_2_old = u2.clerk_id OR f.user_id_2_old = u2.local_clerk_id)
          AND (f.sender_id_old = us.clerk_id OR f.sender_id_old = us.local_clerk_id);
          
        -- Drop old columns
        ALTER TABLE public.friends DROP COLUMN user_id_1_old;
        ALTER TABLE public.friends DROP COLUMN user_id_2_old;
        ALTER TABLE public.friends DROP COLUMN sender_id_old;
        
        -- Add unique constraint back
        ALTER TABLE public.friends ADD CONSTRAINT friends_user_id_1_user_id_2_key UNIQUE (user_id_1, user_id_2);
    END IF;
END $$;

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Friends Table (in public schema)
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id_1, user_id_2)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_friends_user1 ON public.friends(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friends_user2 ON public.friends(user_id_2);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);

-- 3. Grants
GRANT ALL ON TABLE public.friends TO anon, authenticated, service_role;
