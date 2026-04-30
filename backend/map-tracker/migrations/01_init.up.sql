-- Initial migration for map_tracker
CREATE SCHEMA IF NOT EXISTS map_tracker;

CREATE TABLE IF NOT EXISTS map_tracker.lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS map_tracker.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES map_tracker.lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    google_maps_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_visited BOOLEAN DEFAULT FALSE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(list_id, name)
);

CREATE INDEX IF NOT EXISTS idx_items_list_id ON map_tracker.items(list_id);
CREATE INDEX IF NOT EXISTS idx_items_is_visited ON map_tracker.items(is_visited);
