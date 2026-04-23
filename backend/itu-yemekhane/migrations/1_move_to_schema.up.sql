-- 1. Create Schema
CREATE SCHEMA IF NOT EXISTS itu_yemekhane;

-- 2. Move table if exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'itu_yemekhane_dislikes') THEN
        ALTER TABLE public.itu_yemekhane_dislikes SET SCHEMA itu_yemekhane;
        ALTER TABLE itu_yemekhane.itu_yemekhane_dislikes RENAME TO dislikes;
    END IF;
END $$;

-- 3. Create table if not exists (fresh install)
CREATE TABLE IF NOT EXISTS itu_yemekhane.dislikes (
    id SERIAL PRIMARY KEY,
    dish_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
