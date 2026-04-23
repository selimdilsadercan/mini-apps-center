-- Delete Tournament RPC
CREATE OR REPLACE FUNCTION tournament.delete_tournament(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_tournament_id UUID;
    v_actual_admin_id UUID;
BEGIN
    SELECT id INTO v_admin_id FROM public.users WHERE clerk_id = admin_clerk_id;
    SELECT id, admin_user_id INTO v_tournament_id, v_actual_admin_id FROM tournament.tournaments WHERE slug = slug_param;

    IF v_tournament_id IS NULL THEN RETURN FALSE; END IF;
    IF v_actual_admin_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;

    DELETE FROM tournament.tournaments WHERE id = v_tournament_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
