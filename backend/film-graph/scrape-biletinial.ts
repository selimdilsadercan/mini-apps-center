import log from "encore.dev/log";
import { launchBrowser } from "../scrape/launch-browser";
import type { Browser, Page } from "puppeteer";

export const BILETINIAL_ARSAN = {
  slug: "kahramanmaras-arsan-sinemasi",
  name: "Arsan Sineması",
  url: "https://biletinial.com/tr-tr/mekan/kahramanmaras-arsan-sinemasi",
};

const MONTH_MAP: Record<string, string> = {
  ocak: "01",
  şubat: "02",
  mart: "03",
  nisan: "04",
  mayıs: "05",
  haziran: "06",
  temmuz: "07",
  ağustos: "08",
  eylül: "09",
  ekim: "10",
  kasım: "11",
  aralık: "12",
};

const SKIP_TITLES = new Set(["Kategori", "Telefon", "Adres", "Bilet İptali & Destek"]);

export interface BiletinialMovieRow {
  title: string;
  image_url: string;
  duration: string;
  genre: string;
  description: string;
  tmdb_id: number | null;
}

export interface BiletinialSessionRow {
  movie_title: string;
  theater_name: string;
  theater_slug: string;
  time: string;
  date: string;
  booking_url: string | null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseDateFromTabText(dateText: string): string | null {
  const normalized = dateText.replace(/\s+/g, " ").trim();
  const match = normalized.match(/(\d{1,2})\s+([A-Za-zğüşıöçĞÜŞİÖÇ]+)/);
  if (!match) {
    // "Cuma31 Temmuz" gibi bitişik gün adları
    const glued = normalized.match(/\D*(\d{1,2})\s+([A-Za-zğüşıöçĞÜŞİÖÇ]+)/);
    if (!glued) return null;
    return formatParsedDate(glued[1], glued[2]);
  }
  return formatParsedDate(match[1], match[2]);
}

function parseDateFromSeansOnclick(onclick: string): string | null {
  const match = onclick.match(
    /seansListele\('(\d{1,2})\s+([A-Za-zğüşıöçĞÜŞİÖÇ]+)\s+\S+\s+(\d{4})'\)/,
  );
  if (!match) return null;

  const day = match[1].padStart(2, "0");
  const month = MONTH_MAP[match[2].toLowerCase()];
  const year = match[3];
  if (!month) return null;
  return `${year}-${month}-${day}`;
}

function formatParsedDate(dayStr: string, monthName: string): string | null {
  const day = dayStr.padStart(2, "0");
  const month = MONTH_MAP[monthName.toLowerCase()];
  if (!month) return null;

  const now = new Date();
  let year = now.getFullYear();
  const monthNum = Number(month);
  if (monthNum < now.getMonth() + 1 - 1) year += 1;

  return `${year}-${month}-${day}`;
}

async function closeTicketModal(page: Page) {
  await page.evaluate(() => {
    const closeBtn = document.querySelector(
      '.yeniBiletal [class*="close"], .yeniBiletal button[aria-label*="Kapat"], .modal-close, [data-dismiss="modal"]',
    ) as HTMLElement | null;
    if (closeBtn) closeBtn.click();
  });
  await sleep(800);
  await page.keyboard.press("Escape").catch(() => undefined);
  await sleep(500);
}

async function openMovieTicketModal(page: Page, btnIndex: number) {
  await page.evaluate((index) => {
    const btns = [...document.querySelectorAll("a, button")].filter(
      (el) => el.textContent?.trim() === "BİLETİNİ AL",
    );
    (btns[index] as HTMLElement | undefined)?.click();
  }, btnIndex);
  await sleep(3000);
  await page.waitForSelector('a[onclick*="seansListele"]', { timeout: 10000 }).catch(() => undefined);
}

async function scrapeMovieSessions(
  page: Page,
  movieTitle: string,
  theaterName: string,
  theaterSlug: string,
  maxDays: number,
): Promise<BiletinialSessionRow[]> {
  const sessions: BiletinialSessionRow[] = [];
  const bookingBase = BILETINIAL_ARSAN.url;

  const dateTabCount = await page.evaluate(() => {
    return document.querySelectorAll('a[onclick*="seansListele"]').length;
  });

  if (dateTabCount === 0) return sessions;

  for (let dayIndex = 0; dayIndex < Math.min(dateTabCount, maxDays); dayIndex++) {
    await page.evaluate((index) => {
      const tabs = document.querySelectorAll('a[onclick*="seansListele"]');
      (tabs[index] as HTMLElement | undefined)?.click();
    }, dayIndex);
    await sleep(1800);

    const scraped = await page.evaluate((index) => {
      const tabs = document.querySelectorAll('a[onclick*="seansListele"]');
      const activeTab = tabs[index] as HTMLElement | undefined;
      const dateText = activeTab?.textContent?.replace(/\s+/g, " ").trim() || "";
      const onclick = activeTab?.getAttribute("onclick") || "";
      const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
      const times: string[] = [];
      const sessionContainer = document.querySelector(".yeniBiletal__seanslar__seanslar");
      const scope = sessionContainer ?? document;
      for (const el of scope.querySelectorAll("a, button, span")) {
        const time = el.textContent?.trim() || "";
        if (timePattern.test(time)) times.push(time);
      }
      return { dateText, onclick, times: [...new Set(times)] };
    }, dayIndex);

    const dateFormatted =
      parseDateFromSeansOnclick(scraped.onclick) || parseDateFromTabText(scraped.dateText);
    if (!dateFormatted) {
      log.warn(`Biletinial date parse failed: "${scraped.dateText}" (${movieTitle})`);
      continue;
    }

    for (const time of scraped.times) {
      sessions.push({
        movie_title: movieTitle,
        theater_name: theaterName,
        theater_slug: theaterSlug,
        time,
        date: dateFormatted,
        booking_url: bookingBase,
      });
    }

    log.info(`Biletinial ${movieTitle} / ${scraped.dateText}: ${scraped.times.length} seans`);
  }

  return sessions;
}

export async function scrapeBiletinialVenue(
  config: typeof BILETINIAL_ARSAN,
  searchTmdbMovie: (title: string) => Promise<number | null>,
  maxDays = 7,
): Promise<{
  success: boolean;
  count: number;
  movies: BiletinialMovieRow[];
  sessions: BiletinialSessionRow[];
}> {
  log.info(`Starting Biletinial scraper: ${config.name}`);

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;

  try {
    browser = await launchBrowser(false);
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ "Accept-Language": "tr-TR,tr;q=0.9" });

