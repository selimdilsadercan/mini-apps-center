"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  CaretLeft,
  Plus,
  Trash,
  Star,
  BookOpen,
  Bookmarks,
  CalendarCheck,
  CheckCircle,
  Hourglass,
  PencilSimple,
  Warning,
  CircleNotch,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { getAppRootUrl } from "@/lib/apps";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateDiscoverWidgets } from "@/lib/cache/hubAgendaCache";
import { pillTabClass, PillTabBar } from "../gaming-hub/components/PillTabs";

const client = createBrowserClient();

// Helper to get Monday of current week
function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Helper to format Date to YYYY-MM-DD
function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Helper to get display week range (spanning `weeks` weeks starting from Monday)
function getWeekDisplayRange(mondayStr: string, locale: string, weeks: number = 1): string {
  try {
    const monday = new Date(mondayStr);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7 * Math.max(1, weeks) - 1);

    const optionsDay: Intl.DateTimeFormatOptions = { day: "numeric" };
    const optionsMonthYear: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };

    const formatterDay = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", optionsDay);
    const formatterMonthYear = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", optionsMonthYear);

    if (monday.getMonth() === sunday.getMonth()) {
      return `${formatterDay.format(monday)} - ${formatterDay.format(sunday)} ${formatterMonthYear.format(sunday)}`;
    } else {
      const optionsMonth: Intl.DateTimeFormatOptions = { month: "long" };
      const formatterMonth = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", optionsMonth);
      return `${formatterDay.format(monday)} ${formatterMonth.format(monday)} - ${formatterDay.format(sunday)} ${formatterMonthYear.format(sunday)}`;
    }
  } catch (e) {
    return mondayStr;
  }
}

const MONTH_NAMES: Record<string, string[]> = {
  tr: [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ],
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
};

