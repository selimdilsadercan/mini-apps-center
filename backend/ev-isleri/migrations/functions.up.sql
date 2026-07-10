-- FUNCTIONS
-- 1. ev_isleri.user_can_access_board
-- 2. ev_isleri.get_boards
-- 3. ev_isleri.create_board
-- 4. ev_isleri.get_board
-- 5. ev_isleri.delete_board
-- 6. ev_isleri.get_board_members
-- 7. ev_isleri.create_board_invite
-- 8. ev_isleri.get_board_invite_details
-- 9. ev_isleri.accept_board_invite
-- 10. ev_isleri.add_board_member
-- 11. ev_isleri.remove_board_member
-- 12. ev_isleri.get_week_plan
-- 13. ev_isleri.set_assignment
-- 14. ev_isleri.remove_assignment
-- 15. ev_isleri.toggle_assignment_complete

-- 1. Access check
DROP FUNCTION IF EXISTS ev_isleri.user_can_access_board(UUID, UUID);
CREATE OR REPLACE FUNCTION ev_isleri.user_can_access_board(
    p_user_id UUID,
    p_board_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM ev_isleri.board_members bm
        WHERE bm.board_id = p_board_id
          AND bm.user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get boards for user
DROP FUNCTION IF EXISTS ev_isleri.get_boards(TEXT);
CREATE OR REPLACE FUNCTION ev_isleri.get_boards(p_clerk_id TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    owner_id UUID,
    member_count BIGINT,
    my_role TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    RETURN QUERY
    SELECT
        b.id,
        b.name,
        b.owner_id,
        (
            SELECT COUNT(*)::BIGINT
            FROM ev_isleri.board_members bm
            WHERE bm.board_id = b.id
        ) AS member_count,
        bm.role AS my_role,
        b.created_at
    FROM ev_isleri.boards b
    JOIN ev_isleri.board_members bm
        ON bm.board_id = b.id AND bm.user_id = v_user_id
    ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create board
DROP FUNCTION IF EXISTS ev_isleri.create_board(TEXT, TEXT);
CREATE OR REPLACE FUNCTION ev_isleri.create_board(
    p_clerk_id TEXT,
    p_name TEXT
)
RETURNS ev_isleri.boards AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_board ev_isleri.boards;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO ev_isleri.boards (name, owner_id)
    VALUES (TRIM(p_name), v_user_id)
    RETURNING * INTO v_board;

    INSERT INTO ev_isleri.board_members (board_id, user_id, role)
    VALUES (v_board.id, v_user_id, 'owner')
    ON CONFLICT DO NOTHING;

    RETURN v_board;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get board
DROP FUNCTION IF EXISTS ev_isleri.get_board(TEXT, UUID);
CREATE OR REPLACE FUNCTION ev_isleri.get_board(
    p_clerk_id TEXT,
    p_board_id UUID
)
RETURNS ev_isleri.boards AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_board ev_isleri.boards;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_user_id, p_board_id) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT * INTO v_board
    FROM ev_isleri.boards
    WHERE id = p_board_id;

    IF v_board IS NULL THEN
        RAISE EXCEPTION 'Board not found';
    END IF;

    RETURN v_board;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Delete board
DROP FUNCTION IF EXISTS ev_isleri.delete_board(TEXT, UUID);
CREATE OR REPLACE FUNCTION ev_isleri.delete_board(
    p_clerk_id TEXT,
    p_board_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    DELETE FROM ev_isleri.boards
    WHERE id = p_board_id AND owner_id = v_user_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Get board members
DROP FUNCTION IF EXISTS ev_isleri.get_board_members(TEXT, UUID);
CREATE OR REPLACE FUNCTION ev_isleri.get_board_members(
    p_clerk_id TEXT,
    p_board_id UUID
)
RETURNS TABLE (
    user_id UUID,
    clerk_id TEXT,
    username TEXT,
    avatar_url TEXT,
    role TEXT
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_user_id, p_board_id) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT
        bm.user_id,
        u.clerk_id::TEXT,
        u.username::TEXT,
        u.avatar_url::TEXT,
        bm.role
    FROM ev_isleri.board_members bm
    JOIN public.users u ON u.id = bm.user_id
    WHERE bm.board_id = p_board_id
    ORDER BY
        CASE WHEN bm.role = 'owner' THEN 0 ELSE 1 END,
        bm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create board invite
DROP FUNCTION IF EXISTS ev_isleri.create_board_invite(TEXT, UUID);
CREATE OR REPLACE FUNCTION ev_isleri.create_board_invite(
    p_clerk_id TEXT,
    p_board_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_invite_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_user_id, p_board_id) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    INSERT INTO ev_isleri.board_invites (board_id, creator_id)
    VALUES (p_board_id, v_user_id)
    RETURNING id INTO v_invite_id;

    RETURN v_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Get board invite details
DROP FUNCTION IF EXISTS ev_isleri.get_board_invite_details(UUID);
CREATE OR REPLACE FUNCTION ev_isleri.get_board_invite_details(p_invite_id UUID)
RETURNS TABLE (
    board_id UUID,
    board_name TEXT,
    creator_username TEXT,
    is_expired BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.board_id,
        b.name::TEXT AS board_name,
        u.username::TEXT AS creator_username,
        (i.expires_at < NOW() OR i.used_at IS NOT NULL) AS is_expired
    FROM ev_isleri.board_invites i
    JOIN ev_isleri.boards b ON b.id = i.board_id
    JOIN public.users u ON u.id = i.creator_id
    WHERE i.id = p_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Accept board invite
DROP FUNCTION IF EXISTS ev_isleri.accept_board_invite(UUID, TEXT);
CREATE OR REPLACE FUNCTION ev_isleri.accept_board_invite(
    p_invite_id UUID,
    p_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_board_id UUID;
    v_expired BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT board_id, (expires_at < NOW() OR used_at IS NOT NULL)
    INTO v_board_id, v_expired
    FROM ev_isleri.board_invites
    WHERE id = p_invite_id;

    IF v_board_id IS NULL THEN
        RAISE EXCEPTION 'Invite not found';
    END IF;

    IF v_expired THEN
        RAISE EXCEPTION 'Invite expired or already used';
    END IF;

    UPDATE ev_isleri.board_invites
    SET used_at = NOW()
    WHERE id = p_invite_id;

    INSERT INTO ev_isleri.board_members (board_id, user_id, role)
    VALUES (v_board_id, v_user_id, 'member')
    ON CONFLICT (board_id, user_id) DO NOTHING;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Add board member by friend clerk id
DROP FUNCTION IF EXISTS ev_isleri.add_board_member(TEXT, UUID, TEXT);
CREATE OR REPLACE FUNCTION ev_isleri.add_board_member(
    p_clerk_id TEXT,
    p_board_id UUID,
    p_friend_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_friend_id UUID := public.get_internal_user_id(p_friend_clerk_id);
BEGIN
    IF v_user_id IS NULL OR v_friend_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_user_id, p_board_id) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    IF v_user_id = v_friend_id THEN
        RAISE EXCEPTION 'Cannot add yourself';
    END IF;

    INSERT INTO ev_isleri.board_members (board_id, user_id, role)
    VALUES (p_board_id, v_friend_id, 'member')
    ON CONFLICT (board_id, user_id) DO NOTHING;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Remove board member
DROP FUNCTION IF EXISTS ev_isleri.remove_board_member(TEXT, UUID, TEXT);
CREATE OR REPLACE FUNCTION ev_isleri.remove_board_member(
    p_clerk_id TEXT,
    p_board_id UUID,
    p_target_clerk_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_target_id UUID := public.get_internal_user_id(p_target_clerk_id);
    v_is_owner BOOLEAN;
BEGIN
    IF v_user_id IS NULL OR v_target_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM ev_isleri.boards
        WHERE id = p_board_id AND owner_id = v_user_id
    ) INTO v_is_owner;

    IF NOT v_is_owner AND v_user_id <> v_target_id THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    DELETE FROM ev_isleri.board_members
    WHERE board_id = p_board_id
      AND user_id = v_target_id
      AND role <> 'owner';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Get week plan
DROP FUNCTION IF EXISTS ev_isleri.get_week_plan(TEXT, UUID, DATE);
CREATE OR REPLACE FUNCTION ev_isleri.get_week_plan(
    p_clerk_id TEXT,
    p_board_id UUID,
    p_week_start DATE
)
RETURNS TABLE (
    id UUID,
    day_of_week SMALLINT,
    chore_slug TEXT,
    chore_name TEXT,
    chore_icon TEXT,
    assignee_id UUID,
    assignee_clerk_id TEXT,
    assignee_username TEXT,
    assignee_avatar_url TEXT,
    completed_at TIMESTAMPTZ,
    completed_by UUID
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_user_id, p_board_id) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT
        a.id,
        a.day_of_week,
        a.chore_slug,
        a.chore_name,
        a.chore_icon,
        a.assignee_id,
        u.clerk_id::TEXT AS assignee_clerk_id,
        u.username::TEXT AS assignee_username,
        u.avatar_url::TEXT AS assignee_avatar_url,
        a.completed_at,
        a.completed_by
    FROM ev_isleri.assignments a
    JOIN public.users u ON u.id = a.assignee_id
    WHERE a.board_id = p_board_id
      AND a.week_start = p_week_start
    ORDER BY a.day_of_week ASC, a.chore_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Set assignment
DROP FUNCTION IF EXISTS ev_isleri.set_assignment(TEXT, UUID, DATE, SMALLINT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION ev_isleri.set_assignment(
    p_clerk_id TEXT,
    p_board_id UUID,
    p_week_start DATE,
    p_day_of_week SMALLINT,
    p_chore_slug TEXT,
    p_chore_name TEXT,
    p_chore_icon TEXT,
    p_assignee_clerk_id TEXT
)
RETURNS ev_isleri.assignments AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_assignee_id UUID := public.get_internal_user_id(p_assignee_clerk_id);
    v_result ev_isleri.assignments;
BEGIN
    IF v_user_id IS NULL OR v_assignee_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_user_id, p_board_id) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_assignee_id, p_board_id) THEN
        RAISE EXCEPTION 'Assignee is not a board member';
    END IF;

    IF p_day_of_week < 1 OR p_day_of_week > 7 THEN
        RAISE EXCEPTION 'day_of_week must be between 1 and 7';
    END IF;

    INSERT INTO ev_isleri.assignments (
        board_id,
        week_start,
        day_of_week,
        chore_slug,
        chore_name,
        chore_icon,
        assignee_id
    ) VALUES (
        p_board_id,
        p_week_start,
        p_day_of_week,
        p_chore_slug,
        TRIM(p_chore_name),
        NULLIF(TRIM(p_chore_icon), ''),
        v_assignee_id
    )
    ON CONFLICT (board_id, week_start, day_of_week, chore_slug)
    DO UPDATE SET
        chore_name = EXCLUDED.chore_name,
        chore_icon = EXCLUDED.chore_icon,
        assignee_id = EXCLUDED.assignee_id,
        completed_at = NULL,
        completed_by = NULL
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Remove assignment
DROP FUNCTION IF EXISTS ev_isleri.remove_assignment(TEXT, UUID);
CREATE OR REPLACE FUNCTION ev_isleri.remove_assignment(
    p_clerk_id TEXT,
    p_assignment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_board_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT board_id INTO v_board_id
    FROM ev_isleri.assignments
    WHERE id = p_assignment_id;

    IF v_board_id IS NULL THEN
        RAISE EXCEPTION 'Assignment not found';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_user_id, v_board_id) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    DELETE FROM ev_isleri.assignments
    WHERE id = p_assignment_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Toggle assignment complete
DROP FUNCTION IF EXISTS ev_isleri.toggle_assignment_complete(TEXT, UUID);
CREATE OR REPLACE FUNCTION ev_isleri.toggle_assignment_complete(
    p_clerk_id TEXT,
    p_assignment_id UUID
)
RETURNS ev_isleri.assignments AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_clerk_id);
    v_board_id UUID;
    v_result ev_isleri.assignments;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    SELECT board_id INTO v_board_id
    FROM ev_isleri.assignments
    WHERE id = p_assignment_id;

    IF v_board_id IS NULL THEN
        RAISE EXCEPTION 'Assignment not found';
    END IF;

    IF NOT ev_isleri.user_can_access_board(v_user_id, v_board_id) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE ev_isleri.assignments
    SET
        completed_at = CASE WHEN completed_at IS NULL THEN NOW() ELSE NULL END,
        completed_by = CASE WHEN completed_at IS NULL THEN v_user_id ELSE NULL END
    WHERE id = p_assignment_id
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
