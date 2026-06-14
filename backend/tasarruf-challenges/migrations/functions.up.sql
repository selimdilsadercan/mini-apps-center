-- FUNCTIONS
-- 1. tasarruf_challenges.create_post
-- 2. tasarruf_challenges.get_feed
-- 3. tasarruf_challenges.get_stats
-- 4. tasarruf_challenges.update_post

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
RETURNS UUID AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_post_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for p_user_id %', p_user_id;
    END IF;

    INSERT INTO tasarruf_challenges.posts (user_id, user_name, user_image, description, amount, category)
    VALUES (v_user_id, p_user_name, p_user_image, p_description, p_amount, p_category)
    RETURNING id INTO v_post_id;
    
    RETURN v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Feed
DROP FUNCTION IF EXISTS tasarruf_challenges.get_feed(INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION tasarruf_challenges.get_feed(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_name TEXT,
    user_image TEXT,
    description TEXT,
    amount NUMERIC,
    category TEXT,
    created_at TIMESTAMPTZ
) AS $$
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Get Stats
DROP FUNCTION IF EXISTS tasarruf_challenges.get_stats(TEXT);
CREATE OR REPLACE FUNCTION tasarruf_challenges.get_stats(p_user_id TEXT)
RETURNS TABLE (
    user_total_savings NUMERIC,
    user_month_savings NUMERIC
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT SUM((payload->>'amount')::numeric) FROM public.feed_events WHERE app_id = 'tasarruf-challenges' AND user_id = v_user_id), 0) as user_total_savings,
        COALESCE((SELECT SUM((payload->>'amount')::numeric) FROM public.feed_events WHERE app_id = 'tasarruf-challenges' AND user_id = v_user_id AND created_at >= date_trunc('month', now())), 0) as user_month_savings;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Update Post
DROP FUNCTION IF EXISTS tasarruf_challenges.update_post(UUID, TEXT, TEXT, NUMERIC, TEXT);
CREATE OR REPLACE FUNCTION tasarruf_challenges.update_post(
    p_post_id UUID,
    p_user_id TEXT,
    p_description TEXT,
    p_amount NUMERIC,
    p_category TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    UPDATE tasarruf_challenges.posts
    SET description = p_description,
        amount = p_amount,
        category = p_category
    WHERE id = p_post_id AND user_id = v_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA tasarruf_challenges TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasarruf_challenges GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
