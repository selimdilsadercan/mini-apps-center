DROP FUNCTION IF EXISTS tasket.upsert_list;

CREATE OR REPLACE FUNCTION tasket.upsert_list(
    id_param UUID,
    clerk_id_param TEXT,
    name_param TEXT,
    content_param JSONB,
    color_param TEXT,
    icon_param TEXT
)
RETURNS SETOF tasket.lists LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    INSERT INTO tasket.lists (id, clerk_id, name, content, color, icon, updated_at)
    VALUES (COALESCE(id_param, gen_random_uuid()), clerk_id_param, name_param, COALESCE(content_param, '{"type": "doc", "content": []}'::jsonb), color_param, icon_param, NOW())
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        content = COALESCE(EXCLUDED.content, tasket.lists.content),
        color = EXCLUDED.color,
        icon = EXCLUDED.icon,
        updated_at = NOW()
    RETURNING *;
END;
$$;
