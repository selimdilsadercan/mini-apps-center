CREATE TABLE IF NOT EXISTS workplaces.photo_cache (
    google_place_id TEXT PRIMARY KEY,
    photo_reference TEXT,
    attributions JSONB DEFAULT '[]',
    image_url TEXT,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workplaces_photo_cache_fetched_at
    ON workplaces.photo_cache(fetched_at);

GRANT ALL ON workplaces.photo_cache TO anon, authenticated, service_role;
