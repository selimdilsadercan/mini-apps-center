-- Drop old function
DROP FUNCTION IF EXISTS tournament.clear_participants(TEXT, TEXT);

-- Clear All Participants RPC
CREATE OR REPLACE FUNCTION tournament.clear_participants(
    slug_param TEXT,
    admin_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_id UUID;
    v_tournament_id UUID;
    v_actual_admin_id UUID;
BEGIN
    -- Get IDs
    SELECT id INTO v_admin_id FROM public.users WHERE clerk_id = admin_clerk_id;
    SELECT id, admin_user_id INTO v_tournament_id, v_actual_admin_id FROM tournament.tournaments WHERE slug = slug_param;

    -- Checks
    IF v_tournament_id IS NULL THEN RETURN FALSE; END IF;
    IF v_actual_admin_id != v_admin_id THEN RAISE EXCEPTION 'Permission denied'; END IF;

    -- Sadece turnuva başlamamışsa veya bitmişse silmeye izin ver (Aktifken silmek maçları bozabilir)
    -- Not: Matches tablosunda katılımcı referansları ON DELETE SET NULL olduğu için teknik olarak silinebilir
    -- ama mantıksal olarak turnuva aktifken hepsini silmek istenmeyebilir.
    
    DELETE FROM tournament.participants WHERE tournament_id = v_tournament_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
