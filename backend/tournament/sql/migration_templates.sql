-- Turnuva Şablonları Tablosu
CREATE TABLE IF NOT EXISTS tournament_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  capacity INTEGER DEFAULT 16,
  format TEXT DEFAULT 'league_knockout',
  players_per_match INTEGER DEFAULT 2,
  league_match_count INTEGER DEFAULT 3,
  advance_count INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Örnek Şablonları Ekle (Seed)
INSERT INTO tournament_templates (name, description, icon, capacity, format, players_per_match, advance_count)
VALUES 
('Landurt Turnuvası', '32 Oyuncu, 2şerli maçlar ile direkt eleme usulü.', '🎮', 32, 'knockout', 2, 0),
('Catan Turnuvası', '44 Oyuncu, 4erli lig maçları sonrası 16 kişi eleme turuna çıkar.', '🎲', 44, 'league_knockout', 4, 16)
ON CONFLICT DO NOTHING;
