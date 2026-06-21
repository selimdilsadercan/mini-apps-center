--------------------------------------------------------------------------------
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- 2026-06-21: Added business_id to feedbacks table to support multi-business feedback boards.
--------------------------------------------------------------------------------

ALTER TABLE feedback_board.feedbacks ADD COLUMN IF NOT EXISTS business_id TEXT REFERENCES business.businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_feedback_board_business_id ON feedback_board.feedbacks(business_id);

--------------------------------------------------------------------------------
-- IDEAL STATE (Current Schema)
--------------------------------------------------------------------------------

-- Create Schema
CREATE SCHEMA IF NOT EXISTS feedback_board;

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA feedback_board TO anon, authenticated, service_role;

-- Feedbacks Table
CREATE TABLE IF NOT EXISTS feedback_board.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    business_id TEXT NOT NULL REFERENCES business.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT feedbacks_status_check CHECK (status IN ('pending', 'planned', 'in-progress', 'completed'))
);

-- Votes Table
CREATE TABLE IF NOT EXISTS feedback_board.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    feedback_id UUID NOT NULL REFERENCES feedback_board.feedbacks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, feedback_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_board_user_id ON feedback_board.feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_board_business_id ON feedback_board.feedbacks(business_id);
CREATE INDEX IF NOT EXISTS idx_feedback_board_votes_feedback_id ON feedback_board.votes(feedback_id);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA feedback_board TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA feedback_board TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA feedback_board GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA feedback_board GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
