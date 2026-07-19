-- FUNCTIONS
-- 1. film_graph.get_user_films
-- 2. film_graph.get_daily_suggestions

DROP FUNCTION IF EXISTS film_graph.get_user_films(TEXT);
CREATE OR REPLACE FUNCTION film_graph.get_user_films(p_user_id TEXT)
RETURNS TABLE (
    movie_id TEXT,
    title TEXT,
    year INTEGER,
    status TEXT,
    poster_url TEXT,
    vote_average NUMERIC
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT uf.movie_id, uf.title, uf.year, uf.status, uf.poster_url, uf.vote_average
    FROM film_graph.user_films uf
    WHERE uf.user_id = p_user_id;
END;
$$;
