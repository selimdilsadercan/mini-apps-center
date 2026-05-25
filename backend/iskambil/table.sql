-- İskambil Schema
CREATE SCHEMA IF NOT EXISTS iskambil;

-- Favoriler Tablosu (Kullanıcı bazlı)
CREATE TABLE IF NOT EXISTS iskambil.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT NOT NULL,
    clerk_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (game_id, clerk_id)
);

-- Notlar Tablosu (Kullanıcı bazlı)
CREATE TABLE IF NOT EXISTS iskambil.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT NOT NULL,
    clerk_id TEXT NOT NULL,
    note TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (game_id, clerk_id)
);

-- Bildiğim Oyunlar Tablosu (Kullanıcı bazlı)
CREATE TABLE IF NOT EXISTS iskambil.known_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT NOT NULL,
    clerk_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (game_id, clerk_id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_iskambil_favorites_clerk_id ON iskambil.favorites(clerk_id);
CREATE INDEX IF NOT EXISTS idx_iskambil_notes_clerk_id ON iskambil.notes(clerk_id);
CREATE INDEX IF NOT EXISTS idx_iskambil_known_games_clerk_id ON iskambil.known_games(clerk_id);

-- Yetkilendirmeler (Grants)
GRANT USAGE ON SCHEMA iskambil TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA iskambil TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA iskambil TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA iskambil TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA iskambil GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA iskambil GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA iskambil GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
