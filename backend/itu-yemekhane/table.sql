-- ITU Yemekhane Schema
CREATE SCHEMA IF NOT EXISTS itu_yemekhane;

-- Table for disliked dishes in ITU Cafeteria app
CREATE TABLE IF NOT EXISTS itu_yemekhane.dislikes (
    id SERIAL PRIMARY KEY,
    dish_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
