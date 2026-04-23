import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TMDB API Details
const API_KEY = "cb4898718f8913cfdfa5d7ca0f99344e";
const BASE_URL = "https://api.themoviedb.org/3";
const year = 2026;

// Get the absolute path to the data file in the data directory
const TARGET_PATH = path.join(__dirname, '../data/movies_2026.json');

async function fetchPage(page) {
  const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=${year}&sort_by=popularity.desc&language=tr-TR&region=TR&page=${page}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Page ${page} fetch failed: ${response.statusText}`);
        return [];
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Page ${page} fetch error:`, error.message);
    return [];
  }
}

async function sync() {
  console.log(`[SYNC] Fetching movies for ${year} from TMDB...`);
  
  // Fetch first 5 pages for a rich calendar
  const pages = await Promise.all([
    fetchPage(1), fetchPage(2), fetchPage(3), fetchPage(4), fetchPage(5)
  ]);
  const allResults = pages.flat();
  
  if (allResults.length === 0) {
    console.error("[SYNC] No movies found. Aborting save.");
    return;
  }

  const movies = allResults
    .filter((m) => m.release_date)
    .map((m) => ({
      id: m.id,
      title: m.title,
      overview: m.overview,
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      release_date: m.release_date,
      vote_average: m.vote_average,
      popularity: m.popularity,
      genre_ids: m.genre_ids,
    }));

  // Remove duplicates and sort by date
  const uniqueMovies = Array.from(new Map(movies.map(m => [m.id, m])).values());
  uniqueMovies.sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());

  // Save to JSON
  fs.writeFileSync(TARGET_PATH, JSON.stringify(uniqueMovies, null, 2), "utf-8");
  
  console.log(`[SUCCESS] Saved ${uniqueMovies.length} movies to ${TARGET_PATH}`);
  console.log(`[INFO] Your calendar is now up to date for ${year}.`);
}

sync().catch(error => {
    console.error("[CRITICAL ERROR]:", error);
    process.exit(1);
});
