-- 9_sender_soft_delete.up.sql
-- Adds soft-delete option for suggestion senders so they can delete suggestions from their own list without breaking recipient views.

-- 1. Add sender_deleted_at column to suggestions table
ALTER TABLE suggest.suggestions
    ADD COLUMN IF NOT EXISTS sender_deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Grant permissions
GRANT USAGE ON SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA suggest TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA suggest TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA suggest GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 3. delete_sent_suggestion.sql
DROP FUNCTION IF EXISTS suggest.delete_sent_suggestion(TEXT, TEXT);

CREATE OR REPLACE FUNCTION suggest.delete_sent_suggestion(
    sender_clerk_id_param TEXT,
    share_id_param TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE suggest.suggestions
    SET sender_deleted_at = NOW()
    WHERE sender_clerk_id = sender_clerk_id_param AND share_id = share_id_param;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. get_sent_suggestions.sql
DROP FUNCTION IF EXISTS suggest.get_sent_suggestions(TEXT);

CREATE OR REPLACE FUNCTION suggest.get_sent_suggestions(
    clerk_id_param TEXT
)
RETURNS TABLE (
    id UUID,
    share_id TEXT,
    category TEXT,
    title TEXT,
    short_note TEXT,
    rating DECIMAL,
    external_link TEXT,
    image_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    reaction TEXT,
    is_daily_pick BOOLEAN,
    preview_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    recipients JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.share_id,
        s.category,
        s.title,
        s.short_note,
        s.rating,
        s.external_link,
        s.image_url,
        s.expires_at,
        s.opened_at,
        s.reaction,
        s.is_daily_pick,
        s.preview_url,
        s.created_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'recipient_clerk_id', r.recipient_clerk_id,
                    'recipient_username', u.username,
                    'recipient_avatar', u.avatar_url,
                    'status', r.status,
                    'updated_at', r.updated_at
                )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'::jsonb
        ) AS recipients
    FROM suggest.suggestions s
    LEFT JOIN suggest.recipients r ON s.id = r.suggestion_id
    LEFT JOIN public.users u ON r.recipient_id = u.id
    WHERE s.sender_clerk_id = clerk_id_param AND s.sender_deleted_at IS NULL
    GROUP BY s.id
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
