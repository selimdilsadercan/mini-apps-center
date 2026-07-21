-- FUNCTIONS
-- 1. contributions.add_contribution
-- 2. contributions.get_contributions
-- 3. contributions.get_contribution
-- 4. contributions.approve_contribution

-- 1. Add Contribution
DROP FUNCTION IF EXISTS contributions.add_contribution(TEXT, TEXT, TEXT, TEXT, JSONB);
CREATE OR REPLACE FUNCTION contributions.add_contribution(
    p_user_id TEXT,
    content_type_param TEXT,
    title_param TEXT,
    image_url_param TEXT,
    data_param JSONB
)
RETURNS contributions.contributions AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    v_result contributions.contributions;
BEGIN
    INSERT INTO contributions.contributions (
        created_user_id,
        content_type,
        title,
        image_url,
        data,
        approved -- Yeni tarifler onay bekler (default false)
    ) VALUES (
        v_user_id,
        content_type_param,
        title_param,
        image_url_param,
        data_param,
        FALSE
    ) RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Contributions by Type
DROP FUNCTION IF EXISTS contributions.get_contributions(TEXT);
DROP FUNCTION IF EXISTS contributions.get_contributions(TEXT, BOOLEAN);
CREATE OR REPLACE FUNCTION contributions.get_contributions(
    content_type_param TEXT,
    only_approved_param BOOLEAN
)
RETURNS TABLE (
    id UUID,
    created_user_id UUID,
    content_type TEXT,
    title TEXT,
    image_url TEXT,
    data JSONB,
    approved BOOLEAN,
    created_at TIMESTAMPTZ,
    contributor_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.created_user_id,
        c.content_type,
        c.title,
        c.image_url,
        c.data,
        c.approved,
        c.created_at,
        COALESCE(u.full_name, u.username, 'Topluluk Üyesi') AS contributor_name
    FROM contributions.contributions c
    LEFT JOIN public.users u ON c.created_user_id = u.id
    WHERE c.content_type = content_type_param
      AND (NOT only_approved_param OR c.approved = TRUE)
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get Contribution by ID
DROP FUNCTION IF EXISTS contributions.get_contribution(UUID);
CREATE OR REPLACE FUNCTION contributions.get_contribution(p_id UUID)
RETURNS TABLE (
    id UUID,
    created_user_id UUID,
    content_type TEXT,
    title TEXT,
    image_url TEXT,
    data JSONB,
    approved BOOLEAN,
    created_at TIMESTAMPTZ,
    contributor_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.created_user_id,
        c.content_type,
        c.title,
        c.image_url,
        c.data,
        c.approved,
        c.created_at,
        COALESCE(u.full_name, u.username, 'Topluluk Üyesi') AS contributor_name
    FROM contributions.contributions c
    LEFT JOIN public.users u ON c.created_user_id = u.id
    WHERE c.id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Approve or Reject/Delete Contribution
DROP FUNCTION IF EXISTS contributions.approve_contribution(UUID, BOOLEAN);
CREATE OR REPLACE FUNCTION contributions.approve_contribution(
    p_id UUID,
    p_approved BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_approved THEN
        UPDATE contributions.contributions
        SET approved = TRUE
        WHERE id = p_id;
    ELSE
        DELETE FROM contributions.contributions
        WHERE id = p_id;
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