// Small controlled input to type the current page directly.
function PageInput({
  value,
  max,
  onCommit,
}: {
  value: number;
  max: number | null;
  onCommit: (n: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (isNaN(n)) {
      setDraft(String(value));
    } else {
      onCommit(n);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draft}
      onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
      onFocus={(e) => e.target.select()}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="w-16 text-center bg-app-surface border border-app-border rounded px-1 py-1 text-xs font-black text-app-text outline-none focus:border-[#7C5C43] transition-all"
    />
  );
}

interface Book {
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

interface WeeklyGoal {
  id: string;
  user_id: string;
  week_start: string;
  weeks: number;
  book_id: string | null;
  status: "active" | "completed" | "skipped";
  notes: string | null;
  created_at: string;
  updated_at: string;
  book_title?: string | null;
  book_author?: string | null;
  book_cover?: string | null;
}

type TabType = "habit" | "library";

export default function ReadTrackerPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { locale } = useLanguage();
  const language = locale;
  const { confirm } = useConfirmDialog();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>("habit");
  const [books, setBooks] = useState<Book[]>([]);
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and Modal States
  const [libraryFilter, setLibraryFilter] = useState<string>("reading");
  // How many weeks the next goal should span (used when picking a book)
  const [goalWeeks, setGoalWeeks] = useState<number>(1);
  // Per-book daily reading baseline (device-local): book id -> { date, startPage }.
  // "Pages read today" is derived as current_page - startPage, which keeps today's
  // target stable and the chunk buttons' filled state consistent.
  const [dailyLog, setDailyLog] = useState<Record<string, { date: string; startPage: number }>>({});
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form States
  const [formTitle, setFormTitle] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formTotalPages, setFormTotalPages] = useState("");
  const [formCurrentPage, setFormCurrentPage] = useState("0");
  const [formStatus, setFormStatus] = useState<Book["status"]>("to_read");
  const [formRating, setFormRating] = useState<number | null>(null);
  const [formReview, setFormReview] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("");
  // Finish date (for completed books): month + year required, day optional.
  const [formEndDay, setFormEndDay] = useState("");
  const [formEndMonth, setFormEndMonth] = useState("");
  const [formEndYear, setFormEndYear] = useState("");

  // Book Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearchBooks = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearchLoading(true);
      const res = await client.read_tracker.searchBooks({
        query: searchQuery,
        language: language,
      });
      const formatted = (res.results || []).map((b) => ({
        id: b.id,
        title: b.title,
        authors: b.author,
        pageCount: b.totalPages,
        thumbnail: b.coverImage || "",
      }));
      setSearchResults(formatted);
    } catch (err) {
      console.error(err);
      toast.error(language === "tr" ? "Kitap aranırken hata oluştu." : "Error searching books.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSearchResult = async (result: any) => {
    if (!user) return;
    try {
      setSearchLoading(true);
      // Default the new book's status to the active library filter (e.g. adding
      // while "Yarım Bıraktım" is selected → book is added as dropped).
      const addStatus: Book["status"] =
        activeTab === "library" &&
          ["reading", "to_read", "completed", "dropped"].includes(libraryFilter)
          ? (libraryFilter as Book["status"])
          : "to_read";
      const addCurrentPage =
        addStatus === "completed" && result.pageCount ? result.pageCount : 0;
      await client.read_tracker.upsertBook({
        userId: user.id,
        title: result.title,
        author: result.authors || "Bilinmeyen Yazar",
        totalPages: result.pageCount,
        currentPage: addCurrentPage,
        status: addStatus,
        coverImage: result.thumbnail || null,
      });
      toast.success(language === "tr" ? "Kitap kütüphanenize eklendi!" : "Book added to library!");
      setIsBookModalOpen(false);
      setSearchResults([]);
      setSearchQuery("");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(language === "tr" ? "Kitap eklenirken hata oluştu." : "Error adding book.");
    } finally {
      setSearchLoading(false);
    }
  };

  const currentWeekStart = useMemo(() => {
    return formatDate(getMonday(new Date()));
  }, []);

  const t = {
    tr: {
      appName: "Oku Oku",
      title: "Okuma Arkadaşı",
      today: "Haftalık Okuma",
      library: "Kütüphanem",
      addBook: "Yeni Kitap Ekle",
      editBook: "Kitabı Düzenle",
      bookTitle: "Kitap Adı",
      authorName: "Yazar Adı",
      totalPages: "Toplam Sayfa",
      currentPage: "Okunan Sayfa",
      status: "Okuma Durumu",
      rating: "Puanlama",
      review: "Kişisel İnceleme / Not",
      finishedDate: "Bitirme Tarihi",
      monthLabel: "Ay",
      yearLabel: "Yıl",
      dayOptional: "Gün (ops.)",
      coverUrl: "Kapak Resmi URL (Opsiyonel)",
      save: "Kaydet",
      cancel: "Vazgeç",
      deleteBook: "Kitabı Sil",
      deleteConfirm: "Bu kitabı kütüphanenizden silmek istediğinize emin misiniz?",
      noBooks: "Henüz kütüphanenize kitap eklemediniz.",
      streak: "Haftalık Seri",
      weeksStreak: "haftadır okuyor!",
      activeGoal: "Bu Hafta",
      chooseGoal: "Bu hafta hangi kitabı okuyacaksınız?",
      skipWeek: "Bu Haftayı Pas Geç",
      changeGoal: "Kitabı Değiştir",
      completeGoal: "Hedefi Tamamla",
      skippedWeek: "Bu haftayı pas geçtiniz.",
      skippedDesc: "Dinlenmek ve ara vermek de okuma serüveninin bir parçasıdır! ☕",
      undoSkip: "Vazgeç ve Kitap Seç",
      selectBookPlaceholder: "Kitaplığından bir kitap seç...",
      setGoalBtn: "Hedef Olarak Ayarla",
      goalWeeksLabel: "Kaç hafta sürecek?",
      weekUnit: "hafta",
      currentPageLabel: "Kaçıncı sayfadasın?",
      dailyTargetLabel: "Günlük hedef",
      perDay: "sayfa/gün",
      readTodayDone: "Bugün okudun",
      daysLeft: "gün kaldı",
      readingStatus: {
        to_read: "Okuyacağım",
        reading: "Okuyorum",
        completed: "Okudum",
        dropped: "Yarım Bıraktım",
      },
      goalStatus: {
        active: "Okunuyor",
        completed: "Tamamlandı",
        skipped: "Pas Geçildi",
      },
      progress: "İlerleme",
      streakInfo: "Tamamlanan haftalık hedefleriniz okuma serinizi oluşturur.",
    },
    en: {
      appName: "Oku Oku",
      title: "Read Tracker",
      today: "Weekly Goal",
      library: "Library",
      addBook: "Add New Book",
      editBook: "Edit Book",
      bookTitle: "Book Title",
      authorName: "Author Name",
      totalPages: "Total Pages",
      currentPage: "Pages Read",
      status: "Reading Status",
      rating: "Rating",
      review: "Personal Review / Notes",
      finishedDate: "Finish Date",
      monthLabel: "Month",
      yearLabel: "Year",
      dayOptional: "Day (opt.)",
      coverUrl: "Cover Image URL (Optional)",
      save: "Save",
      cancel: "Cancel",
      deleteBook: "Delete Book",
      deleteConfirm: "Are you sure you want to delete this book from your library?",
      noBooks: "You haven't added any books to your library yet.",
      streak: "Weekly Streak",
      weeksStreak: "weeks streak!",
      activeGoal: "This Week",
      chooseGoal: "Which book will you read this week?",
      skipWeek: "Skip This Week",
      changeGoal: "Change Book",
      completeGoal: "Mark Completed",
      skippedWeek: "You skipped this week.",
      skippedDesc: "Resting and pacing yourself is part of the journey! ☕",
      undoSkip: "Set a Book Instead",
      selectBookPlaceholder: "Select a book from library...",
      setGoalBtn: "Set as Weekly Goal",
      goalWeeksLabel: "How many weeks?",
      weekUnit: "wk",
      currentPageLabel: "What page are you on?",
      dailyTargetLabel: "Daily target",
      perDay: "pages/day",
      readTodayDone: "Read today",
      daysLeft: "days left",
      readingStatus: {
        to_read: "To Read",
        reading: "Reading",
        completed: "Completed",
        dropped: "Dropped",
      },
      goalStatus: {
        active: "Reading",
        completed: "Finished",
        skipped: "Skipped",
      },
      progress: "Progress",
      streakInfo: "Your completed weekly goals build your reading streak.",
    },
  }[language === "tr" ? "tr" : "en"];

  useEffect(() => {
    if (isUserLoaded) {
      fetchData();
    }
  }, [isUserLoaded, user]);

  // Load device-local daily reading baselines
  useEffect(() => {
    try {
      const raw = localStorage.getItem("read_tracker_daily");
      if (raw) setDailyLog(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const persistDailyLog = (next: Record<string, { date: string; startPage: number }>) => {
    try {
      localStorage.setItem("read_tracker_daily", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!user) {
        setBooks([]);
        setGoals([]);
        return;
      }
      const booksRes = await client.read_tracker.getBooks(user.id);
      const goalsRes = await client.read_tracker.getWeeklyGoals(user.id);
      setBooks(booksRes.books || []);
      setGoals(goalsRes.goals || []);
    } catch (err) {
      console.error(err);
      toast.error(language === "tr" ? "Veriler yüklenirken hata oluştu." : "Error loading data.");
    } finally {
      setLoading(false);
    }
  };

  // Find goal covering the current week (a goal may span multiple weeks)
  const currentWeekGoal = useMemo(() => {
    const cur = new Date(currentWeekStart);
    return (
      goals.find((g) => {
        const start = new Date(g.week_start);
        const end = new Date(start);
        end.setDate(start.getDate() + 7 * Math.max(1, g.weeks || 1));
        return cur >= start && cur < end;
      }) || null
    );
  }, [goals, currentWeekStart]);

  // Record the active goal book's page at the start of today (once per day),
  // so today's target and chunk buttons stay stable through the day.
  useEffect(() => {
    if (!currentWeekGoal?.book_id) return;
    const book = books.find((b) => b.id === currentWeekGoal.book_id);
    if (!book) return;
    const today = formatDate(new Date());
    setDailyLog((prev) => {
      const entry = prev[book.id];
      if (entry && entry.date === today) return prev;
      const next = { ...prev, [book.id]: { date: today, startPage: book.current_page } };
      persistDailyLog(next);
      return next;
    });
  }, [currentWeekGoal?.book_id, books]);

  // Modal actions
  const openAddModal = () => {
    setEditingBook(null);
    setFormTitle("");
    setFormAuthor("");
    setFormTotalPages("");
    setFormCurrentPage("0");
    setFormStatus("to_read");
    setFormRating(null);
    setFormReview("");
    setFormCoverImage("");
    setFormEndDay("");
    setFormEndMonth("");
    setFormEndYear("");
    setIsBookModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormTitle(book.title);
    setFormAuthor(book.author);
    setFormTotalPages(book.total_pages ? String(book.total_pages) : "");
    setFormCurrentPage(String(book.current_page));
    setFormStatus(book.status);
    setFormRating(book.rating);
    setFormReview(book.review || "");
    setFormCoverImage(book.cover_image || "");
    // Parse finish date (YYYY-MM-DD...) — day "01" is treated as "no day given".
    if (book.end_date) {
      const [y, m, d] = book.end_date.slice(0, 10).split("-");
      setFormEndYear(y || "");
      setFormEndMonth(m ? String(parseInt(m, 10)) : "");
      setFormEndDay(d && d !== "01" ? String(parseInt(d, 10)) : "");
    } else {
      setFormEndYear("");
      setFormEndMonth("");
      setFormEndDay("");
    }
    setIsBookModalOpen(true);
  };

  // Handle Save Book
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formTitle.trim() || !formAuthor.trim()) {
      toast.error(language === "tr" ? "Lütfen kitap ve yazar adını girin." : "Please enter book title and author.");
      return;
    }

    const tPages = formTotalPages ? parseInt(formTotalPages, 10) : null;
    const cPage = parseInt(formCurrentPage, 10) || 0;

    // Finish date: required month + year for completed books, day optional.
    let endDate: string | null = null;
    if (formStatus === "completed") {
      if (!formEndMonth || !formEndYear) {
        toast.error(
          language === "tr"
            ? "Bitirme ayı ve yılı zorunlu."
            : "Finish month and year are required."
        );
        return;
      }
      const mm = String(parseInt(formEndMonth, 10)).padStart(2, "0");
      const dd = formEndDay ? String(parseInt(formEndDay, 10)).padStart(2, "0") : "01";
      endDate = `${formEndYear}-${mm}-${dd}`;
    }

    try {
      const res = await client.read_tracker.upsertBook({
        id: editingBook?.id || null,
        userId: user.id,
        title: formTitle,
        author: formAuthor,
        totalPages: tPages,
        currentPage: cPage,
        status: formStatus,
        rating: formRating,
        review: formReview || null,
        coverImage: formCoverImage || null,
        endDate,
      });

      toast.success(language === "tr" ? "Kitap başarıyla kaydedildi!" : "Book saved successfully!");
      setIsBookModalOpen(false);
      invalidateDiscoverWidgets(queryClient, user.id);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(language === "tr" ? "Kaydedilirken hata oluştu." : "Error saving book.");
    }
  };

  // Handle Delete Book
  const handleDeleteBook = async (bookId: string) => {
    if (!user) return;
    const ok = await confirm({
      title: t.deleteBook,
      description: t.deleteConfirm,
      confirmText: language === "tr" ? "Sil" : "Delete",
      cancelText: t.cancel,
      variant: "danger",
    });

    if (!ok) return;

    try {
      await client.read_tracker.deleteBook(user.id, bookId);
      toast.success(language === "tr" ? "Kitap silindi." : "Book deleted.");
      setIsBookModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(language === "tr" ? "Kitap silinemedi." : "Error deleting book.");
    }
  };

  // Quick page progress update
  const handleUpdatePageProgress = async (book: Book, newPage: number) => {
    if (!user) return;
    const validPage = Math.max(0, Math.min(book.total_pages || Infinity, newPage));
    // Determine status automatically if completed
    let newStatus = book.status;
    if (book.total_pages && validPage >= book.total_pages) {
      newStatus = "completed";
    } else if (book.status === "to_read" && validPage > 0) {
      newStatus = "reading";
    }

    try {
      await client.read_tracker.upsertBook({
        id: book.id,
        userId: user.id,
        title: book.title,
        author: book.author,
        totalPages: book.total_pages,
        currentPage: validPage,
        status: newStatus,
        rating: book.rating,
        review: book.review,
        coverImage: book.cover_image,
      });
      invalidateDiscoverWidgets(queryClient, user.id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Set weekly goal. `weeks` sets how many weeks the goal spans; `weekStart`
  // lets callers update an existing multi-week goal on its own start week.
  const handleSetWeeklyGoal = async (
    bookId: string | null,
    status: "active" | "completed" | "skipped",
    weeks: number = 1,
    weekStart: string = currentWeekStart
  ) => {
    if (!user) return;
    try {
      await client.read_tracker.upsertWeeklyGoal({
        userId: user.id,
        weekStart,
        weeks: Math.max(1, weeks),
        bookId,
        status,
      });
      toast.success(language === "tr" ? "Haftalık hedef güncellendi!" : "Weekly goal updated!");
      setGoalWeeks(1);
      invalidateDiscoverWidgets(queryClient, user.id);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(language === "tr" ? "Hedef kaydedilemedi." : "Failed to save goal.");
    }
  };

  const bookCounts = useMemo(() => {
    const counts: Record<string, number> = {
      reading: 0,
      to_read: 0,
      completed: 0,
      dropped: 0,
    };
    books.forEach((b) => {
      if (b.status && counts[b.status] !== undefined) {
        counts[b.status]++;
      }
    });
    return counts;
  }, [books]);

  const filteredBooks = useMemo(() => {
    if (libraryFilter === "all") return books;
    return books.filter((b) => b.status === libraryFilter);
  }, [books, libraryFilter]);

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text selection:bg-amber-100 dark:selection:bg-amber-950/40">
      <Toaster position="top-center" />

      {/* Premium Header */}
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-[#7C5C43]" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
              <BookOpen size={18} weight="fill" className="text-[#7C5C43] shrink-0" />
              <span className="truncate">
                Oku <span className="text-[#7C5C43]">Oku</span>
              </span>
            </h1>

            <button
              onClick={openAddModal}
              className="shrink-0 bg-[#7C5C43] hover:bg-[#684C37] text-white w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 transition-all"
            >
              <Plus size={16} weight="bold" />
            </button>
          </div>

          {/* Segmented control tabs */}
          <div className="mt-2">
            <PillTabBar className="!w-auto">
              <button
                onClick={() => setActiveTab("habit")}
                className={pillTabClass(activeTab === "habit")}
              >
                <CalendarCheck size={13} weight={activeTab === "habit" ? "fill" : "bold"} />
                {t.today}
              </button>
              <button
                onClick={() => setActiveTab("library")}
                className={pillTabClass(activeTab === "library")}
              >
                <Bookmarks size={13} weight={activeTab === "library" ? "fill" : "bold"} />
                {t.library}
              </button>
            </PillTabBar>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 pt-4 pb-12 max-w-xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-app-muted gap-2">
            <CircleNotch size={32} className="animate-spin text-[#7C5C43]" />
          </div>
        ) : !user ? (
          <div className="bg-app-surface rounded-2xl border border-app-border p-8 text-center shadow-sm">
            <Warning size={36} className="mx-auto text-amber-500 mb-2" />
            <p className="text-sm font-medium text-app-muted">
              {language === "tr"
                ? "Lütfen giriş yapın."
                : "Please sign in to save your reading progress."}
            </p>
          </div>
        ) : activeTab === "habit" ? (
          <div className="flex flex-col gap-4">

            {/* Weekly Goal Area */}
            <div className="bg-app-surface rounded-2xl border border-app-border p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-app-text truncate min-w-0">
                  {t.activeGoal}
                </h2>
                <span className="shrink-0 whitespace-nowrap text-[10px] font-bold bg-app-bg text-app-muted border border-app-border px-2.5 py-1 rounded-full">
                  {getWeekDisplayRange(
                    currentWeekGoal?.week_start || currentWeekStart,
                    language,
                    currentWeekGoal?.weeks || 1
                  )}
                </span>
              </div>

              {currentWeekGoal && currentWeekGoal.status === "skipped" ? (
                <div className="text-center py-6">
                  <span className="text-3xl">☕</span>
                  <h3 className="text-sm font-bold text-app-text mt-2">{t.skippedWeek}</h3>
                  <p className="text-xs text-app-muted mt-1 max-w-xs mx-auto">
                    {t.skippedDesc}
                  </p>
                  <button
                    onClick={() => handleSetWeeklyGoal(null, "active", currentWeekGoal.weeks, currentWeekGoal.week_start)}
                    className="mt-4 text-xs font-bold text-[#7C5C43] hover:underline"
                  >
                    {t.undoSkip}
                  </button>
                </div>
              ) : currentWeekGoal && currentWeekGoal.book_id ? (
                <div>
                  {/* Goal book details */}
                  <div className="flex gap-4">
                    {currentWeekGoal.book_cover ? (
                      <img
                        src={currentWeekGoal.book_cover}
                        alt={currentWeekGoal.book_title || ""}
                        className="w-16 h-20 object-cover rounded-lg shadow-sm border border-app-border"
                      />
                    ) : (
                      <div className="w-16 h-20 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#7C5C43]">
                        <BookOpen size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-black text-app-text line-clamp-2 leading-tight">
                        {currentWeekGoal.book_title}
                      </h4>
                      <p className="text-xs text-app-muted font-bold truncate mt-0.5">
                        {currentWeekGoal.book_author}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    {/* Progress bar */}
                    {(() => {
                      const book = books.find((b) => b.id === currentWeekGoal.book_id);
                      if (!book) return null;
                      const total = book.total_pages || 0;
                      const current = book.current_page || 0;
                      const percent = total > 0 ? Math.round((current / total) * 100) : 0;

                      // Remaining days in this goal's span (inclusive of today)
                      const start = new Date(currentWeekGoal.week_start);
                      const lastDay = new Date(start);
                      lastDay.setDate(
                        start.getDate() + 7 * Math.max(1, currentWeekGoal.weeks || 1) - 1
                      );
                      lastDay.setHours(0, 0, 0, 0);
                      const todayMid = new Date();
                      todayMid.setHours(0, 0, 0, 0);
                      const remainingDays = Math.max(
                        1,
                        Math.floor((lastDay.getTime() - todayMid.getTime()) / 86400000) + 1
                      );

                      // Today's baseline = page count at the start of today.
                      const today = formatDate(new Date());
                      const entry = dailyLog[book.id];
                      const base =
                        entry && entry.date === today ? entry.startPage : current;

                      // Daily page target = pages remaining from today's baseline over the
                      // remaining days. Last day → exact remainder (finish precisely);
                      // earlier days → round up to nearest 10 so it isn't confusing.
                      const remainingFromBase = Math.max(0, total - base);
                      let dailyTarget = 5;
                      if (total > 0 && remainingFromBase > 0) {
                        if (remainingDays <= 1) {
                          dailyTarget = remainingFromBase;
                        } else {
                          const rounded =
                            Math.ceil(remainingFromBase / remainingDays / 10) * 10;
                          dailyTarget = Math.min(Math.max(10, rounded), remainingFromBase);
                        }
                      }

                      // Split today's target into ~30-page chunks, e.g. 80 -> [30, 30, 20]
                      const CHUNK = 30;
                      const chunks: number[] = [];
                      let rem = dailyTarget;
                      while (rem > 0 && chunks.length < 12) {
                        const c = Math.min(CHUNK, rem);
                        chunks.push(c);
                        rem -= c;
                      }

                      const isBookFinished = total > 0 && current >= total;
                      const hasTarget =
                        total > 0 && remainingFromBase > 0 && chunks.length > 0 && !isBookFinished;

                      // Fill up to (and including) chunk i; press a filled chunk to undo it.
                      const pressChunk = (i: number) => {
                        const cumInclusive = chunks
                          .slice(0, i + 1)
                          .reduce((a, b) => a + b, 0);
                        const cumExclusive = chunks
                          .slice(0, i)
                          .reduce((a, b) => a + b, 0);
                        const filled = current >= base + cumInclusive;
                        handleUpdatePageProgress(
                          book,
                          filled ? base + cumExclusive : base + cumInclusive
                        );
                      };

                      return (
                        <div>
                          <div className="flex justify-between text-[10px] text-app-muted font-bold mb-1">
                            <span>{t.progress}: %{percent}</span>
                            <span>
                              {current} / {total || "?"} sayfa
                            </span>
                          </div>
                          <div className="w-full bg-app-tab-track h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#7C5C43] h-full rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          {/* Daily target / Completion info */}
                          {isBookFinished ? (
                            <div className="mt-2.5 text-[10px] font-bold text-[#7C5C43] flex items-center gap-1">
                              <CheckCircle size={13} weight="fill" />
                              <span>Hedef kitap tamamlandı! 🎉</span>
                            </div>
                          ) : hasTarget ? (
                            <div className="mt-2.5 text-[10px] font-bold text-app-muted">
                              {t.dailyTargetLabel}:{" "}
                              <span className="text-[#7C5C43] font-black">
                                {dailyTarget} {t.perDay}
                              </span>{" "}
                              · {remainingDays} {t.daysLeft}
                            </div>
                          ) : null}

                          {/* Manual page input + chunked daily target buttons */}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <PageInput
                              value={current}
                              max={book.total_pages}
                              onCommit={(n) => handleUpdatePageProgress(book, n)}
                            />
                            {hasTarget &&
                              chunks.map((c, i) => {
                                const cumInclusive = chunks
                                  .slice(0, i + 1)
                                  .reduce((a, b) => a + b, 0);
                                const filled = current >= base + cumInclusive;
                                return (
                                  <button
                                    key={i}
                                    onClick={() => pressChunk(i)}
                                    className={`min-w-[2.75rem] h-7 px-2.5 rounded-lg border flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wide active:scale-95 transition-all cursor-pointer bg-transparent border-app-border text-app-text hover:bg-app-surface-muted hover:border-app-muted ${
                                      filled ? "opacity-60" : ""
                                    }`}
                                  >
                                    {filled ? (
                                      <CheckCircle size={10} weight="fill" />
                                    ) : (
                                      <Plus size={10} weight="bold" />
                                    )}
                                    <span className={filled ? "line-through" : ""}>
                                      {c} <span className="normal-case font-bold">syf</span>
                                    </span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="border-t border-app-border mt-4 pt-3 flex items-center gap-5">
                    <button
                      onClick={() => handleSetWeeklyGoal(null, "active", currentWeekGoal.weeks, currentWeekGoal.week_start)}
                      className="text-xs font-bold text-app-muted hover:text-app-text flex items-center gap-1"
                    >
                      <ArrowsClockwise size={14} weight="bold" />
                      {t.changeGoal}
                    </button>

                    {currentWeekGoal.status !== "completed" && (
                      <button
                        onClick={() => handleSetWeeklyGoal(currentWeekGoal.book_id, "completed", currentWeekGoal.weeks, currentWeekGoal.week_start)}
                        className="text-xs font-bold text-app-muted hover:text-app-text flex items-center gap-1"
                      >
                        <CheckCircle size={14} weight="fill" />
                        {t.completeGoal}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <p className="text-sm font-bold text-app-text">{t.chooseGoal}</p>
                  <div className="mt-4 w-full max-w-xs flex flex-col gap-2">
                    {books.filter((b) => b.status === "reading" || b.status === "to_read").length > 0 ? (
                      <>
                        {/* Week span selector */}
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-app-muted">
                            {t.goalWeeksLabel}
                          </span>
                          <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-app-border bg-app-tab-track">
                            {[1, 2, 3, 4].map((w) => (
                              <button
                                key={w}
                                type="button"
                                onClick={() => setGoalWeeks(w)}
                                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${goalWeeks === w
                                    ? "bg-app-tab-active text-app-text shadow-sm"
                                    : "text-app-muted hover:text-app-text"
                                  }`}
                              >
                                {w} {t.weekUnit}
                              </button>
                            ))}
                          </div>
                        </div>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSetWeeklyGoal(e.target.value, "active", goalWeeks);
                            }
                          }}
                          className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-text outline-none focus:border-[#7C5C43] shadow-sm"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            {t.selectBookPlaceholder}
                          </option>
                          {books
                            .filter((b) => b.status === "reading" || b.status === "to_read")
                            .map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.title} - {b.author}
                              </option>
                            ))}
                        </select>
                      </>
                    ) : (
                      <p className="text-xs text-app-muted">
                        {language === "tr"
                          ? "Hedef seçmek için önce kütüphanenize okuduğunuz veya okuyacağınız bir kitap eklemelisiniz."
                          : "You must first add a book in 'Reading' or 'To Read' status to your library."}
                      </p>
                    )}

                    <button
                      onClick={() => handleSetWeeklyGoal(null, "skipped")}
                      className="mt-2 text-xs font-black uppercase tracking-wider text-app-muted hover:text-[#7C5C43] py-2 border border-dashed border-app-border hover:border-[#7C5C43] rounded-xl transition-all"
                    >
                      {t.skipWeek}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Library Tab */
          <div className="flex flex-col gap-4">
            {/* Filter segments */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "reading", label: t.readingStatus.reading, count: bookCounts.reading },
                { id: "to_read", label: t.readingStatus.to_read, count: bookCounts.to_read },
                { id: "completed", label: t.readingStatus.completed, count: bookCounts.completed },
                { id: "dropped", label: t.readingStatus.dropped, count: bookCounts.dropped },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setLibraryFilter(filter.id)}
                  className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition-all border flex items-center gap-1.5 ${libraryFilter === filter.id
                      ? "bg-[#7C5C43] border-[#7C5C43] text-white shadow-sm"
                      : "bg-app-surface border border-app-border text-app-muted hover:text-app-text"
                    }`}
                >
                  <span>{filter.label}</span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-full tabular-nums ${libraryFilter === filter.id
                        ? "bg-white/20 text-white"
                        : "bg-app-surface-muted text-app-muted"
                      }`}
                  >
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Books List */}
            {filteredBooks.length === 0 ? (
              <div className="bg-app-surface rounded-2xl border border-app-border p-8 text-center shadow-sm text-app-muted">
                <BookOpen size={36} className="mx-auto text-app-muted/60 mb-2" />
                <p className="text-sm font-medium">{t.noBooks}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredBooks.map((book) => {
                  const percent = book.total_pages && book.total_pages > 0
                    ? Math.round((book.current_page / book.total_pages) * 100)
                    : 0;

                  return (
                    <div
                      key={book.id}
                      className="bg-app-surface hover:bg-app-surface-muted/60 rounded-2xl border border-app-border p-4 shadow-sm flex gap-3.5 relative transition-all"
                    >
                      {book.cover_image ? (
                        <img
                          src={book.cover_image}
                          alt={book.title}
                          className="w-14 h-18 object-cover rounded-lg border border-app-border shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-18 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#7C5C43] shrink-0">
                          <BookOpen size={20} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-black text-app-text truncate leading-none">
                              {book.title}
                            </h4>
                            <button
                              onClick={() => openEditModal(book)}
                              className="text-app-muted hover:text-app-text p-1 -mt-1 -mr-1"
                            >
                              <PencilSimple size={14} weight="bold" />
                            </button>
                          </div>
                          <p className="text-xs text-app-muted font-bold truncate mt-1">
                            {book.author}
                          </p>
                        </div>

                        <div className="mt-2">
                          <div className="flex justify-between items-center text-[10px] text-app-muted font-bold mb-1">
                            <span className="flex items-center gap-1 capitalize">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${book.status === "reading"
                                    ? "bg-blue-500"
                                    : book.status === "completed"
                                      ? "bg-green-500"
                                      : book.status === "to_read"
                                        ? "bg-amber-500"
                                        : "bg-gray-400"
                                  }`}
                              />
                              {t.readingStatus[book.status]}
                            </span>
                            <span>
                              {book.current_page} / {book.total_pages || "?"} p.
                            </span>
                          </div>

                          {book.total_pages ? (
                            <div className="w-full bg-app-tab-track h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#7C5C43] h-full rounded-full transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Slide-over Add/Edit Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-app-surface rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-app-border flex flex-col">
            <div className="px-5 pt-5 pb-3 border-b border-app-border flex justify-between items-center">
              <h2 className="text-base font-black text-app-text uppercase tracking-tight">
                {editingBook ? t.editBook : t.addBook}
              </h2>
              {editingBook && (
                <button
                  type="button"
                  onClick={() => handleDeleteBook(editingBook.id)}
                  className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs font-bold"
                >
                  <Trash size={14} weight="bold" />
                  {t.deleteBook}
                </button>
              )}
            </div>

            {!editingBook ? (
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-app-muted mb-1.5">
                    {language === "tr" ? "Kitap Ara (Open Library)" : "Search Book (Open Library)"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === "tr" ? "Kitap adı veya yazar..." : "Book title or author..."}
                      className="flex-1 bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-text outline-none focus:bg-app-surface focus:border-[#7C5C43]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearchBooks();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSearchBooks}
                      className="bg-[#7C5C43] hover:bg-[#684C37] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                    >
                      {searchLoading ? (
                        <CircleNotch size={14} className="animate-spin" />
                      ) : language === "tr" ? (
                        "Ara"
                      ) : (
                        "Search"
                      )}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="mt-3 max-h-60 overflow-y-auto border border-app-border rounded-xl bg-app-bg divide-y divide-app-border shadow-inner">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => handleSelectSearchResult(result)}
                          className="w-full text-left p-2.5 hover:bg-app-surface flex gap-2.5 transition-all"
                        >
                          {result.thumbnail ? (
                            <img
                              src={result.thumbnail}
                              alt=""
                              className="w-8 h-10 object-cover rounded border border-app-border shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-10 bg-amber-500/10 rounded flex items-center justify-center text-[#7C5C43] shrink-0">
                              <BookOpen size={14} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-app-text truncate">{result.title}</p>
                            <p className="text-[10px] text-app-muted truncate">{result.authors}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBookModalOpen(false);
                      setSearchResults([]);
                      setSearchQuery("");
                    }}
                    className="flex-1 py-2.5 bg-app-tab-track hover:bg-app-bg text-app-text text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveBook} className="p-5 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-app-muted mb-1.5">
                    {t.bookTitle}
                  </label>
                  <div className="text-sm font-bold text-app-text bg-app-bg border border-app-border rounded-xl px-3 py-2">
                    {formTitle}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-app-muted mb-1.5">
                    {t.authorName}
                  </label>
                  <div className="text-sm font-bold text-app-text bg-app-bg border border-app-border rounded-xl px-3 py-2">
                    {formAuthor}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase text-app-muted mb-1.5">
                      {t.totalPages}
                    </label>
                    <input
                      type="number"
                      value={formTotalPages}
                      onChange={(e) => setFormTotalPages(e.target.value)}
                      placeholder="örn. 687"
                      className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-text outline-none focus:bg-app-surface focus:border-[#7C5C43] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-app-muted mb-1.5">
                      {t.currentPage}
                    </label>
                    <input
                      type="number"
                      value={formCurrentPage}
                      onChange={(e) => setFormCurrentPage(e.target.value)}
                      placeholder="0"
                      className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-text outline-none focus:bg-app-surface focus:border-[#7C5C43] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-app-muted mb-1.5">
                    {t.status}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Book["status"])}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-text outline-none focus:bg-app-surface focus:border-[#7C5C43] transition-all"
                  >
                    <option value="to_read">{t.readingStatus.to_read}</option>
                    <option value="reading">{t.readingStatus.reading}</option>
                    <option value="completed">{t.readingStatus.completed}</option>
                    <option value="dropped">{t.readingStatus.dropped}</option>
                  </select>
                </div>

                {formStatus === "completed" && (
                  <>
                    <div>
                      <label className="block text-xs font-black uppercase text-app-muted mb-1.5">
                        {t.finishedDate}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          min={1}
                          max={31}
                          value={formEndDay}
                          onChange={(e) => setFormEndDay(e.target.value)}
                          placeholder={t.dayOptional}
                          className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-text outline-none focus:bg-app-surface focus:border-[#7C5C43] transition-all"
                        />
                        <select
                          value={formEndMonth}
                          onChange={(e) => setFormEndMonth(e.target.value)}
                          className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-text outline-none focus:bg-app-surface focus:border-[#7C5C43] transition-all"
                        >
                          <option value="" disabled>
                            {t.monthLabel}
                          </option>
                          {MONTH_NAMES[language === "tr" ? "tr" : "en"].map((m, i) => (
                            <option key={i + 1} value={i + 1}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          value={formEndYear}
                          onChange={(e) => setFormEndYear(e.target.value)}
                          className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-text outline-none focus:bg-app-surface focus:border-[#7C5C43] transition-all"
                        >
                          <option value="" disabled>
                            {t.yearLabel}
                          </option>
                          {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i).map(
                            (y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-app-muted mb-1.5">
                        {t.rating}
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormRating(star)}
                            className="text-amber-400 hover:scale-110 transition-all"
                          >
                            <Star size={24} weight={formRating && formRating >= star ? "fill" : "bold"} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-app-muted mb-1.5">
                        {t.review}
                      </label>
                      <textarea
                        value={formReview}
                        onChange={(e) => setFormReview(e.target.value)}
                        placeholder="Kitap hakkında ne düşünüyorsunuz?"
                        rows={3}
                        className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-text outline-none focus:bg-app-surface focus:border-[#7C5C43] transition-all resize-none"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBookModalOpen(false);
                      setSearchResults([]);
                      setSearchQuery("");
                    }}
                    className="flex-1 py-2.5 bg-app-tab-track hover:bg-app-bg text-app-text text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#7C5C43] hover:bg-[#684C37] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#7C5C43]/20"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

