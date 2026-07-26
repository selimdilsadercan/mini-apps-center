import { CronJob } from "encore.dev/cron";
import { api } from "encore.dev/api";
import log from "encore.dev/log";
import { supabase } from "./api";

declare const document: any;

const MONTH_MAP: Record<string, string> = {
  "ocak": "01", "şubat": "02", "mart": "03", "nisan": "04",
  "mayıs": "05", "haziran": "06", "temmuz": "07", "ağustos": "08",
  "eylül": "09", "ekim": "10", "kasım": "11", "aralık": "12"
};

async function searchTmdbMovie(title: string): Promise<number | null> {
  const cleanTitle = encodeURIComponent(title);
  // 1. Search in Turkish first
  let url = `https://api.themoviedb.org/3/search/movie?api_key=cb4898718f8913cfdfa5d7ca0f99344e&query=${cleanTitle}&language=tr-TR`;
  try {
    let res = await fetch(url);
    if (!res.ok) return null;
    let data: any = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].id;
    }
    
    // 2. Search in English if not found on Turkish query
    url = `https://api.themoviedb.org/3/search/movie?api_key=cb4898718f8913cfdfa5d7ca0f99344e&query=${cleanTitle}&language=en-US`;
    res = await fetch(url);
    if (!res.ok) return null;
    data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].id;
    }
  } catch (e) {
    log.error(`TMDB search error for movie "${title}":`, e);
  }
  return null;
}

