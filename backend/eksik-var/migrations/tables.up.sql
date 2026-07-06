--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- RULE: 
-- 1. Add new structural changes (ALTER TABLE, etc.) below this line.
-- 2. After each successful migration, these changes MUST be squashed into 
--    the main table definitions (Ideal State) above.
-- 3. Once squashed, the migration logic below should be cleaned up or 
--    moved to a historical record if necessary.
--------------------------------------------------------------------------------

ALTER TABLE eksik_var.missing_items ADD COLUMN IF NOT EXISTS is_used BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE eksik_var.missing_items ADD COLUMN IF NOT EXISTS category TEXT;

CREATE TABLE IF NOT EXISTS eksik_var.shared_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(owner_id, member_id)
);

CREATE TABLE IF NOT EXISTS eksik_var.share_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days' NOT NULL,
    used_at TIMESTAMPTZ
);

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS eksik_var;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA eksik_var TO anon, authenticated, service_role;

-- 2. Missing Items Table
CREATE TABLE IF NOT EXISTS eksik_var.missing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_eksik_var_missing_items_user_id ON eksik_var.missing_items(user_id);

-- 4. Shared Lists Table (Ideal State)
CREATE TABLE IF NOT EXISTS eksik_var.shared_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(owner_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_eksik_var_shared_lists_owner ON eksik_var.shared_lists(owner_id);
CREATE INDEX IF NOT EXISTS idx_eksik_var_shared_lists_member ON eksik_var.shared_lists(member_id);

-- 5. Share Invites Table (Ideal State)
CREATE TABLE IF NOT EXISTS eksik_var.share_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days' NOT NULL,
    used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_eksik_var_share_invites_creator ON eksik_var.share_invites(creator_id);

-- 6. Grants
GRANT ALL ON ALL TABLES IN SCHEMA eksik_var TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA eksik_var TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA eksik_var GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA eksik_var GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA eksik_var GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
