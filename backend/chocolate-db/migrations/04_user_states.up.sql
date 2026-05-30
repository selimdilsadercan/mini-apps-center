CREATE TABLE IF NOT EXISTS chocolate_db.user_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL,
    chocolate_id TEXT NOT NULL,
    state TEXT CHECK (state IN ('tried', 'wishlist', 'dislike')),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (clerk_id, chocolate_id)
);

-- Grant permissions
GRANT ALL ON TABLE chocolate_db.user_states TO anon, authenticated, service_role;