// Main function to run the scraper for a theater
export async function scrapeTheaterSessions(theaterSlug: string): Promise<{ success: boolean; count: number }> {
  log.info(`Starting Cineverse scraper for theater: ${theaterSlug}...`);
  
  let browser: any;
  let sessionsCount = 0;

  try {
    // Dynamic import to prevent Encore bundler bugs
    const puppeteer = await import("puppeteer-extra");
    const StealthPlugin = await import("puppeteer-extra-plugin-stealth");
    
    const extra = puppeteer.default;
    extra.use(StealthPlugin.default());

    log.info("Launching Puppeteer browser...");
    browser = await extra.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled"
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    const url = `https://www.paribucineverse.com/sinemalar/${theaterSlug}`;
    log.info(`Navigating to URL: ${url}`);
    
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    
    // Wait for page to initialize
    await new Promise(r => setTimeout(r, 4000));

    try {
      await page.waitForSelector(".datepicker-item", { timeout: 15000 });
    } catch (e) {
      log.warn("Timeout waiting for .datepicker-item selector, proceeding anyway...");
    }

    // Get the theater name from h1.page-cinema-title
    const theaterName = await page.evaluate(() => {
      const h1 = document.querySelector("h1.page-cinema-title");
      return h1 ? h1.textContent?.replace("Paribu Cineverse", "").trim() : "";
    }) || "Piazza Kahramanmaraş";

    log.info(`Theater resolved: ${theaterName}`);

    // Get datepicker items count
    const dateCount = await page.evaluate(() => {
      return document.querySelectorAll(".datepicker-item").length;
    });
    log.info(`Found ${dateCount} date tabs to scrape.`);

    const allSessions: any[] = [];
    const moviesToInsert: Map<string, any> = new Map();


    // Iterate through each date tab, click it, wait, and scrape
    for (let i = 0; i < Math.min(dateCount, 7); i++) {
      log.info(`Clicking date tab index ${i}...`);
      
      // Click date tab
      await page.evaluate((index: number) => {
        const tabs = document.querySelectorAll(".datepicker-item");
        if (tabs[index]) {
          (tabs[index] as any).click();
        }
      }, i);

      // Wait for content load
      await new Promise(r => setTimeout(r, 4000));

      // Get date text
      const dateText = await page.evaluate((index: number) => {
        const tabs = document.querySelectorAll(".datepicker-item");
        return tabs[index] ? tabs[index].textContent?.trim() : "";
      }, i);

      if (!dateText) continue;

      // Parse date text (e.g., "27 Temmuz Pazartesi" or "01 Ağustos Cumartesi")
      const dateParts = dateText.replace(/\s+/g, ' ').split(' ');
      if (dateParts.length < 2) continue;

      const dayStr = dateParts[0].padStart(2, '0');
      const monthStr = MONTH_MAP[dateParts[1].toLowerCase()] || "07";
      const year = new Date().getFullYear();
      const dateFormatted = `${year}-${monthStr}-${dayStr}`;

      log.info(`Scraping date: ${dateFormatted} (${dateText})`);

      // Extract movie/session data from live DOM (AJAX-rendered)
      const scrapedData = await page.evaluate(() => {
        const BASE_URL = "https://www.paribucineverse.com";
        const rows = document.querySelectorAll("div#movieRow");
        const timePattern = /^[0-2]\d:[0-5]\d$/;
        const movies: { title: string; description: string; imageUrl: string; duration: string; genre: string }[] = [];
        const sessions: { movie_title: string; time: string; booking_url: string | null }[] = [];

        rows.forEach((row: any) => {
          const title = row.getAttribute("data-movie-title")?.trim() || "";
          if (!title) return;

          const description = row.getAttribute("data-movie-description")?.trim() || "";
          const imgElem = row.querySelector("a.cinema-detail-link img");
          const imageUrl = imgElem ? imgElem.getAttribute("src") || "" : "";
          const durationElem = row.querySelector(".runtime");
          const duration = durationElem ? durationElem.textContent?.trim() || "" : "";
          const genreElem = row.querySelector(".film-infos");
          const genre = genreElem ? genreElem.getAttribute("data-genre") || "" : "";
          movies.push({ title, description, imageUrl, duration, genre });

          const timeRowSection = row.querySelector(".time-row-section");
          if (timeRowSection) {
            const anchors = timeRowSection.querySelectorAll("a");
            anchors.forEach((a: any) => {
              const timeText = (a.getAttribute("title") || a.textContent || "").trim();
              if (timePattern.test(timeText)) {
                const dataUrl = a.getAttribute("data-url") || null;
                const bookingUrl = dataUrl ? `${BASE_URL}${dataUrl}` : null;
                sessions.push({ movie_title: title, time: timeText, booking_url: bookingUrl });
              }
            });
          }
        });
        return { movies, sessions };
      });

      for (const movieData of scrapedData.movies) {
        const { title, description, imageUrl, duration, genre } = movieData;
        if (!moviesToInsert.has(title)) {
          log.info(`Searching TMDB ID for: ${title}`);
          const tmdbId = await searchTmdbMovie(title);
          log.info(`TMDB ID resolved: ${tmdbId}`);
          moviesToInsert.set(title, {
            title,
            image_url: imageUrl,
            duration,
            genre,
            description,
            tmdb_id: tmdbId
          });
        }
      }

      for (const sessionData of scrapedData.sessions) {
        allSessions.push({
          movie_title: sessionData.movie_title,
          theater_name: theaterName,
          theater_slug: theaterSlug,
          time: sessionData.time,
          date: dateFormatted,
          booking_url: sessionData.booking_url
        });
      }
    }

    log.info(`Scraped ${moviesToInsert.size} movies and ${allSessions.length} sessions.`);

    // 1. Insert Movies
    if (moviesToInsert.size > 0) {
      const moviesList = Array.from(moviesToInsert.values());
      const { error: movieErr } = await supabase
        .schema("film_graph")
        .from("cineverse_movies")
        .upsert(moviesList, { onConflict: "title" });

      if (movieErr) {
        log.error("Failed to upsert cineverse movies:", movieErr.message);
      }
    }

    // 2. Insert Sessions
    if (allSessions.length > 0) {
      // Clear sessions for this theater slug first to avoid stale bookings
      const { error: clearErr } = await supabase
        .schema("film_graph")
        .from("cineverse_sessions")
        .delete()
        .eq("theater_slug", theaterSlug);

      if (clearErr) {
        log.error("Failed to clear stale sessions:", clearErr.message);
      }

      const { error: sessionErr } = await supabase
        .schema("film_graph")
        .from("cineverse_sessions")
        .insert(allSessions);

      if (sessionErr) {
        log.error("Failed to insert cineverse sessions:", sessionErr.message);
      } else {
        sessionsCount = allSessions.length;
      }
    }

    return { success: true, count: sessionsCount };

  } catch (error: any) {
    log.error("Cineverse scraper execution error:", error.message || error);
    return { success: false, count: 0 };
  } finally {
    if (browser) {
      log.info("Closing Puppeteer browser...");
      await browser.close();
    }
  }
}

// 1. Sync Trigger Endpoint
export const triggerCineverseSync = api(
  { expose: true, method: "POST", path: "/film-graph/cineverse/sync" },
  async (): Promise<{ success: boolean; count: number }> => {
    return await scrapeTheaterSessions("piazza-kahramanmaras");
  }
);

// 2. Background Cron Definition (every 24 hours)
const _ = new CronJob("sync-cineverse-sessions", {
  title: "Scrape Paribu Cineverse Sessions",
  every: "24h",
  endpoint: triggerCineverseSync
});
