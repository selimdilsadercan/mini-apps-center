-- FUNCTIONS
-- 1. read_tracker.get_user_books
-- 2. read_tracker.upsert_book
-- 3. read_tracker.delete_book
-- 4. read_tracker.get_weekly_goals
-- 5. read_tracker.upsert_weekly_goal

--------------------------------------------------------------------------------
-- 1. read_tracker.get_user_books
--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS read_tracker.get_user_books(UUID);
DROP FUNCTION IF EXISTS read_tracker.get_user_books(TEXT);
CREATE OR REPLACE FUNCTION read_tracker.get_user_books(
    p_user_id TEXT
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    author TEXT,
    total_pages INTEGER,
    current_page INTEGER,
    status TEXT,
    rating INTEGER,
    review TEXT,
    cover_image TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_uuid UUID;
BEGIN
    v_user_uuid := public.get_internal_user_id(p_user_id);
    RETURN QUERY
    SELECT 
        b.id,
        b.user_id,
        b.title,
        b.author,
        b.total_pages,
        b.current_page,
        b.status,
        b.rating,
        b.review,
        b.cover_image,
        b.start_date,
        b.end_date,
        b.created_at,
        b.updated_at
    FROM read_tracker.books b
    WHERE b.user_id = v_user_uuid
    ORDER BY b.updated_at DESC;
END;
$$;

--------------------------------------------------------------------------------
-- 2. read_tracker.upsert_book
--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS read_tracker.upsert_book(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, TEXT, INTEGER, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS read_tracker.upsert_book(UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, INTEGER, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION read_tracker.upsert_book(
    p_id UUID,
    p_user_id TEXT,
    p_title TEXT,
    p_author TEXT,
    p_total_pages INTEGER,
    p_current_page INTEGER,
    p_status TEXT,
    p_rating INTEGER,
    p_review TEXT,
    p_cover_image TEXT,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_book_id UUID := p_id;
    v_status TEXT := p_status;
    v_result JSONB;
    v_user_uuid UUID;
BEGIN
    v_user_uuid := public.get_internal_user_id(p_user_id);

    -- Automatically set status to completed if current_page matches total_pages
    IF p_total_pages IS NOT NULL AND p_total_pages > 0 AND p_current_page >= p_total_pages THEN
        v_status := 'completed';
    END IF;

    IF v_book_id IS NULL THEN
        INSERT INTO read_tracker.books (
            user_id,
            title,
            author,
            total_pages,
            current_page,
            status,
            rating,
            review,
            cover_image,
            start_date,
            end_date
        ) VALUES (
            v_user_uuid,
            p_title,
            p_author,
            p_total_pages,
            COALESCE(p_current_page, 0),
            COALESCE(v_status, 'to_read'),
            p_rating,
            p_review,
            p_cover_image,
            p_start_date,
            p_end_date
        )
        RETURNING id INTO v_book_id;
    ELSE
        UPDATE read_tracker.books
        SET
            title = p_title,
            author = p_author,
            total_pages = p_total_pages,
            current_page = COALESCE(p_current_page, 0),
            status = COALESCE(v_status, 'to_read'),
            rating = p_rating,
            review = p_review,
            cover_image = p_cover_image,
            start_date = p_start_date,
            end_date = p_end_date,
            updated_at = NOW()
        WHERE id = v_book_id AND user_id = v_user_uuid;
    END IF;

    SELECT row_to_json(r) INTO v_result
    FROM (
        SELECT * FROM read_tracker.books WHERE id = v_book_id
    ) r;

    RETURN v_result;
END;
$$;

--------------------------------------------------------------------------------
-- 3. read_tracker.delete_book
--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS read_tracker.delete_book(UUID, UUID);
DROP FUNCTION IF EXISTS read_tracker.delete_book(UUID, TEXT);
CREATE OR REPLACE FUNCTION read_tracker.delete_book(
    p_id UUID,
    p_user_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_uuid UUID;
BEGIN
    v_user_uuid := public.get_internal_user_id(p_user_id);

    DELETE FROM read_tracker.books
    WHERE id = p_id AND user_id = v_user_uuid;
    
    RETURN FOUND;
END;
$$;

--------------------------------------------------------------------------------
-- 4. read_tracker.get_weekly_goals
--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS read_tracker.get_weekly_goals(UUID);
DROP FUNCTION IF EXISTS read_tracker.get_weekly_goals(TEXT);
CREATE OR REPLACE FUNCTION read_tracker.get_weekly_goals(
    p_user_id TEXT
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    week_start DATE,
    book_id UUID,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    book_title TEXT,
    book_author TEXT,
    book_cover TEXT,
    book_current_page INT,
    book_total_pages INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_uuid UUID;
BEGIN
    v_user_uuid := public.get_internal_user_id(p_user_id);

    RETURN QUERY
    SELECT 
        wg.id,
        wg.user_id,
        wg.week_start,
        wg.book_id,
        wg.status,
        wg.notes,
        wg.created_at,
        wg.updated_at,
        b.title AS book_title,
        b.author AS book_author,
        b.cover_image AS book_cover,
        b.current_page AS book_current_page,
        b.total_pages AS book_total_pages
    FROM read_tracker.weekly_goals wg
    LEFT JOIN read_tracker.books b ON wg.book_id = b.id
    WHERE wg.user_id = v_user_uuid
    ORDER BY wg.week_start DESC;
END;
$$;

--------------------------------------------------------------------------------
-- 5. read_tracker.upsert_weekly_goal
--------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS read_tracker.upsert_weekly_goal(UUID, DATE, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS read_tracker.upsert_weekly_goal(TEXT, DATE, UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION read_tracker.upsert_weekly_goal(
    p_user_id TEXT,
    p_week_start DATE,
    p_book_id UUID,
    p_status TEXT,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_goal_id UUID;
    v_result JSONB;
    v_user_uuid UUID;
BEGIN
    v_user_uuid := public.get_internal_user_id(p_user_id);

    INSERT INTO read_tracker.weekly_goals (
        user_id,
        week_start,
        book_id,
        status,
        notes
    ) VALUES (
        v_user_uuid,
        p_week_start,
        p_book_id,
        p_status,
        p_notes
    )
    ON CONFLICT (user_id, week_start) DO UPDATE
    SET 
        book_id = EXCLUDED.book_id,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    RETURNING id INTO v_goal_id;

    SELECT row_to_json(r) INTO v_result
    FROM (
        SELECT 
            wg.*,
            b.title AS book_title,
            b.author AS book_author,
            b.cover_image AS book_cover
        FROM read_tracker.weekly_goals wg
        LEFT JOIN read_tracker.books b ON wg.book_id = b.id
        WHERE wg.id = v_goal_id
    ) r;

    RETURN v_result;
END;
$$;
