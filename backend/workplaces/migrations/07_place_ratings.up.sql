-- Community ratings (1–10) linked to workplaces.places — separate from Google rating column.

CREATE TABLE IF NOT EXISTS workplaces.place_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES workplaces.places(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    overall NUMERIC NOT NULL CHECK (overall >= 1 AND overall <= 10),
    taste NUMERIC CHECK (taste IS NULL OR (taste >= 1 AND taste <= 10)),
    value_score NUMERIC CHECK (value_score IS NULL OR (value_score >= 1 AND value_score <= 10)),
    service NUMERIC CHECK (service IS NULL OR (service >= 1 AND service <= 10)),
    atmosphere NUMERIC CHECK (atmosphere IS NULL OR (atmosphere >= 1 AND atmosphere <= 10)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (place_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workplaces_place_ratings_place ON workplaces.place_ratings(place_id);
CREATE INDEX IF NOT EXISTS idx_workplaces_place_ratings_created ON workplaces.place_ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workplaces_place_ratings_user ON workplaces.place_ratings(user_id);

-- Migrate from early places_ranked schema if it was applied
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'places_ranked' AND table_name = 'ratings'
    ) THEN
        INSERT INTO workplaces.place_ratings (
            place_id, user_id, overall, taste, value_score, service, atmosphere, created_at, updated_at
        )
        SELECT
            place_id, user_id, overall, taste, value_score, service, atmosphere, created_at, updated_at
        FROM places_ranked.ratings
        ON CONFLICT (place_id, user_id) DO NOTHING;

        DROP TABLE places_ranked.ratings;
    END IF;
END $$;

DROP SCHEMA IF EXISTS places_ranked CASCADE;

GRANT ALL ON workplaces.place_ratings TO anon, authenticated, service_role;
