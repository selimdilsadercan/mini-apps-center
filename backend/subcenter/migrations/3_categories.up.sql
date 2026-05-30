CREATE TABLE IF NOT EXISTS subcenter.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#6366F1',
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO subcenter.categories (id, name, icon, color, sort_order) VALUES
  ('entertainment', 'Entertainment', '🎬', '#E50914', 1),
  ('music', 'Music', '🎵', '#1DB954', 2),
  ('ai', 'AI', '🤖', '#10A37F', 3),
  ('software', 'Software', '💻', '#6366F1', 4),
  ('design', 'Design', '✨', '#00C4CC', 5),
  ('social', 'Social', '💬', '#1877F2', 6),
  ('other', 'Other', '📦', '#64748B', 7)
ON CONFLICT (id) DO NOTHING;
