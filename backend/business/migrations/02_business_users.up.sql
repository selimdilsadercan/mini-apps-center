-- 5. Business Users Table
CREATE TABLE IF NOT EXISTS business.business_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL REFERENCES business.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(business_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_users_biz ON business.business_users(business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_user ON business.business_users(user_id);

-- Grants
GRANT ALL ON business.business_users TO anon, authenticated, service_role;
