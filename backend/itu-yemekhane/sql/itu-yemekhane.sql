-- Table for disliked dishes in ITU Cafeteria app
CREATE TABLE IF NOT EXISTS itu_yemekhane_dislikes (
    id SERIAL PRIMARY KEY,
    dish_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
