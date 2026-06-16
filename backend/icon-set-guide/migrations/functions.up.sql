-- FUNCTIONS
-- 1. icon_set_guide.get_icon_sets
-- 2. icon_set_guide.get_icon_set_detail
-- 3. icon_set_guide.toggle_favorite

-- 1. Get Icon Sets
DROP FUNCTION IF EXISTS icon_set_guide.get_icon_sets(TEXT);
CREATE OR REPLACE FUNCTION icon_set_guide.get_icon_sets(clerk_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    license TEXT,
    frameworks TEXT[],
    styles TEXT[],
    best_for TEXT[],
    vibes TEXT[],
    website_url TEXT,
    github_url TEXT,
    npm_command TEXT,
    detailed_description TEXT,
    is_favorited BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT 
        i.id,
        i.name,
        i.description,
        i.license,
        i.frameworks,
        i.styles,
        i.best_for,
        i.vibes,
        i.website_url,
        i.github_url,
        i.npm_command,
        i.detailed_description,
        EXISTS (
            SELECT 1 FROM icon_set_guide.favorites f 
            WHERE f.icon_set_id = i.id AND f.user_id = v_user_id
        ) AS is_favorited
    FROM icon_set_guide.icon_sets i
    ORDER BY i.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Icon Set Detail
DROP FUNCTION IF EXISTS icon_set_guide.get_icon_set_detail(TEXT, TEXT);
CREATE OR REPLACE FUNCTION icon_set_guide.get_icon_set_detail(id_param TEXT, clerk_id_param TEXT)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    license TEXT,
    frameworks TEXT[],
    styles TEXT[],
    best_for TEXT[],
    vibes TEXT[],
    website_url TEXT,
    github_url TEXT,
    npm_command TEXT,
    detailed_description TEXT,
    is_favorited BOOLEAN
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT 
        i.id,
        i.name,
        i.description,
        i.license,
        i.frameworks,
        i.styles,
        i.best_for,
        i.vibes,
        i.website_url,
        i.github_url,
        i.npm_command,
        i.detailed_description,
        EXISTS (
            SELECT 1 FROM icon_set_guide.favorites f 
            WHERE f.icon_set_id = i.id AND f.user_id = v_user_id
        ) AS is_favorited
    FROM icon_set_guide.icon_sets i
    WHERE i.id = id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Toggle Favorite
DROP FUNCTION IF EXISTS icon_set_guide.toggle_favorite(TEXT, TEXT);
CREATE OR REPLACE FUNCTION icon_set_guide.toggle_favorite(clerk_id_param TEXT, icon_set_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM icon_set_guide.favorites
        WHERE user_id = v_user_id AND icon_set_id = icon_set_id_param
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM icon_set_guide.favorites
        WHERE user_id = v_user_id AND icon_set_id = icon_set_id_param;
        RETURN FALSE;
    ELSE
        INSERT INTO icon_set_guide.favorites (user_id, icon_set_id)
        VALUES (v_user_id, icon_set_id_param);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
