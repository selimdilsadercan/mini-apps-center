"use client";

import React, { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  CaretLeft,
  Plus,
  Trash,
  Heart,
  HandsClapping,
  Flame,
  Calendar,
  MapPin,
  Lock,
  LockOpen,
  Sparkle,
  BookmarkSimple,
  ShareNetwork,
  Download,
  Copy,
  CheckCircle,
  Eye,
  EyeSlash,
  Star,
  CaretRight,
  X,
} from "@phosphor-icons/react";

import { createBrowserClient } from "@/lib/api";
import { getAppRootUrl } from "@/lib/apps";

// Types matching backend API
interface Reaction {
  id: string;
  logId: string;
  userId: string;
  reactionType: string;
  username?: string | null;
  avatarUrl?: string | null;
}

interface Log {
  id: string;
  userId: string;
  activityType: string;
  title: string;
  location?: string | null;
  date: string;
  notes?: string | null;
  rating?: number | null;
  imageUrl?: string | null;
  isImported: boolean;
  isPrivate: boolean;
  metadata: any;
  createdAt: string;
  reactions: Reaction[];
  username?: string | null;
  avatarUrl?: string | null;
}

interface Suggestion {
  id: string;
  source: "stamp_card" | "campus_events" | "workplaces";
  title: string;
  location?: string | null;
  activityType: string;
  date: string;
  imageUrl?: string | null;
  metadata: any;
}

interface Summary {
  totalCount: number;
  badge: string;
  badgeEmoji: string;
  categoryCounts: { category: string; count: number }[];
  highlightLog: Log | null;
}

