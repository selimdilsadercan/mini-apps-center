--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS ev_isleri;

GRANT USAGE ON SCHEMA ev_isleri TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS ev_isleri.boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS ev_isleri.board_members (
    board_id UUID NOT NULL REFERENCES ev_isleri.boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (board_id, user_id)
);

CREATE TABLE IF NOT EXISTS ev_isleri.board_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES ev_isleri.boards(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days' NOT NULL,
    used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ev_isleri.custom_chores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES ev_isleri.boards(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (board_id, slug)
);

CREATE TABLE IF NOT EXISTS ev_isleri.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES ev_isleri.boards(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    chore_slug TEXT NOT NULL,
    chore_name TEXT NOT NULL,
    chore_icon TEXT,
    assignee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (board_id, week_start, day_of_week, chore_slug)
);

CREATE INDEX IF NOT EXISTS idx_ev_isleri_boards_owner ON ev_isleri.boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_ev_isleri_board_members_user ON ev_isleri.board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ev_isleri_assignments_board_week ON ev_isleri.assignments(board_id, week_start);
CREATE INDEX IF NOT EXISTS idx_ev_isleri_board_invites_board ON ev_isleri.board_invites(board_id);

GRANT ALL ON ALL TABLES IN SCHEMA ev_isleri TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA ev_isleri TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ev_isleri GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ev_isleri GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA ev_isleri GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
