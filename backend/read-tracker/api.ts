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
 * Search books using Open Library API (Server-side)
 */
export const searchBooks = api(
  { expose: true, method: "GET", path: "/read-tracker/search" },
  async ({ query, language }: SearchBooksRequest): Promise<SearchBooksResponse> => {
    if (!query || !query.trim()) {
      return { results: [] };
    }

    let docs: any[] = [];
    try {
      if (language === "tr") {
        // Try Turkish language search first
        try {
          const res = await fetch(
            `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&language=tur&limit=5`
          );
          const data = (await res.json()) as any;
          docs = data.docs || [];
        } catch (e) {
          console.error("Turkish language query failed, falling back", e);
        }
      }

      // General search fallback
      if (docs.length === 0) {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`
        );
        const data = (await res.json()) as any;
        docs = data.docs || [];
      }

      const results: SearchResultBook[] = await Promise.all(
        docs.map(async (doc: any): Promise<SearchResultBook> => {
          let title = doc.title || "";
          let coverId = doc.cover_i;
          let pageCount = doc.number_of_pages_median || doc.number_of_pages || null;

          if (language === "tr" && doc.language && doc.language.includes("tur") && doc.key) {
            try {
              const res = await fetch(`https://openlibrary.org${doc.key}/editions.json?limit=50`);
              const data = (await res.json()) as any;
              const entries = data.entries || [];
              const trEdition = entries.find((e: any) =>
                e.languages && e.languages.some((l: any) => l.key === "/languages/tur")
              );
              if (trEdition) {
                title = trEdition.title || title;
                if (trEdition.covers && trEdition.covers.length > 0) {
                  coverId = trEdition.covers[0];
                }
                if (trEdition.number_of_pages) {
                  pageCount = trEdition.number_of_pages;
                }
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

      return { results };
    } catch (err) {
      console.error("searchBooks backend error:", err);
      throw APIError.internal("Kitap arama servisi geçici olarak yanıt vermiyor");
    }
  }
);