// Category details helper
const getCategoryInfo = (type: string) => {
  switch (type) {
    case "cafe":
      return { emoji: "☕", label: "Kafe", color: "from-amber-400 to-amber-500", bgLight: "bg-amber-500/10 text-amber-500" };
    case "restaurant":
      return { emoji: "🍔", label: "Yemek", color: "from-orange-400 to-orange-500", bgLight: "bg-orange-500/10 text-orange-500" };
    case "cinema":
      return { emoji: "🍿", label: "Sinema", color: "from-red-400 to-red-500", bgLight: "bg-red-500/10 text-red-500" };
    case "sport":
      return { emoji: "🏃‍♂️", label: "Spor", color: "from-green-400 to-green-500", bgLight: "bg-green-500/10 text-green-500" };
    case "study":
      return { emoji: "📚", label: "Çalışma", color: "from-blue-400 to-blue-500", bgLight: "bg-blue-500/10 text-blue-500" };
    case "social":
      return { emoji: "🎭", label: "Sosyal", color: "from-purple-400 to-purple-500", bgLight: "bg-purple-500/10 text-purple-500" };
    case "outdoor":
      return { emoji: "🛶", label: "Aktivite", color: "from-teal-400 to-teal-500", bgLight: "bg-teal-500/10 text-teal-500" };
    case "event":
      return { emoji: "🎫", label: "Etkinlik", color: "from-indigo-400 to-indigo-500", bgLight: "bg-indigo-500/10 text-indigo-500" };
    default:
      return { emoji: "✨", label: "Diğer", color: "from-rose-400 to-rose-500", bgLight: "bg-rose-500/10 text-rose-500" };
  }
};

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export default function DiaryPage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const client = createBrowserClient();

  // State variables
  const [activeTab, setActiveTab] = useState<"timeline" | "feed" | "recap">("timeline");
  const [logs, setLogs] = useState<Log[]>([]);
  const [feed, setFeed] = useState<Log[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dbPlaces, setDbPlaces] = useState<any[]>([]);
  const [dbEvents, setDbEvents] = useState<any[]>([]);
  const [suggestedMovies, setSuggestedMovies] = useState<any[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  // Month-Year selection for recap
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalLocation, setModalLocation] = useState("");
  const [modalType, setModalType] = useState("cafe");
  const [modalDate, setModalDate] = useState(new Date().toISOString().substring(0, 10));
  const [modalNotes, setModalNotes] = useState("");
  const [modalRating, setModalRating] = useState(0);
  const [modalIsPrivate, setModalIsPrivate] = useState(false);
  const [modalIsImported, setModalIsImported] = useState(false);
  const [modalMetadata, setModalMetadata] = useState<any>({});

  // Wrapped slider state
  const [isWrappedOpen, setIsWrappedOpen] = useState(false);
  const [wrappedSlide, setWrappedSlide] = useState(0);

  // Fetch initial data
  useEffect(() => {
    if (isUserLoaded && user) {
      fetchData();
    } else if (isUserLoaded && !user) {
      setLoading(false);
    }
  }, [isUserLoaded, user]);

  // Fetch recap summary when month changes
  useEffect(() => {
    if (user) {
      fetchSummary();
    }
  }, [selectedMonth, selectedYear, user, logs]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const [logsRes, suggestionsRes, feedRes, placesRes, eventsRes] = await Promise.all([
        client.diary.getLogs(user.id),
        client.diary.getSuggestions(user.id),
        client.diary.getFeed(user.id),
        client.workplaces.listPlaces({ city: "kahramanmaras" }).catch(() => ({ places: [] })),
        client.campus_events.getEvents({ userId: user.id }).catch(() => ({ events: [] })),
      ]);

      setLogs(logsRes.logs || []);
      setSuggestions(suggestionsRes.suggestions || []);
      setFeed(feedRes.feed || []);
      setDbPlaces(placesRes.places || []);
      setDbEvents(eventsRes.events || []);

      // Fetch movie suggestions asynchronously
      client.film_graph.getDailySuggestions(user.id)
        .then((moviesRes) => {
          const list = [];
          if (moviesRes.movie1) list.push(moviesRes.movie1);
          if (moviesRes.movie2) list.push(moviesRes.movie2);
          if (moviesRes.movie3) list.push(moviesRes.movie3);
          setSuggestedMovies(list);
        })
        .catch((me) => console.warn("Failed to fetch film suggestions:", me));
    } catch (e) {
      console.error("Error loading data:", e);
      toast.error("Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!user) return;
    try {
      const summaryRes = await client.diary.getSummary(
        user.id,
        selectedYear,
        selectedMonth
      );
      setSummary(summaryRes);
    } catch (e) {
      console.error("Error fetching summary:", e);
    }
  };

  // Add Log Handler
  const handleAddLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!modalTitle.trim()) {
      toast.error("Lütfen bir başlık girin.");
      return;
    }

    const toastId = toast.loading("Kayıt ekleniyor...");
    try {
      const dateIso = new Date(modalDate).toISOString();
      const res = await client.diary.addLog({
        userId: user.id,
        activityType: modalType,
        title: modalTitle,
        location: modalLocation,
        date: dateIso,
        notes: modalNotes,
        rating: modalRating > 0 ? modalRating : undefined,
        isPrivate: modalIsPrivate,
        isImported: modalIsImported,
        metadata: modalMetadata,
      });

      if (res.success && res.log) {
        setLogs([res.log, ...logs]);
        setIsAddModalOpen(false);
        resetAddModal();
        toast.success("Aktivite günlüğüne kaydedildi!", { id: toastId });

        // Update suggestions list by filtering out the one added
        if (modalIsImported && modalMetadata) {
          const key = modalMetadata.eventId ? `event-${modalMetadata.eventId}` :
                        modalMetadata.placeId ? `place-${modalMetadata.placeId}` :
                        modalMetadata.cardId ? `card-${modalMetadata.cardId}` : "";
          if (key) {
            setSuggestions(suggestions.filter((s) => s.id !== key));
          }
        }
      } else {
        toast.error("Kayıt eklenemedi.", { id: toastId });
      }
    } catch (e) {
      console.error("Error adding log:", e);
      toast.error("Kayıt eklenirken bir hata oluştu.", { id: toastId });
    }
  };

  // Delete Log Handler
  const handleDeleteLog = async (logId: string) => {
    if (!user) return;
    if (!confirm("Bu anıyı günlüğünden silmek istediğine emin misin?")) return;

    try {
      const res = await client.diary.deleteLog({ userId: user.id, logId });
      if (res.success) {
        setLogs(logs.filter((l) => l.id !== logId));
        toast.success("Anı silindi.");
      }
    } catch (e) {
      console.error("Error deleting log:", e);
      toast.error("Silinirken hata oluştu.");
    }
  };

  // React Handler
  const handleReactLog = async (logId: string, reactionType: string) => {
    if (!user) {
      toast.error("Beğenmek için giriş yapmalısın.");
      return;
    }
    try {
      const res = await client.diary.reactLog({
        userId: user.id,
        logId,
        reactionType,
      });
      if (res.success) {
        // Update reactions locally in logs and feed arrays
        const updateReactions = (list: Log[]) =>
          list.map((item) =>
            item.id === logId ? { ...item, reactions: res.reactions } : item
          );
        setLogs(updateReactions(logs));
        setFeed(updateReactions(feed));
      }
    } catch (e) {
      console.error("React error:", e);
    }
  };

  // Suggestion click pre-fills the form
  const handleApplySuggestion = (s: Suggestion) => {
    resetAddModal();
    setModalTitle(s.title);
    setModalLocation(s.location || "");
    setModalType(s.activityType);
    setModalDate(s.date.substring(0, 10));
    setModalIsImported(true);
    setModalMetadata(s.metadata || {});
    setIsAddModalOpen(true);
  };

  const resetAddModal = () => {
    setModalTitle("Kafe Keyfi");
    setModalLocation("");
    setModalType("cafe");
    setModalDate(new Date().toISOString().substring(0, 10));
    setModalNotes("");
    setModalRating(0);
    setModalIsPrivate(false);
    setModalIsImported(false);
    setModalMetadata({});
  };


  // Share utilities
  const handleCopyTextSummary = (s: Summary, monthName: string) => {
    const text = `🏆 ${monthName.toUpperCase()} AYI MACERA RAPORUM!\n\n` +
      `📅 Toplam Keşif: ${s.totalCount} aktivite\n` +
      `🏅 Kaşif Seviyem: ${s.badgeEmoji} ${s.badge}\n` +
      `🔥 Favori Kategorilerim:\n` +
      s.categoryCounts.slice(0, 3).map((item, idx) => {
        const info = getCategoryInfo(item.category);
        return `   ${idx + 1}. ${info.emoji} ${info.label} (${item.count} kez)`;
      }).join("\n") +
      (s.highlightLog ? `\n\n⭐ Ayın Unutulmazı: ${s.highlightLog.title} (${s.highlightLog.rating}★)` : "") +
      `\n\nSen de kendi günlüğünü oluştur, arkadaşlarınla kapış! 👉 gunluk.allminiapps.com`;

    navigator.clipboard.writeText(text);
    toast.success("Özet metni panoya kopyalandı!");
  };

  const handleDownloadCard = (s: Summary, monthName: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1920);
    grad.addColorStop(0, "#0F172A"); // Slate-900
    grad.addColorStop(0.5, "#4C0519"); // Deep dark rose
    grad.addColorStop(1, "#881337"); // Rich rose
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Glow Circles
    ctx.fillStyle = "rgba(244, 63, 94, 0.15)";
    ctx.beginPath();
    ctx.arc(200, 350, 450, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(99, 102, 241, 0.15)";
    ctx.beginPath();
    ctx.arc(880, 1550, 550, 0, Math.PI * 2);
    ctx.fill();

    // Border Card Outline
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 4;
    ctx.strokeRect(100, 250, 880, 1420);

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(100, 250, 880, 1420);

    // Watermark
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("EVERYTHING APP", 540, 200);

    // Header Title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 76px sans-serif";
    ctx.fillText("DIARY WRAPPED", 540, 420);

    ctx.fillStyle = "#F43F5E";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText(monthName.toUpperCase() + " ÖZETİ", 540, 500);

    // Big Count Number
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "100 240px sans-serif";
    ctx.fillText(s.totalCount.toString(), 540, 800);

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText("TAMAMLANAN AKTİVİTE", 540, 885);

    // Divider
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.moveTo(200, 960);
    ctx.lineTo(880, 960);
    ctx.stroke();

    // Badge
    ctx.fillStyle = "#F43F5E";
    ctx.font = "bold 56px sans-serif";
    ctx.fillText(`${s.badgeEmoji} ${s.badge}`, 540, 1060);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "32px sans-serif";
    ctx.fillText("Kaşif Derecesi", 540, 1115);

    // Top Categories List
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 38px sans-serif";
    let startY = 1240;

    if (s.categoryCounts && s.categoryCounts.length > 0) {
      ctx.fillText("En Çok Tercih Edilenler:", 200, startY);
      startY += 90;
      s.categoryCounts.slice(0, 3).forEach((item, idx) => {
        const info = getCategoryInfo(item.category);
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillText(`${idx + 1}. ${info.emoji} ${info.label}`, 220, startY);
        ctx.textAlign = "right";
        ctx.fillStyle = "#F43F5E";
        ctx.fillText(`${item.count} Keşif`, 860, startY);
        ctx.textAlign = "left";
        startY += 75;
      });
    }

    // Link
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.font = "italic 32px sans-serif";
    ctx.fillText("gunluk.allminiapps.com", 540, 1800);

    // Download image
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `Diary_Wrapped_${monthName}.png`;
    link.href = image;
    link.click();
    toast.success("Görsel indirildi!");
  };

  // Group timeline logs by year/month
  const groupLogs = () => {
    const groups: { [key: string]: Log[] } = {};
    logs.forEach((log) => {
      const d = new Date(log.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(log);
    });
    return groups;
  };

  const groupedLogs = groupLogs();
  const sortedGroupKeys = Object.keys(groupedLogs).sort((a, b) => {
    const [aY, aM] = a.split("-").map(Number);
    const [bY, bM] = b.split("-").map(Number);
    return bY !== aY ? bY - aY : bM - aM;
  });

  const currentMonthName = MONTHS_TR[selectedMonth - 1] + " " + selectedYear;

  // React counts builder
  const getReactionCount = (reactions: Reaction[], type: string) => {
    return reactions.filter((r) => r.reactionType === type).length;
  };

  const hasUserReacted = (reactions: Reaction[], type: string) => {
    if (!user) return false;
    return reactions.some((r) => r.userId === user.id && r.reactionType === type);
  };

  const renderQuickSuggestions = () => {
    let chips: { label: string; title: string; location?: string; date?: string }[] = [];

    if (modalType === "cafe" || modalType === "restaurant" || modalType === "study") {
      const filteredPlaces = dbPlaces.filter((p) => {
        const types = p.types || [];
        if (modalType === "cafe") return types.some((t: string) => ["cafe", "coffee", "dessert"].includes(t));
        if (modalType === "restaurant") return types.some((t: string) => ["restaurant", "food", "fastfood"].includes(t));
        if (modalType === "study") return types.some((t: string) => ["library", "study", "coworking"].includes(t));
        return true;
      });

      chips = filteredPlaces.slice(0, 6).map((p) => ({
        label: p.name,
        title: `${p.name} ${modalType === "cafe" ? "☕ Kafe Keyfi" : modalType === "restaurant" ? "🍔 Yemek" : "📚 Çalışma"}`,
        location: p.name + (p.address ? `, ${p.address}` : ""),
      }));

      if (chips.length === 0) {
        if (modalType === "cafe") {
          chips = [
            { label: "Starbucks", title: "Starbucks Çalışma Seansı", location: "Starbucks" },
            { label: "Espresso Lab", title: "Espresso Lab Kahve Molası", location: "Espresso Lab" },
            { label: "Mado", title: "Mado Kahve Keyfi", location: "Mado" },
          ];
        } else if (modalType === "restaurant") {
          chips = [
            { label: "Burger King", title: "Burger King Atıştırmalığı", location: "Burger King" },
            { label: "Köfteci Ramiz", title: "Köfteci Ramiz Yemek", location: "Köfteci Ramiz" },
          ];
        } else {
          chips = [
            { label: "Merkez Kütüphane", title: "Merkez Kütüphane Çalışma Seansı", location: "Merkez Kütüphane" },
            { label: "Çalışma Salonu", title: "Çalışma Salonu Etüdü", location: "Çalışma Salonu" },
          ];
        }
      }
    } else if (modalType === "event") {
      chips = dbEvents.slice(0, 5).map((e) => ({
        label: e.title,
        title: e.title,
        location: e.location || "Kampüs",
        date: e.event_date ? new Date(e.event_date).toISOString().split("T")[0] : undefined,
      }));

      if (chips.length === 0) {
        chips = [
          { label: "Tanışma Toplantısı", title: "Kulüp Tanışma Toplantısı", location: "Kongre Merkezi" },
          { label: "Konser", title: "Bahar Şenliği Konseri", location: "Kampüs Stadyumu" },
        ];
      }
    } else if (modalType === "cinema") {
      chips = suggestedMovies.slice(0, 5).map((m) => ({
        label: m.title || m.name,
        title: `${m.title || m.name} Sinema İzleme`,
        location: "Sinema Salonu",
      }));

      if (chips.length === 0) {
        chips = [
          { label: "Interstellar", title: "Interstellar Sinema Gecesi", location: "Kadıköy Sinema Salonu" },
          { label: "Oppenheimer", title: "Oppenheimer IMAX Deneyimi", location: "Cinemaximum" },
          { label: "Dune", title: "Dune Film Keyfi", location: "Sinema" },
        ];
      }
    } else if (modalType === "sport") {
      chips = [
        { label: "Gym Antrenmanı", title: "Fitness Gym Antrenmanı", location: "Spor Salonu" },
        { label: "Koşu", title: "Açık Hava Koşusu", location: "Sahil Parkı" },
        { label: "Yüzme", title: "Yüzme Seansı", location: "Belediye Havuzu" },
        { label: "Halı Saha", title: "Halı Saha Maçı", location: "Halı Saha Tesisleri" },
      ];
    } else if (modalType === "social") {
      chips = [
        { label: "Tiyatro", title: "Tiyatro Oyunu İzleme", location: "Devlet Tiyatrosu" },
        { label: "Konser", title: "Canlı Müzik Konseri", location: "Performans Sahnesi" },
        { label: "Müze Gezisi", title: "Müze ve Sanat Galerisi Gezisi", location: "Arkeoloji Müzesi" },
      ];
    } else if (modalType === "outdoor") {
      chips = [
        { label: "Doğa Yürüyüşü", title: "Doğa Yürüyüşü (Hiking)", location: "Milli Park" },
        { label: "Kamp", title: "Hafta Sonu Kampı", location: "Kamp Alanı" },
        { label: "Bisiklet", title: "Bisiklet Turu", location: "Sahil Yolu" },
      ];
    }

    if (chips.length === 0) return null;

    return (
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">
          Önerilen Hızlı Seçimler
        </span>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
          {chips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setModalTitle(chip.title);
                if (chip.location) setModalLocation(chip.location);
                if (chip.date) setModalDate(chip.date);
                toast.success(`"${chip.label}" detayları uygulandı!`, { id: "quick-fill" });
              }}
              className="shrink-0 snap-start bg-app-tab-track/70 hover:bg-rose-500/10 border border-app-border hover:border-rose-500/30 text-app-text px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <Sparkle size={10} weight="fill" className="text-rose-500" />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-sans pb-16">
      <Toaster position="bottom-center" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-app-bg border-b border-app-border/60 shadow-sm backdrop-blur-md">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            {/* Back Button */}
            <button
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-text hover:text-rose-500 transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" className="text-rose-500" />
            </button>

            {/* Header Title */}
            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
              <BookmarkSimple size={18} weight="fill" className="text-rose-500 shrink-0" />
              <span className="truncate">
                DİARY <span className="text-rose-500">GÜNLÜK</span>
              </span>
            </h1>
          </div>

          {/* Segment Tabs */}
          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track mt-2.5">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "timeline"
                  ? "bg-app-tab-active text-rose-500 shadow-sm"
                  : "text-app-muted hover:text-app-text"
              }`}
            >
              Günlüğüm
            </button>
            <button
              onClick={() => setActiveTab("feed")}
              className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "feed"
                  ? "bg-app-tab-active text-rose-500 shadow-sm"
                  : "text-app-muted hover:text-app-text"
              }`}
            >
              Arkadaşlarım
            </button>
            <button
              onClick={() => setActiveTab("recap")}
              className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "recap"
                  ? "bg-app-tab-active text-rose-500 shadow-sm"
                  : "text-app-muted hover:text-app-text"
              }`}
            >
              Aylık Özetim
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-4 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-24">
            <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
            <p className="text-app-muted text-xs font-semibold mt-4 tracking-wider uppercase">Yükleniyor...</p>
          </div>
        ) : (
          <>
            {/* ==================== TIMELINE TAB ==================== */}
            {activeTab === "timeline" && (
              <div className="space-y-6">
                {/* Suggestions Section */}
                {suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-black uppercase tracking-widest text-rose-500 flex items-center gap-1">
                      <Sparkle size={14} weight="fill" /> Entegre Öneriler
                    </h2>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                      {suggestions.map((s) => {
                        const info = getCategoryInfo(s.activityType);
                        return (
                          <div
                            key={s.id}
                            className="shrink-0 w-64 bg-app-surface border border-app-border rounded-2xl p-3 flex flex-col justify-between snap-start shadow-sm"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${info.bgLight}`}>
                                  {info.emoji} {info.label}
                                </span>
                                <span className="text-[9px] text-app-muted font-bold uppercase">
                                  {s.source === "stamp_card" ? "Kaşe Alındı" : s.source === "campus_events" ? "Etkinlik" : "Ziyaret"}
                                </span>
                              </div>
                              <h3 className="font-extrabold text-sm text-app-text leading-tight truncate">{s.title}</h3>
                              <p className="text-xs text-app-muted flex items-center gap-1 mt-1">
                                <MapPin size={12} /> {s.location || "Belirtilmemiş"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleApplySuggestion(s)}
                              className="mt-3 w-full py-1.5 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Plus size={14} weight="bold" /> Günlüğe Ekle
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Timeline Groups */}
                {logs.length === 0 ? (
                  <div className="bg-app-surface border border-app-border rounded-3xl p-8 text-center shadow-sm">
                    <BookmarkSimple size={48} className="text-rose-500/20 mx-auto mb-3" />
                    <h3 className="font-extrabold text-base text-app-text mb-1">Günlüğün Bomboş</h3>
                    <p className="text-sm text-app-muted max-w-xs mx-auto leading-relaxed mb-5">
                      Sinema keyiflerini, kafe çalışmalarını veya spor aktivitelerini kaydedip ilk anını biriktir.
                    </p>
                    <button
                      onClick={() => { resetAddModal(); setIsAddModalOpen(true); }}
                      className="py-2.5 px-6 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
                    >
                      <Plus size={16} weight="bold" /> İlk Aktiviteni Kaydet
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {sortedGroupKeys.map((key) => {
                      const [year, month] = key.split("-").map(Number);
                      const monthLabel = MONTHS_TR[month - 1] + " " + year;
                      return (
                        <div key={key} className="space-y-3">
                          <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest pl-2">
                            {monthLabel}
                          </h3>
                          <div className="space-y-3">
                            {groupedLogs[key].map((log) => {
                              const info = getCategoryInfo(log.activityType);
                              const formattedDate = new Date(log.date).toLocaleDateString("tr-TR", {
                                day: "numeric",
                                month: "long",
                                weekday: "short"
                              });

                              return (
                                <div
                                  key={log.id}
                                  className="bg-app-surface border border-app-border rounded-2xl p-4 shadow-sm relative group"
                                >
                                  {/* Delete Trigger */}
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="absolute top-4 right-4 text-app-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                                  >
                                    <Trash size={16} />
                                  </button>

                                  <div className="flex gap-3">
                                    {/* Icon Circle */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xl font-bold bg-gradient-to-br ${info.color} text-white shadow-sm`}>
                                      {info.emoji}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pr-6">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-bold text-rose-500">{info.label}</span>
                                        <span className="text-[10px] text-app-muted">•</span>
                                        <span className="text-[10px] text-app-muted flex items-center gap-0.5">
                                          <Calendar size={11} /> {formattedDate}
                                        </span>
                                        {log.isPrivate ? (
                                          <span className="text-[10px] text-app-muted flex items-center gap-0.5 bg-app-tab-track px-1.5 py-0.5 rounded">
                                            <Lock size={10} /> Gizli
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-green-500 flex items-center gap-0.5 bg-green-500/10 px-1.5 py-0.5 rounded">
                                            <LockOpen size={10} /> Arkadaşlar
                                          </span>
                                        )}
                                      </div>

                                      <h4 className="font-extrabold text-sm text-app-text leading-tight mt-1 truncate">
                                        {log.title}
                                      </h4>

                                      {log.location && (
                                        <p className="text-xs text-app-muted flex items-center gap-0.5 mt-0.5">
                                          <MapPin size={12} /> {log.location}
                                        </p>
                                      )}

                                      {log.rating != null && log.rating > 0 && (
                                        <div className="flex items-center gap-0.5 mt-1.5">
                                          {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                              key={i}
                                              size={13}
                                              weight={i < (log.rating || 0) ? "fill" : "regular"}
                                              className={i < (log.rating || 0) ? "text-amber-500" : "text-app-muted/30"}
                                            />
                                          ))}
                                        </div>
                                      )}

                                      {log.notes && (
                                        <p className="text-xs text-app-muted mt-2 border-l-2 border-rose-500/30 pl-2 italic leading-relaxed">
                                          "{log.notes}"
                                        </p>
                                      )}

                                      {/* Reactions Display (Likes) */}
                                      {log.reactions && log.reactions.length > 0 && (
                                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                                          {["like", "clap", "fire"].map((type) => {
                                            const count = getReactionCount(log.reactions, type);
                                            if (count === 0) return null;
                                            const active = hasUserReacted(log.reactions, type);
                                            return (
                                              <div
                                                key={type}
                                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                                  active ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-app-tab-track text-app-muted"
                                                }`}
                                              >
                                                <span>{type === "like" ? "❤️" : type === "clap" ? "👏" : "🔥"}</span>
                                                <span>{count}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==================== FRIEND FEED TAB ==================== */}
            {activeTab === "feed" && (
              <div className="space-y-4">
                {feed.length === 0 ? (
                  <div className="bg-app-surface border border-app-border rounded-3xl p-8 text-center shadow-sm">
                    <HandsClapping size={48} className="text-rose-500/20 mx-auto mb-3" />
                    <h3 className="font-extrabold text-base text-app-text mb-1">Akış Henüz Boş</h3>
                    <p className="text-sm text-app-muted max-w-xs mx-auto leading-relaxed">
                      Arkadaşlarının yaptığı sinema, spor, çalışma aktivitelerini burada görebilir ve beğenebilirsin. Arkadaş eklemek için Profil sayfasına git!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feed.map((log) => {
                      const info = getCategoryInfo(log.activityType);
                      const formattedDate = new Date(log.date).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        weekday: "short"
                      });

                      return (
                        <div
                          key={log.id}
                          className="bg-app-surface border border-app-border rounded-2xl p-4 shadow-sm"
                        >
                          {/* User Header Info */}
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-app-border/40">
                            {log.avatarUrl ? (
                              <img
                                src={log.avatarUrl}
                                alt={log.username || "Friend"}
                                className="w-8 h-8 rounded-full border border-app-border shrink-0 object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 text-xs font-bold font-black">
                                {log.username ? log.username[0].toUpperCase() : "A"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-xs text-app-text leading-none">{log.username || "Anonim"}</h4>
                              <span className="text-[10px] text-app-muted">keşif paylaştı</span>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            {/* Icon Circle */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xl font-bold bg-gradient-to-br ${info.color} text-white shadow-sm`}>
                              {info.emoji}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-rose-500">{info.label}</span>
                                <span className="text-[10px] text-app-muted">•</span>
                                <span className="text-[10px] text-app-muted flex items-center gap-0.5">
                                  <Calendar size={11} /> {formattedDate}
                                </span>
                              </div>

                              <h4 className="font-extrabold text-sm text-app-text leading-tight mt-1 truncate">
                                {log.title}
                              </h4>

                              {log.location && (
                                <p className="text-xs text-app-muted flex items-center gap-0.5 mt-0.5">
                                  <MapPin size={12} /> {log.location}
                                </p>
                              )}

                              {log.rating != null && log.rating > 0 && (
                                <div className="flex items-center gap-0.5 mt-1.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      size={12}
                                      weight={i < (log.rating || 0) ? "fill" : "regular"}
                                      className={i < (log.rating || 0) ? "text-amber-500" : "text-app-muted/30"}
                                    />
                                  ))}
                                </div>
                              )}

                              {log.notes && (
                                <p className="text-xs text-app-muted mt-2 border-l-2 border-rose-500/30 pl-2 italic leading-relaxed">
                                  "{log.notes}"
                                </p>
                              )}

                              {/* Interactive Reactions */}
                              <div className="flex items-center gap-2 mt-4 pt-2 border-t border-app-border/40">
                                {[
                                  { type: "like", emoji: "❤️", label: "Beğen" },
                                  { type: "clap", emoji: "👏", label: "Tebrik" },
                                  { type: "fire", emoji: "🔥", label: "Harika" },
                                ].map((item) => {
                                  const count = getReactionCount(log.reactions, item.type);
                                  const active = hasUserReacted(log.reactions, item.type);
                                  return (
                                    <button
                                      key={item.type}
                                      onClick={() => handleReactLog(log.id, item.type)}
                                      className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 hover:bg-app-tab-track active:scale-95 border border-transparent cursor-pointer ${
                                        active
                                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                          : "bg-app-tab-track/50 text-app-muted hover:text-app-text"
                                      }`}
                                    >
                                      <span>{item.emoji}</span>
                                      <span>{count > 0 ? count : item.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==================== RECAP TAB ==================== */}
            {activeTab === "recap" && summary && (
              <div className="space-y-6">
                {/* Month/Year Filter Selection */}
                <div className="bg-app-surface border border-app-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (selectedMonth === 1) {
                          setSelectedMonth(12);
                          setSelectedYear(selectedYear - 1);
                        } else {
                          setSelectedMonth(selectedMonth - 1);
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center text-app-muted hover:text-rose-500 border border-app-border bg-app-tab-track/50 rounded-lg active:scale-90 cursor-pointer"
                    >
                      <CaretLeft size={14} weight="bold" />
                    </button>
                    <span className="font-extrabold text-sm text-app-text min-w-[100px] text-center">
                      {currentMonthName}
                    </span>
                    <button
                      onClick={() => {
                        if (selectedMonth === 12) {
                          setSelectedMonth(1);
                          setSelectedYear(selectedYear + 1);
                        } else {
                          setSelectedMonth(selectedMonth + 1);
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center text-app-muted hover:text-rose-500 border border-app-border bg-app-tab-track/50 rounded-lg active:scale-90 cursor-pointer"
                    >
                      <CaretRight size={14} weight="bold" />
                    </button>
                  </div>

                  <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {summary.totalCount} Aktivite
                  </span>
                </div>

                {/* Dashboard Stats */}
                {summary.totalCount === 0 ? (
                  <div className="bg-app-surface border border-app-border rounded-3xl p-8 text-center shadow-sm">
                    <Calendar size={48} className="text-rose-500/20 mx-auto mb-3" />
                    <h3 className="font-extrabold text-base text-app-text mb-1">Özet Bulunmuyor</h3>
                    <p className="text-sm text-app-muted max-w-xs mx-auto leading-relaxed">
                      Seçtiğin ayda kaydedilmiş hiçbir aktivite yok. Önce günlüğüne o aydan birkaç kayıt eklemelisin.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Badge Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-rose-950 border border-rose-500/30 rounded-3xl p-6 text-white text-center shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/40"></div>
                      <div className="relative z-10 space-y-2">
                        <span className="text-[9px] font-black text-rose-400 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-full uppercase tracking-widest">
                          Aylık Derece
                        </span>
                        <div className="text-6xl pt-3 pb-1">{summary.badgeEmoji}</div>
                        <h3 className="text-2xl font-black tracking-tight">{summary.badge}</h3>
                        <p className="text-xs text-rose-200/70 max-w-xs mx-auto leading-relaxed">
                          Bu ay şehirde ve hayatta tam {summary.totalCount} macera/aktivite logladın!
                        </p>
                      </div>
                    </div>

                    {/* Start Wrapped Interactive Slide Deck Button */}
                    <button
                      onClick={() => {
                        setWrappedSlide(0);
                        setIsWrappedOpen(true);
                      }}
                      className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
                    >
                      <Sparkle size={18} weight="fill" className="animate-pulse" /> Özeti Başlat (Wrapped)
                    </button>

                    {/* Top Categories Card */}
                    <div className="bg-app-surface border border-app-border rounded-3xl p-5 shadow-sm space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-rose-500">En Çok Tercih Edilenler</h3>
                      <div className="space-y-3">
                        {summary.categoryCounts.map((item, idx) => {
                          const info = getCategoryInfo(item.category);
                          const percentage = Math.max(10, Math.min(100, (item.count / summary.totalCount) * 100));
                          return (
                            <div key={item.category} className="space-y-1">
                              <div className="flex justify-between items-center text-xs font-bold">
                                <span className="flex items-center gap-1">
                                  <span className="text-app-muted">{idx + 1}.</span> {info.emoji} {info.label}
                                </span>
                                <span className="text-rose-500">{item.count} Keşif</span>
                              </div>
                              <div className="w-full h-2 bg-app-tab-track rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-rose-500 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Polaroid Highlight memory */}
                    {summary.highlightLog && (
                      <div className="bg-app-surface border border-app-border rounded-3xl p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-rose-500">Ayın Unutulmazı</h3>
                        <div className="bg-white text-slate-800 p-4 pb-8 rounded-xl shadow-md border border-slate-100 flex flex-col items-center max-w-[280px] mx-auto rotate-1 hover:rotate-0 transition-transform duration-300">
                          {summary.highlightLog.imageUrl ? (
                            <img
                              src={summary.highlightLog.imageUrl}
                              alt="Highlight"
                              className="w-full aspect-square object-cover rounded shadow-inner"
                            />
                          ) : (
                            <div className="w-full aspect-square rounded bg-slate-100 flex items-center justify-center text-5xl">
                              {getCategoryInfo(summary.highlightLog.activityType).emoji}
                            </div>
                          )}
                          <div className="w-full text-center mt-4">
                            <h4 className="font-extrabold text-sm leading-tight text-slate-900 truncate">
                              {summary.highlightLog.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{summary.highlightLog.location}</p>
                            {summary.highlightLog.rating && (
                              <div className="flex justify-center gap-0.5 mt-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    size={12}
                                    weight={i < (summary.highlightLog!.rating || 0) ? "fill" : "regular"}
                                    className="text-amber-500"
                                  />
                                ))}
                              </div>
                            )}
                            {summary.highlightLog.notes && (
                              <p className="text-[10px] text-slate-500 italic mt-3 line-clamp-2 px-1">
                                "{summary.highlightLog.notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Quick share actions */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => handleCopyTextSummary(summary, currentMonthName)}
                        className="py-3 bg-app-surface border border-app-border hover:bg-app-tab-track text-app-text rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Copy size={16} /> Panoya Kopyala
                      </button>
                      <button
                        onClick={() => handleDownloadCard(summary, currentMonthName)}
                        className="py-3 bg-app-surface border border-app-border hover:bg-app-tab-track text-app-text rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Download size={16} /> Resmi İndir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Timeline FAB */}
      {activeTab === "timeline" && !loading && user && (
        <button
          onClick={() => { resetAddModal(); setIsAddModalOpen(true); }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-rose-500 hover:bg-rose-600 active:scale-90 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-rose-500/20 transition-all cursor-pointer z-40 border-4 border-app-bg"
        >
          <Plus size={24} weight="bold" />
        </button>
      )}

      {/* ==================== ADD ACTIVITY MODAL ==================== */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-4">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-app-surface border border-app-border rounded-t-3xl md:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 shadow-2xl flex flex-col pb-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-app-border mb-4">
                <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Plus size={16} weight="bold" className="text-rose-500" />
                  {modalIsImported ? "Anıyı Ekle" : "Yeni Keşif Ekle"}
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-7 h-7 flex items-center justify-center text-app-muted hover:text-app-text border border-app-border rounded-lg bg-app-tab-track/50 active:scale-90 cursor-pointer"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddLogSubmit} className="space-y-4">

                {/* Grid for Category, Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-rose-500">Kategori</label>
                    <select
                      value={modalType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModalType(val);
                        const defaults: Record<string, string> = {
                          cafe: "Kafe Keyfi",
                          restaurant: "Yemek",
                          cinema: "Sinema",
                          sport: "Spor",
                          study: "Çalışma",
                          social: "Sosyal",
                          outdoor: "Aktivite",
                          event: "Etkinlik",
                          custom: "Yeni Keşif",
                        };
                        setModalTitle(defaults[val] || "Yeni Keşif");
                      }}
                      className="w-full bg-app-tab-track border border-app-border rounded-2xl px-3 py-3 text-xs font-bold text-app-text focus:outline-none focus:border-rose-500"
                    >
                      <option value="cafe">☕ Kafe</option>
                      <option value="restaurant">🍔 Yemek</option>
                      <option value="cinema">🍿 Sinema</option>
                      <option value="sport">🏃‍♂️ Spor</option>
                      <option value="study">📚 Çalışma</option>
                      <option value="social">🎭 Sosyal</option>
                      <option value="outdoor">🛶 Aktivite</option>
                      <option value="event">🎫 Etkinlik</option>
                      <option value="custom">✨ Diğer</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-rose-500">Tarih</label>
                    <input
                      type="date"
                      required
                      value={modalDate}
                      onChange={(e) => setModalDate(e.target.value)}
                      className="w-full bg-app-tab-track border border-app-border rounded-2xl px-3 py-2.5 text-xs text-app-text focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Real Data Quick Suggestions Chips */}
                {renderQuickSuggestions()}

                {/* Location */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-rose-500">Konum / Mekan</label>
                  <input
                    type="text"
                    placeholder="Örn: Kadıköy Sinema Salonu, Caddebostan Parkı"
                    value={modalLocation}
                    onChange={(e) => setModalLocation(e.target.value)}
                    className="w-full bg-app-tab-track border border-app-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 transition-colors"
                  />
                </div>



                {/* Privacy Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-app-tab-track/50 border border-app-border">
                  <div className="flex items-center gap-2">
                    {modalIsPrivate ? (
                      <EyeSlash size={18} className="text-app-muted" />
                    ) : (
                      <Eye size={18} className="text-green-500" />
                    )}
                    <div>
                      <h4 className="text-xs font-black uppercase leading-none">Arkadaşlarla Paylaş</h4>
                      <p className="text-[10px] text-app-muted mt-0.5">
                        {modalIsPrivate ? "Sadece ben görebilirim" : "Arkadaşlarımın akışında görünür"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalIsPrivate(!modalIsPrivate)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                      modalIsPrivate ? "bg-app-tab-track border border-app-border" : "bg-rose-500"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        modalIsPrivate ? "translate-x-0" : "translate-x-5"
                      }`}
                    ></div>
                  </button>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-md"
                >
                  GÜNLÜĞE KAYDET
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== PLAY MONTHLY WRAPPED FULLSCREEN MODAL ==================== */}
      <AnimatePresence>
        {isWrappedOpen && summary && (
          <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 overflow-hidden">
            {/* Top progress indicator bar */}
            <div className="flex gap-1.5 w-full pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
                >
                  {i < wrappedSlide && <div className="h-full bg-rose-500 w-full"></div>}
                  {i === wrappedSlide && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 5, ease: "linear" }}
                      onAnimationComplete={() => {
                        if (wrappedSlide < 4) {
                          setWrappedSlide(wrappedSlide + 1);
                        } else {
                          setIsWrappedOpen(false);
                        }
                      }}
                      className="h-full bg-rose-500"
                    ></motion.div>
                  )}
                </div>
              ))}
            </div>

            {/* Slide Close & Header info */}
            <div className="flex justify-between items-center text-white/50 text-xs mt-3">
              <span className="font-extrabold uppercase tracking-widest text-[10px] text-rose-500">
                Diary Wrapped
              </span>
              <button
                onClick={() => setIsWrappedOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white cursor-pointer active:scale-90"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Slide Content Area */}
            <div className="flex-1 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {wrappedSlide === 0 && (
                  <motion.div
                    key="slide0"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="text-center space-y-6 max-w-xs text-white"
                  >
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 4 }}
                      className="text-7xl"
                    >
                      🏆
                    </motion.div>
                    <h2 className="text-3xl font-black tracking-tight leading-none uppercase">
                      {currentMonthName} <br />
                      <span className="text-rose-500">Özetine</span> Hoş Geldin!
                    </h2>
                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                      Bu ay tamamladığın aktiviteler, kazandığın rozetler ve en keyifli anıların burada seni bekliyor.
                    </p>
                  </motion.div>
                )}

                {wrappedSlide === 1 && (
                  <motion.div
                    key="slide1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center space-y-4 max-w-sm text-white"
                  >
                    <div className="text-[10px] font-black uppercase text-rose-500 tracking-widest bg-rose-500/20 px-4 py-1.5 rounded-full inline-block">
                      Kaşif Derecesi
                    </div>
                    <div className="text-7xl pt-4 animate-bounce">{summary.badgeEmoji}</div>
                    <h2 className="text-4xl font-[1000] tracking-tight leading-none uppercase">
                      {summary.badge}
                    </h2>
                    <p className="text-sm text-white/60 leading-relaxed font-medium px-4">
                      Bu ay toplam <span className="text-rose-400 font-extrabold">{summary.totalCount} aktivite</span> kaydederek bu özel unvanı hak ettin!
                    </p>
                  </motion.div>
                )}

                {wrappedSlide === 2 && (
                  <motion.div
                    key="slide2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full max-w-xs space-y-4 text-white"
                  >
                    <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 text-center">En Çok Hırpaladığın Rotalar</h3>
                    <div className="space-y-4 pt-4">
                      {summary.categoryCounts.slice(0, 3).map((item, idx) => {
                        const info = getCategoryInfo(item.category);
                        return (
                          <motion.div
                            key={item.category}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.2 }}
                            className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl"
                          >
                            <span className="text-sm font-black text-rose-500">{idx + 1}.</span>
                            <div className="text-2xl">{info.emoji}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold text-sm text-white leading-none">{info.label}</h4>
                            </div>
                            <span className="font-black text-sm text-rose-400">{item.count} Keşif</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {wrappedSlide === 3 && (
                  <motion.div
                    key="slide3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="text-center space-y-4 text-white"
                  >
                    <h3 className="text-xs font-black uppercase tracking-widest text-rose-500">Ayın Yıldızı</h3>
                    {summary.highlightLog ? (
                      <div className="bg-white text-slate-800 p-4 pb-8 rounded-xl shadow-2xl border border-slate-100 flex flex-col items-center w-[250px] mx-auto rotate-[-2deg]">
                        {summary.highlightLog.imageUrl ? (
                          <img
                            src={summary.highlightLog.imageUrl}
                            alt="Highlight"
                            className="w-full aspect-square object-cover rounded shadow-inner"
                          />
                        ) : (
                          <div className="w-full aspect-square rounded bg-slate-100 flex items-center justify-center text-5xl">
                            {getCategoryInfo(summary.highlightLog.activityType).emoji}
                          </div>
                        )}
                        <div className="w-full text-center mt-3">
                          <h4 className="font-extrabold text-sm leading-tight text-slate-900 truncate">
                            {summary.highlightLog.title}
                          </h4>
                          <p className="text-[9px] text-slate-400 mt-0.5">{summary.highlightLog.location}</p>
                          {summary.highlightLog.rating && (
                            <div className="flex justify-center gap-0.5 mt-1.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={11}
                                  weight={i < (summary.highlightLog!.rating || 0) ? "fill" : "regular"}
                                  className="text-amber-500"
                                />
                              ))}
                            </div>
                          )}
                          {summary.highlightLog.notes && (
                            <p className="text-[10px] text-slate-500 italic mt-3 line-clamp-2 px-1">
                              "{summary.highlightLog.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-white/50">Ayın yıldızı bulunamadı.</p>
                    )}
                  </motion.div>
                )}

                {wrappedSlide === 4 && (
                  <motion.div
                    key="slide4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-5 max-w-xs text-white"
                  >
                    <h3 className="text-xs font-black uppercase tracking-widest text-rose-500">Maceranı Paylaş</h3>
                    
                    {/* Tiny visual card preview */}
                    <div className="bg-gradient-to-br from-indigo-950 to-rose-950 border border-white/10 p-5 rounded-2xl text-left space-y-3 shadow-xl">
                      <div className="flex justify-between items-center text-[10px] font-black text-rose-400">
                        <span>DIARY WRAPPED</span>
                        <span>{currentMonthName.toUpperCase()}</span>
                      </div>
                      <div className="text-center py-2">
                        <div className="text-5xl">{summary.badgeEmoji}</div>
                        <h4 className="font-black text-lg mt-1">{summary.badge}</h4>
                      </div>
                      <div className="border-t border-white/10 pt-2 flex justify-between text-xs font-bold text-white/80">
                        <span>Toplam Aktivite:</span>
                        <span className="text-rose-400">{summary.totalCount}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={() => handleCopyTextSummary(summary, currentMonthName)}
                        className="py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border border-white/10"
                      >
                        <Copy size={16} /> Panoya Kopyala
                      </button>
                      <button
                        onClick={() => handleDownloadCard(summary, currentMonthName)}
                        className="py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <Download size={16} /> Resmi İndir
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Navigation controls */}
            <div className="flex justify-between items-center gap-4 text-white/50 mt-4 pb-4">
              <button
                disabled={wrappedSlide === 0}
                onClick={() => setWrappedSlide(wrappedSlide - 1)}
                className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider border border-white/10 active:scale-95 cursor-pointer ${
                  wrappedSlide === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5"
                }`}
              >
                Geri
              </button>

              <button
                onClick={() => {
                  if (wrappedSlide < 4) {
                    setWrappedSlide(wrappedSlide + 1);
                  } else {
                    setIsWrappedOpen(false);
                  }
                }}
                className="py-2 px-4 bg-white/10 hover:bg-white/20 active:scale-95 cursor-pointer rounded-xl text-[10px] font-black uppercase tracking-wider text-white border border-white/10"
              >
                {wrappedSlide === 4 ? "Kapat" : "İleri"}
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
