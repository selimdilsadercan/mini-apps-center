-- Replace R2 URL cache with Google photo_reference (ToS-compliant)
ALTER TABLE workplaces.photo_cache
    ADD COLUMN IF NOT EXISTS photo_reference TEXT,
    ADD COLUMN IF NOT EXISTS attributions JSONB DEFAULT '[]';

-- Legacy rows: drop cached CDN URLs; references will be re-resolved on demand
UPDATE workplaces.photo_cache SET image_url = NULL WHERE image_url IS NOT NULL;
