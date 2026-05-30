-- Recreate user_states if it was dropped when chocolates was removed (CASCADE).
CREATE TABLE IF NOT EXISTS chocolate_db.user_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL,
    chocolate_id TEXT NOT NULL,
    state TEXT CHECK (state IN ('tried', 'wishlist', 'dislike')),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (clerk_id, chocolate_id)
);

-- Convert legacy UUID chocolate_id to slug TEXT if needed.
ALTER TABLE chocolate_db.user_states DROP CONSTRAINT IF EXISTS user_states_chocolate_id_fkey;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'chocolate_db'
          AND table_name = 'user_states'
          AND column_name = 'chocolate_id'
          AND udt_name = 'uuid'
    ) THEN
        ALTER TABLE chocolate_db.user_states
            ALTER COLUMN chocolate_id TYPE TEXT USING chocolate_id::TEXT;
    END IF;
END $$;

GRANT ALL ON TABLE chocolate_db.user_states TO anon, authenticated, service_role;
