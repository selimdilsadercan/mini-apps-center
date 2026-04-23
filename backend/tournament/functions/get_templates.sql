-- Get Tournament Templates RPC
CREATE OR REPLACE FUNCTION tournament.get_templates()
RETURNS SETOF tournament.templates AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM tournament.templates
    ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
