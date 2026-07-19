import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

// Supabase credentials as Encore secrets
const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

// Create Supabase client
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== SCHEMAS & TYPES ====================

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  total_pages: number | null;
  current_page: number;
  status: "reading" | "completed" | "to_read" | "dropped";
  rating: number | null;
  review: string | null;
  cover_image: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyGoal {
  id: string;
  user_id: string;
  week_start: string; // YYYY-MM-DD
  weeks: number; // how many weeks this goal spans (>= 1)
  book_id: string | null;
  status: "active" | "completed" | "skipped";
  notes: string | null;
  created_at: string;
  updated_at: string;
  book_title?: string | null;
  book_author?: string | null;
  book_cover?: string | null;
  book_current_page?: number | null;
  book_total_pages?: number | null;
}

// ==================== REQUEST / RESPONSE ====================

interface GetBooksRequest {
  userId: string;
}

interface GetBooksResponse {
  books: Book[];
}

interface UpsertBookRequest {
  id?: string | null;
  userId: string;
  title: string;
  author: string;
  totalPages?: number | null;
  currentPage?: number | null;
  status?: "reading" | "completed" | "to_read" | "dropped" | null;
  rating?: number | null;
  review?: string | null;
  coverImage?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

interface UpsertBookResponse {
  book: Book;
}

interface DeleteBookRequest {
  id: string;
  userId: string;
}

interface DeleteBookResponse {
  success: boolean;
}

interface GetWeeklyGoalsRequest {
  userId: string;
}

interface GetWeeklyGoalsResponse {
  goals: WeeklyGoal[];
}

interface UpsertWeeklyGoalRequest {
  userId: string;
  weekStart: string; // YYYY-MM-DD
  weeks?: number | null; // how many weeks this goal spans (defaults to 1)
  bookId: string | null;
  status: "active" | "completed" | "skipped";
  notes?: string | null;
}

interface UpsertWeeklyGoalResponse {
  goal: WeeklyGoal;
}

// ==================== API ENDPOINTS ====================

/**
 * Get user library books
 */
export const getBooks = api(
  { expose: true, method: "GET", path: "/read-tracker/books/:userId" },
  async ({ userId }: GetBooksRequest): Promise<GetBooksResponse> => {
    const { data, error } = await supabase
      .schema("read_tracker")
      .rpc("get_user_books", { p_user_id: userId });

    if (error) {
      console.error("getBooks error:", error);
      throw APIError.internal("Kitaplar yüklenemedi");
    }

    return { books: data || [] };
  }
);

/**
 * Create or update a book
 */
export const upsertBook = api(
  { expose: true, method: "POST", path: "/read-tracker/book" },
  async (req: UpsertBookRequest): Promise<UpsertBookResponse> => {
    const { data, error } = await supabase
      .schema("read_tracker")
      .rpc("upsert_book", {
        p_id: req.id || null,
        p_user_id: req.userId,
        p_title: req.title,
        p_author: req.author,
        p_total_pages: req.totalPages || null,
        p_current_page: req.currentPage || 0,
        p_status: req.status || "to_read",
        p_rating: req.rating || null,
        p_review: req.review || null,
        p_cover_image: req.coverImage || null,
        p_start_date: req.startDate || null,
        p_end_date: req.endDate || null,
      });

    if (error) {
      console.error("upsertBook error:", error);
      throw APIError.internal("Kitap kaydedilemedi");
    }

    return { book: data };
  }
);

/**
 * Delete a book
 */
export const deleteBook = api(
  { expose: true, method: "DELETE", path: "/read-tracker/book/:userId/:id" },
  async ({ id, userId }: DeleteBookRequest): Promise<DeleteBookResponse> => {
    const { data, error } = await supabase
      .schema("read_tracker")
      .rpc("delete_book", { p_id: id, p_user_id: userId });

    if (error) {
      console.error("deleteBook error:", error);
      throw APIError.internal("Kitap silinemedi");
    }

    return { success: !!data };
  }
);

/**
 * Get user weekly reading goals
 */
export const getWeeklyGoals = api(
  { expose: true, method: "GET", path: "/read-tracker/goals/:userId" },
  async ({ userId }: GetWeeklyGoalsRequest): Promise<GetWeeklyGoalsResponse> => {
    const { data, error } = await supabase
      .schema("read_tracker")
      .rpc("get_weekly_goals", { p_user_id: userId });

    if (error) {
      console.error("getWeeklyGoals error:", error);
      throw APIError.internal("Haftalık hedefler yüklenemedi");
    }

    return { goals: data || [] };
  }
);

/**
 * Add or update weekly goal
 */
export const upsertWeeklyGoal = api(
  { expose: true, method: "POST", path: "/read-tracker/goal" },
  async (req: UpsertWeeklyGoalRequest): Promise<UpsertWeeklyGoalResponse> => {
    const { data, error } = await supabase
      .schema("read_tracker")
      .rpc("upsert_weekly_goal", {
        p_user_id: req.userId,
        p_week_start: req.weekStart,
        p_weeks: req.weeks || 1,
        p_book_id: req.bookId,
        p_status: req.status,
        p_notes: req.notes || null,
      });

    if (error) {
      console.error("upsertWeeklyGoal error:", error);
      throw APIError.internal("Haftalık hedef kaydedilemedi");
    }

    return { goal: data };
  }
);

// ==================== SEARCH TYPES & ENDPOINT ====================

interface SearchBooksRequest {
  query: string;
  language?: string | null;
}

export interface SearchResultBook {
  id: string;
  title: string;
  author: string;
  totalPages: number | null;
  coverImage: string | null;
}

interface SearchBooksResponse {
  results: SearchResultBook[];
}

/**
 * Google Books — primary source. Much larger catalog and good Turkish coverage.
 * Works without an API key (rate-limited); set a key later for higher limits.
 */
async function searchGoogleBooks(
  query: string,
  language?: string | null
): Promise<SearchResultBook[]> {
  const keyParam = "";
  const base = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
    query
  )}&maxResults=20&printType=books&orderBy=relevance${keyParam}`;
  // For Turkish, try language-restricted results first, then a general query.
  const urls = language === "tr" ? [`${base}&langRestrict=tr`, base] : [base];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      const data = (await res.json()) as any;
      const items: any[] = data.items || [];
      if (items.length === 0) continue;

      return items.map((item: any): SearchResultBook => {
        const v = item.volumeInfo || {};
        const title = v.subtitle ? `${v.title}: ${v.subtitle}` : v.title || "";
        const thumb: string | null =
          v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || null;
        return {
          id: item.id || Math.random().toString(),
          title,
          author:
            Array.isArray(v.authors) && v.authors.length > 0
              ? v.authors.join(", ")
              : "Bilinmeyen Yazar",
          totalPages:
            typeof v.pageCount === "number" && v.pageCount > 0 ? v.pageCount : null,
          coverImage: thumb ? thumb.replace(/^http:\/\//, "https://") : null,
        };
      });
    } catch (e) {
      console.error("Google Books query failed:", e);
    }
  }
  return [];
}

/**
 * Open Library — fallback source when Google Books returns nothing.
 */
async function searchOpenLibrary(
  query: string,
  language?: string | null
): Promise<SearchResultBook[]> {
  const q = encodeURIComponent(query);
  const olFetch = async (url: string): Promise<any[]> => {
    try {
      const res = await fetch(url);
      const data = (await res.json()) as any;
      return data.docs || [];
    } catch (e) {
      console.error("Open Library query failed:", e);
      return [];
    }
  };

  let docs: any[] = [];
  if (language === "tr") {
    // Turkish-language results first, then the rest (non-Turkish) below.
    const [trDocs, generalDocs] = await Promise.all([
      olFetch(`https://openlibrary.org/search.json?q=${q}&language=tur&limit=15`),
      olFetch(`https://openlibrary.org/search.json?q=${q}&limit=15`),
    ]);
    const seen = new Set(trDocs.map((d: any) => d.key));
    docs = [...trDocs, ...generalDocs.filter((d: any) => !seen.has(d.key))];
  } else {
    docs = await olFetch(`https://openlibrary.org/search.json?q=${q}&limit=15`);
  }

  return Promise.all(
    docs.map(async (doc: any): Promise<SearchResultBook> => {
      let title = doc.title || "";
      let coverId = doc.cover_i;
      let pageCount = doc.number_of_pages_median || doc.number_of_pages || null;

      // Fetch editions to resolve the Turkish edition and, when the search doc
      // has no page count, to grab a page count from any edition that has one.
      const needsEdition = (language === "tr" || !pageCount) && doc.key;
      if (needsEdition) {
        try {
          const res = await fetch(`https://openlibrary.org${doc.key}/editions.json?limit=50`);
          const data = (await res.json()) as any;
          const entries: any[] = data.entries || [];

          if (language === "tr") {
            const trEditions = entries.filter(
              (e: any) => e.languages && e.languages.some((l: any) => l.key === "/languages/tur")
            );
            // Prefer a Turkish edition that actually has a page count.
            const trEdition = trEditions.find((e: any) => e.number_of_pages) || trEditions[0];
            if (trEdition) {
              title = trEdition.title || title;
              if (trEdition.covers && trEdition.covers.length > 0) {
                coverId = trEdition.covers[0];
              }
              if (trEdition.number_of_pages) {
                pageCount = trEdition.number_of_pages;
              }
            }
          }

          // Still no page count? Use any edition that reports one.
          if (!pageCount) {
            const anyWithPages = entries.find((e: any) => e.number_of_pages);
            if (anyWithPages) pageCount = anyWithPages.number_of_pages;
          }
        } catch (err) {
          console.error(`Failed to fetch editions for ${doc.key}:`, err);
        }
      }

      return {
        id: doc.key || Math.random().toString(),
        title: title,
        author: doc.author_name ? doc.author_name.join(", ") : "Bilinmeyen Yazar",
        totalPages: pageCount,
        coverImage: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
      };
    })
  );
}

/**
 * Search books.
 * - Turkish: Open Library first (it resolves the Turkish edition's title/cover/
 *   pages), then Google Books to fill in if Open Library returns nothing.
 * - Other languages: Google Books first, Open Library as a fallback.
 */
export const searchBooks = api(
  { expose: true, method: "GET", path: "/read-tracker/search" },
  async ({ query, language }: SearchBooksRequest): Promise<SearchBooksResponse> => {
    if (!query || !query.trim()) {
      return { results: [] };
    }

    try {
      let results: SearchResultBook[];
      if (language === "tr") {
        results = await searchOpenLibrary(query, language);
        if (results.length === 0) {
          results = await searchGoogleBooks(query, language);
        }
      } else {
        results = await searchGoogleBooks(query, language);
        if (results.length === 0) {
          results = await searchOpenLibrary(query, language);
        }
      }
      return { results };
    } catch (err) {
      console.error("searchBooks backend error:", err);
      throw APIError.internal("Kitap arama servisi geçici olarak yanıt vermiyor");
    }
  }
);