    await page.goto(config.url, { waitUntil: "domcontentloaded", timeout: 90000 });
    await sleep(4000);

    const theaterName =
      (await page.evaluate(() => {
        const h1 = document.querySelector("h1");
        return h1?.textContent?.trim() || "";
      })) || config.name;

    const movieEntries = await page.evaluate((skipTitles) => {
      const h3s = [...document.querySelectorAll("h3")]
        .map((h) => h.textContent?.trim() || "")
        .filter((t) => t && !skipTitles.includes(t));

      const btns = [...document.querySelectorAll("a, button")].filter(
        (el) => el.textContent?.trim() === "BİLETİNİ AL",
      );

      const entries: { title: string; btnIndex: number; imageUrl: string; genre: string }[] = [];
      for (let i = 0; i < Math.min(h3s.length, btns.length); i++) {
        const title = h3s[i];
        const card = btns[i].closest("div");
        const img = card?.querySelector("img")?.getAttribute("src") || "";
        const genreMatch = card?.textContent?.match(/([A-Za-zğüşıöçİĞÜŞÖÇ\s•]+)\s*BİLETİNİ AL/);
        const genre = genreMatch?.[1]?.replace(/\s+/g, " ").trim() || "";
        entries.push({ title, btnIndex: i, imageUrl: img, genre });
      }
      return entries;
    }, [...SKIP_TITLES]);

    log.info(`Found ${movieEntries.length} movies on Biletinial venue page`);

    const moviesToInsert = new Map<string, BiletinialMovieRow>();
    const allSessions: BiletinialSessionRow[] = [];

    for (const entry of movieEntries) {
      await page.goto(config.url, { waitUntil: "domcontentloaded", timeout: 90000 });
      await sleep(3500);

      await openMovieTicketModal(page, entry.btnIndex);

      if (!moviesToInsert.has(entry.title)) {
        const tmdbId = await searchTmdbMovie(entry.title);
        moviesToInsert.set(entry.title, {
          title: entry.title,
          image_url: entry.imageUrl,
          duration: "",
          genre: entry.genre,
          description: "",
          tmdb_id: tmdbId,
        });
      }

      const movieSessions = await scrapeMovieSessions(
        page,
        entry.title,
        theaterName,
        config.slug,
        maxDays,
      );
      allSessions.push(...movieSessions);

      await closeTicketModal(page);
    }

    return {
      success: true,
      count: allSessions.length,
      movies: [...moviesToInsert.values()],
      sessions: allSessions,
    };
  } catch (error: any) {
    log.error("Biletinial scraper error:", error?.message || error);
    return { success: false, count: 0, movies: [], sessions: [] };
  } finally {
    if (browser) await browser.close();
  }
}

export { parseDateFromTabText, parseDateFromSeansOnclick, MONTH_MAP };
