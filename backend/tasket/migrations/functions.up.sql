-- FUNCTIONS
-- 1. tasket.get_data
-- 2. tasket.upsert_list
-- 3. tasket.upsert_item
-- 4. tasket.delete_list
-- 5. tasket.delete_item

-- 1. Get Data
DROP FUNCTION IF EXISTS tasket.get_data(TEXT);
CREATE OR REPLACE FUNCTION tasket.get_data(p_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    lists_data JSONB;
    items_data JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', l.id,
            'user_id', l.user_id,
            'name', l.name,
            'content', l.content,
            'color', l.color,
            'icon', l.icon,
            'created_at', l.created_at,
            'updated_at', l.updated_at
        )
    ) INTO lists_data 
    FROM tasket.lists l 
    WHERE l.user_id = v_user_id;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', i.id,
            'user_id', i.user_id,
            'list_id', i.list_id,
            'title', i.title,
            'content', i.content,
            'is_completed', i.is_completed,
            'item_type', i.item_type,
            'color', i.color,
            'reminder_at', i.reminder_at,
            'assignee', i.assignee,
            'due_date', i.due_date,
            'created_at', i.created_at,
            'updated_at', i.updated_at
        )
    ) INTO items_data 
    FROM tasket.items i 
    WHERE i.user_id = v_user_id;
    
    RETURN jsonb_build_object(
        'lists', COALESCE(lists_data, '[]'::jsonb),
        'items', COALESCE(items_data, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Upsert List
DROP FUNCTION IF EXISTS tasket.upsert_list(UUID, TEXT, TEXT, JSONB, TEXT, TEXT);
CREATE OR REPLACE FUNCTION tasket.upsert_list(
    id_param UUID,
    p_user_id TEXT,
    name_param TEXT,
    content_param JSONB,
    color_param TEXT,
    icon_param TEXT
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    content JSONB,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for p_user_id %', p_user_id;
    END IF;

    RETURN QUERY
    INSERT INTO tasket.lists (id, user_id, name, content, color, icon, updated_at)
    VALUES (COALESCE(id_param, gen_random_uuid()), v_user_id, name_param, COALESCE(content_param, '{"type": "doc", "content": []}'::jsonb), color_param, icon_param, NOW())
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        content = COALESCE(EXCLUDED.content, tasket.lists.content),
        color = EXCLUDED.color,
        icon = EXCLUDED.icon,
        updated_at = NOW()
    RETURNING 
        tasket.lists.id,
        tasket.lists.user_id,
        tasket.lists.name,
        tasket.lists.content,
        tasket.lists.color,
        tasket.lists.icon,
        tasket.lists.created_at,
        tasket.lists.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Upsert Item
DROP FUNCTION IF EXISTS tasket.upsert_item(UUID, TEXT, UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TIMESTAMP WITH TIME ZONE);
CREATE OR REPLACE FUNCTION tasket.upsert_item(
    id_param UUID,
    p_user_id TEXT,
    list_id_param UUID,
    title_param TEXT,
    content_param TEXT,
    is_completed_param BOOLEAN,
    item_type_param TEXT,
    color_param TEXT,
    reminder_at_param TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    list_id UUID,
    title TEXT,
    content TEXT,
    is_completed BOOLEAN,
    item_type TEXT,
    color TEXT,
    reminder_at TIMESTAMP WITH TIME ZONE,
    assignee TEXT,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found for p_user_id %', p_user_id;
    END IF;

    RETURN QUERY
    INSERT INTO tasket.items (id, user_id, list_id, title, content, is_completed, item_type, color, reminder_at, updated_at)
    VALUES (COALESCE(id_param, gen_random_uuid()), v_user_id, list_id_param, title_param, content_param, is_completed_param, item_type_param, color_param, reminder_at_param, NOW())
    ON CONFLICT (id) DO UPDATE SET
        list_id = EXCLUDED.list_id,
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        is_completed = EXCLUDED.is_completed,
        item_type = EXCLUDED.item_type,
        color = EXCLUDED.color,
        reminder_at = EXCLUDED.reminder_at,
        updated_at = NOW()
    RETURNING 
        tasket.items.id,
        tasket.items.user_id,
        tasket.items.list_id,
        tasket.items.title,
        tasket.items.content,
        tasket.items.is_completed,
        tasket.items.item_type,
        tasket.items.color,
        tasket.items.reminder_at,
        tasket.items.assignee,
        tasket.items.due_date,
        tasket.items.created_at,
        tasket.items.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Delete List
DROP FUNCTION IF EXISTS tasket.delete_list(UUID, TEXT);
CREATE OR REPLACE FUNCTION tasket.delete_list(id_param UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    deleted_count INTEGER;
BEGIN
    DELETE FROM tasket.lists
    WHERE id = id_param AND user_id = v_user_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Delete Item
DROP FUNCTION IF EXISTS tasket.delete_item(UUID, TEXT);
CREATE OR REPLACE FUNCTION tasket.delete_item(id_param UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := public.get_internal_user_id(p_user_id);
    deleted_count INTEGER;
BEGIN
    DELETE FROM tasket.items
    WHERE id = id_param AND user_id = v_user_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grants
GRANT ALL ON ALL FUNCTIONS IN SCHEMA tasket TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA tasket GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
