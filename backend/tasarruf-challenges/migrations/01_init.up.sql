-- Initial setup for social tasarruf_challenges
CREATE SCHEMA IF NOT EXISTS tasarruf_challenges;

-- Posts table for community sharing
CREATE TABLE IF NOT EXISTS tasarruf_challenges.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_image TEXT,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) DEFAULT 0,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC Functions

-- 1. Create Post
DROP FUNCTION IF EXISTS tasarruf_challenges.create_post(TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION tasarruf_challenges.create_post(
    p_user_id TEXT,
    p_user_name TEXT,
    p_user_image TEXT,
    p_description TEXT,
    p_amount NUMERIC,
    p_category TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_post_id UUID;
BEGIN
    INSERT INTO tasarruf_challenges.posts (user_id, user_name, user_image, description, amount, category)
    VALUES (p_user_id, p_user_name, p_user_image, p_description, p_amount, p_category)
    RETURNING id INTO v_post_id;
    
    RETURN v_post_id;
END;
$$;

-- 2. Get Feed
DROP FUNCTION IF EXISTS tasarruf_challenges.get_feed(INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION tasarruf_challenges.get_feed(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    user_name TEXT,
    user_image TEXT,
    description TEXT,
    amount NUMERIC,
    category TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.user_name,
        p.user_image,
        p.description,
        p.amount,
        p.category,
        p.created_at
    FROM tasarruf_challenges.posts p
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 3. Get Stats
DROP FUNCTION IF EXISTS tasarruf_challenges.get_stats(TEXT);
CREATE OR REPLACE FUNCTION tasarruf_challenges.get_stats(p_user_id TEXT)
RETURNS TABLE (
    user_total_savings NUMERIC,
    user_post_count BIGINT,
    community_total_savings NUMERIC,
    community_post_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT SUM(amount) FROM tasarruf_challenges.posts WHERE user_id = p_user_id), 0) as user_total_savings,
        (SELECT COUNT(*) FROM tasarruf_challenges.posts WHERE user_id = p_user_id) as user_post_count,
        COALESCE((SELECT SUM(amount) FROM tasarruf_challenges.posts), 0) as community_total_savings,
        (SELECT COUNT(*) FROM tasarruf_challenges.posts) as community_post_count;
END;
$$;

-- Permissions
GRANT USAGE ON SCHEMA tasarruf_challenges TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA tasarruf_challenges TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tasarruf_challenges TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA tasarruf_challenges TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasarruf_challenges GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasarruf_challenges GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasarruf_challenges GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
