DROP FUNCTION IF EXISTS tasket.upsert_item;

CREATE OR REPLACE FUNCTION tasket.upsert_item(
    id_param UUID,
    clerk_id_param TEXT,
    list_id_param UUID,
    title_param TEXT,
    content_param TEXT,
    is_completed_param BOOLEAN,
    item_type_param TEXT,
    color_param TEXT,
    reminder_at_param TIMESTAMP WITH TIME ZONE
)
RETURNS SETOF tasket.items LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    INSERT INTO tasket.items (id, clerk_id, list_id, title, content, is_completed, item_type, color, reminder_at, updated_at)
    VALUES (COALESCE(id_param, gen_random_uuid()), clerk_id_param, list_id_param, title_param, content_param, is_completed_param, item_type_param, color_param, reminder_at_param, NOW())
    ON CONFLICT (id) DO UPDATE SET
        list_id = EXCLUDED.list_id,
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        is_completed = EXCLUDED.is_completed,
        item_type = EXCLUDED.item_type,
        color = EXCLUDED.color,
        reminder_at = EXCLUDED.reminder_at,
        updated_at = NOW()
    RETURNING *;
END;
$$;
