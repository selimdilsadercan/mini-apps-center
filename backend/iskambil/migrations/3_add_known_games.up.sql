-- Migrations Step 3: Add known_games table
CREATE TABLE IF NOT EXISTS iskambil.known_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT NOT NULL REFERENCES iskambil.games(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (game_id, clerk_id)
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_iskambil_known_games_clerk_id ON iskambil.known_games(clerk_id);

-- Grants
GRANT ALL ON TABLE iskambil.known_games TO anon, authenticated, service_role;
