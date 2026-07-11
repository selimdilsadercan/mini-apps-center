-- =============================================================================
-- LATEST MIGRATIONS & STRUCTURAL UPDATES
-- =============================================================================
-- 2026-07-11: Initialized gaming_hub schema and tables.

-- =============================================================================
-- IDEAL STATE (Current Schema)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS gaming_hub;

-- 1. LIBRARY TABLE
-- Holds games added by users to their collection (wishlist, playing, completed, backlog).
CREATE TABLE IF NOT EXISTS gaming_hub.library (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_name    TEXT NOT NULL,
  platform     TEXT NOT NULL, -- e.g., 'PC', 'PS5', 'Xbox', 'Nintendo Switch', 'Mobile'
  status       TEXT NOT NULL DEFAULT 'backlog', -- 'wishlist', 'backlog', 'playing', 'completed'
  play_time    INTEGER NOT NULL DEFAULT 0, -- in minutes
  rating       INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1 to 5 stars
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_game_platform UNIQUE (user_id, game_name, platform)
);

CREATE INDEX IF NOT EXISTS library_user_id_idx ON gaming_hub.library(user_id);
CREATE INDEX IF NOT EXISTS library_status_idx ON gaming_hub.library(status);

-- 2. PRICE ALERTS TABLE
-- Tracks target price alerts for games.
CREATE TABLE IF NOT EXISTS gaming_hub.price_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_name    TEXT NOT NULL,
  platform     TEXT NOT NULL,
  target_price NUMERIC(10, 2) NOT NULL,
  current_price NUMERIC(10, 2),
  is_triggered BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS price_alerts_user_id_idx ON gaming_hub.price_alerts(user_id);

-- 3. PLAY LOGS TABLE
-- Tracks individual play sessions to calculate daily/weekly statistics.
CREATE TABLE IF NOT EXISTS gaming_hub.play_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_name    TEXT NOT NULL,
  duration     INTEGER NOT NULL, -- in minutes
  log_date     DATE NOT NULL DEFAULT current_date,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS play_logs_user_id_idx ON gaming_hub.play_logs(user_id);
CREATE INDEX IF NOT EXISTS play_logs_log_date_idx ON gaming_hub.play_logs(log_date);

-- 4. HABITS LIMIT TABLE
-- Defines daily/weekly limits in minutes for healthy gaming habit tracker.
CREATE TABLE IF NOT EXISTS gaming_hub.habits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  daily_limit  INTEGER NOT NULL DEFAULT 120, -- in minutes (2 hours default)
  weekly_limit INTEGER NOT NULL DEFAULT 840, -- in minutes (14 hours default)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- GRANTS & PERMISSIONS
-- =============================================================================

GRANT USAGE ON SCHEMA gaming_hub TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA gaming_hub TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA gaming_hub TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA gaming_hub TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA gaming_hub GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA gaming_hub GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA gaming_hub GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
