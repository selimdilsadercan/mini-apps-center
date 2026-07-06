-- FUNCTIONS
-- 1. eksik_var.get_missing_items
-- 2. eksik_var.add_missing_item
-- 3. eksik_var.delete_missing_item
-- 4. eksik_var.toggle_item_used
-- 5. eksik_var.create_share_invite
-- 6. eksik_var.get_invite_details
-- 7. eksik_var.accept_share_invite
-- 8. eksik_var.get_shared_members
-- 9. eksik_var.remove_shared_member
-- 10. eksik_var.share_list_with_friend
-- 11. eksik_var.update_missing_item

-- 1. Get Missing Items
DROP FUNCTION IF EXISTS eksik_var.get_missing_items(TEXT);
CREATE OR REPLACE FUNCTION eksik_var.get_missing_items(clerk_id_param TEXT)
RETURNS SETOF eksik_var.missing_items AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);

    RETURN QUERY
    SELECT * FROM eksik_var.missing_items
    WHERE user_id = v_user_id
       OR user_id IN (SELECT owner_id FROM eksik_var.shared_lists WHERE member_id = v_user_id)
       OR user_id IN (SELECT member_id FROM eksik_var.shared_lists WHERE owner_id = v_user_id)
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add Missing Item
DROP FUNCTION IF EXISTS eksik_var.add_missing_item(TEXT, TEXT);
DROP FUNCTION IF EXISTS eksik_var.add_missing_item(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION eksik_var.add_missing_item(
    clerk_id_param TEXT,
    name_param TEXT,
    category_param TEXT DEFAULT NULL
)
RETURNS eksik_var.missing_items AS $$
DECLARE
    v_user_id UUID;
    v_new_item eksik_var.missing_items;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    INSERT INTO eksik_var.missing_items (
        user_id, name, category
    ) VALUES (
        v_user_id, name_param, category_param
    ) RETURNING * INTO v_new_item;
    
    RETURN v_new_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Delete Missing Item
DROP FUNCTION IF EXISTS eksik_var.delete_missing_item(UUID, TEXT);
CREATE OR REPLACE FUNCTION eksik_var.delete_missing_item(
    item_id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    deleted_count INTEGER;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    DELETE FROM eksik_var.missing_items
    WHERE id = item_id_param AND (
        user_id = v_user_id 
        OR user_id IN (SELECT owner_id FROM eksik_var.shared_lists WHERE member_id = v_user_id)
        OR user_id IN (SELECT member_id FROM eksik_var.shared_lists WHERE owner_id = v_user_id)
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Toggle Item Used
DROP FUNCTION IF EXISTS eksik_var.toggle_item_used(UUID, TEXT);
CREATE OR REPLACE FUNCTION eksik_var.toggle_item_used(
    item_id_param UUID,
    clerk_id_param TEXT
)
RETURNS eksik_var.missing_items AS $$
DECLARE
    v_user_id UUID;
    v_item eksik_var.missing_items;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    UPDATE eksik_var.missing_items
    SET is_used = NOT is_used
    WHERE id = item_id_param AND (
        user_id = v_user_id 
        OR user_id IN (SELECT owner_id FROM eksik_var.shared_lists WHERE member_id = v_user_id)
        OR user_id IN (SELECT member_id FROM eksik_var.shared_lists WHERE owner_id = v_user_id)
    )
    RETURNING * INTO v_item;

    IF v_item IS NULL THEN
        RAISE EXCEPTION 'Item not found';
    END IF;

    RETURN v_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create Share Invite
DROP FUNCTION IF EXISTS eksik_var.create_share_invite(TEXT);
CREATE OR REPLACE FUNCTION eksik_var.create_share_invite(clerk_id_param TEXT)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_invite_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    INSERT INTO eksik_var.share_invites (creator_id)
    VALUES (v_user_id)
    RETURNING id INTO v_invite_id;

    RETURN v_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Get Invite Details
DROP FUNCTION IF EXISTS eksik_var.get_invite_details(UUID);
CREATE OR REPLACE FUNCTION eksik_var.get_invite_details(invite_id_param UUID)
RETURNS TABLE(creator_username TEXT, is_expired BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.username::TEXT,
        (i.expires_at < NOW() OR i.used_at IS NOT NULL) AS is_expired
    FROM eksik_var.share_invites i
    JOIN public.users u ON i.creator_id = u.id
    WHERE i.id = invite_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Accept Share Invite
DROP FUNCTION IF EXISTS eksik_var.accept_share_invite(UUID, TEXT);
CREATE OR REPLACE FUNCTION eksik_var.accept_share_invite(
    invite_id_param UUID,
    clerk_id_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_creator_id UUID;
    v_expired BOOLEAN;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Get invite details
    SELECT creator_id, (expires_at < NOW() OR used_at IS NOT NULL)
    INTO v_creator_id, v_expired
    FROM eksik_var.share_invites
    WHERE id = invite_id_param;

    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'Invite not found';
    END IF;

    IF v_expired THEN
        RAISE EXCEPTION 'Invite expired or already used';
    END IF;

    IF v_creator_id = v_user_id THEN
        RAISE EXCEPTION 'You cannot join your own list';
    END IF;

    -- Mark invite as used
    UPDATE eksik_var.share_invites
    SET used_at = NOW()
    WHERE id = invite_id_param;

    -- Add to shared lists (bidirectional share, we store creator as owner, joiner as member)
    INSERT INTO eksik_var.shared_lists (owner_id, member_id)
    VALUES (v_creator_id, v_user_id)
    ON CONFLICT (owner_id, member_id) DO NOTHING;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Get Shared Members
DROP FUNCTION IF EXISTS eksik_var.get_shared_members(TEXT);
CREATE OR REPLACE FUNCTION eksik_var.get_shared_members(clerk_id_param TEXT)
RETURNS TABLE(member_id UUID, username TEXT, avatar_url TEXT, is_owner BOOLEAN) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Return the owner/creator and other members
    RETURN QUERY
    -- Case 1: Users who joined the caller's list
    SELECT u.id, u.username::TEXT, u.avatar_url::TEXT, FALSE AS is_owner
    FROM eksik_var.shared_lists sl
    JOIN public.users u ON sl.member_id = u.id
    WHERE sl.owner_id = v_user_id
    UNION
    -- Case 2: The owner of the list that caller joined
    SELECT u.id, u.username::TEXT, u.avatar_url::TEXT, TRUE AS is_owner
    FROM eksik_var.shared_lists sl
    JOIN public.users u ON sl.owner_id = u.id
    WHERE sl.member_id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Remove Shared Member
DROP FUNCTION IF EXISTS eksik_var.remove_shared_member(TEXT, UUID);
CREATE OR REPLACE FUNCTION eksik_var.remove_shared_member(
    clerk_id_param TEXT,
    target_user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    deleted_count INTEGER;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Delete connection where caller is owner and target is member, or vice versa
    DELETE FROM eksik_var.shared_lists
    WHERE (owner_id = v_user_id AND member_id = target_user_id_param)
       OR (owner_id = target_user_id_param AND member_id = v_user_id);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Share List with Friend
DROP FUNCTION IF EXISTS eksik_var.share_list_with_friend(TEXT, UUID);
CREATE OR REPLACE FUNCTION eksik_var.share_list_with_friend(
    clerk_id_param TEXT,
    friend_user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    friend_exists BOOLEAN;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Verify they are accepted friends in public.friends
    SELECT EXISTS (
        SELECT 1 FROM public.friends
        WHERE ((user_id_1 = v_user_id AND user_id_2 = friend_user_id_param)
           OR (user_id_1 = friend_user_id_param AND user_id_2 = v_user_id))
          AND status = 'accepted'
    ) INTO friend_exists;

    IF NOT friend_exists THEN
        RAISE EXCEPTION 'You must be friends to share lists';
    END IF;

    -- Add to shared lists
    INSERT INTO eksik_var.shared_lists (owner_id, member_id)
    VALUES (v_user_id, friend_user_id_param)
    ON CONFLICT (owner_id, member_id) DO NOTHING;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Update Missing Item
DROP FUNCTION IF EXISTS eksik_var.update_missing_item(UUID, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS eksik_var.update_missing_item(UUID, TEXT, TEXT, BOOLEAN, TEXT);
CREATE OR REPLACE FUNCTION eksik_var.update_missing_item(
    item_id_param UUID,
    clerk_id_param TEXT,
    name_param TEXT DEFAULT NULL,
    is_used_param BOOLEAN DEFAULT NULL,
    category_param TEXT DEFAULT NULL
)
RETURNS eksik_var.missing_items AS $$
DECLARE
    v_user_id UUID;
    v_item eksik_var.missing_items;
BEGIN
    v_user_id := public.get_internal_user_id(clerk_id_param);
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    UPDATE eksik_var.missing_items
    SET
        name = COALESCE(name_param, name),
        is_used = COALESCE(is_used_param, is_used),
        category = COALESCE(category_param, category)
    WHERE id = item_id_param AND (
        user_id = v_user_id
        OR user_id IN (SELECT owner_id FROM eksik_var.shared_lists WHERE member_id = v_user_id)
        OR user_id IN (SELECT member_id FROM eksik_var.shared_lists WHERE owner_id = v_user_id)
    )
    RETURNING * INTO v_item;

    IF v_item IS NULL THEN
        RAISE EXCEPTION 'Item not found';
    END IF;

    RETURN v_item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
