-- İskambil Schema
CREATE SCHEMA IF NOT EXISTS iskambil;

-- Oyunlar Tablosu
CREATE TABLE IF NOT EXISTS iskambil.games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    rules JSONB NOT NULL, -- Kural satırları dizisi
    min_players INT NOT NULL DEFAULT 2,
    max_players INT NOT NULL DEFAULT 4,
    deck_count TEXT NOT NULL DEFAULT '1 Deste',
    category TEXT NOT NULL DEFAULT 'Diğer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favoriler Tablosu (Kullanıcı bazlı)
CREATE TABLE IF NOT EXISTS iskambil.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT NOT NULL REFERENCES iskambil.games(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (game_id, clerk_id)
);

-- Notlar Tablosu (Kullanıcı bazlı)
CREATE TABLE IF NOT EXISTS iskambil.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT NOT NULL REFERENCES iskambil.games(id) ON DELETE CASCADE,
    clerk_id TEXT NOT NULL,
    note TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (game_id, clerk_id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_iskambil_favorites_clerk_id ON iskambil.favorites(clerk_id);
CREATE INDEX IF NOT EXISTS idx_iskambil_notes_clerk_id ON iskambil.notes(clerk_id);

-- Yetkilendirmeler (Grants)
GRANT USAGE ON SCHEMA iskambil TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA iskambil TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA iskambil TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA iskambil TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA iskambil GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA iskambil GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA iskambil GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
