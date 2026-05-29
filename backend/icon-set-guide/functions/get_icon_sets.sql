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
BEGIN
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
            WHERE f.icon_set_id = i.id AND f.clerk_id = clerk_id_param
        ) AS is_favorited
    FROM icon_set_guide.icon_sets i
    ORDER BY i.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
