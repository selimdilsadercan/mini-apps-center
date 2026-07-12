"use client";

import { getAppRootUrl, getAppHref, MINI_APPS } from "@/lib/apps";
import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  CaretLeft,
  Plus,
  Trash,
  X,
  MagnifyingGlass,
  CalendarBlank,
  ListBullets,
  PencilSimple,
  CaretDown,
  Check,
  Sun,
  SunHorizon,
  Moon,
  CalendarCheck,
} from "@phosphor-icons/react";
import { Drawer } from "vaul";
import { Toaster, toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { rutinler } from "@/lib/client";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import ROUTINE_CATALOG from "./routine_catalog.json";
import { EmojiPickerOverlay } from "./EmojiPickerOverlay";

type PeriodType = "daily" | "weekly" | "monthly" | "once";
type DrawerTab = "catalog" | "custom";
type MainTab = "today" | "manage";
type CatalogItem = {
  slug: string;
  name: string;
  emoji: string;
  category: string;
  keywords?: string[];
};

const client = createBrowserClient();

const BOARDS: { key: PeriodType; label: string }[] = [
  { key: "once", label: "Tek Seferlik" },
  { key: "daily", label: "Günlük" },
  { key: "weekly", label: "Haftalık" },
  { key: "monthly", label: "Aylık" },
];

const DAILY_SLOT_ORDER: Record<rutinler.DailySlot, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
};

const EV_ISLERI_APP = MINI_APPS.find((app) => app.id === "ev-isleri");

function pillTabClass(active: boolean) {
  return `inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] ${
    active
      ? "bg-white text-gray-900 shadow-sm"
      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
  }`;
}

function CalendarMiniBadge({
  value,
  headerClassName,
}: {
  value: string | number;
  headerClassName: string;
}) {
  return (
    <div className="relative h-8 w-7 shrink-0">
      <div className="absolute top-0 left-1/2 z-10 flex -translate-x-1/2 gap-1">
        <span className="h-1 w-1 rounded-full border border-gray-300 bg-gray-50" />
        <span className="h-1 w-1 rounded-full border border-gray-300 bg-gray-50" />
      </div>
      <div className="absolute inset-x-0 top-0.5 bottom-0 flex flex-col overflow-hidden rounded-[3px] border border-gray-200 bg-white shadow-sm">
        <div className={`h-2 shrink-0 ${headerClassName}`} />
        <div className="flex flex-1 items-center justify-center">
          <span className="text-[8px] font-black leading-none text-gray-800 tabular-nums">
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RutinlerPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { confirm } = useConfirmDialog();
  const [entries, setEntries] = useState<rutinler.RoutineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>("today");
  const [quickTask, setQuickTask] = useState("");
  const [activePeriod, setActivePeriod] = useState<PeriodType | null>(null);
  const [recentlyCompletedIds, setRecentlyCompletedIds] = useState<Set<string>>(new Set());
  const [showCatalog, setShowCatalog] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("catalog");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [customEmoji, setCustomEmoji] = useState("✨");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingEntry, setEditingEntry] = useState<rutinler.RoutineEntry | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("✨");
  const [updating, setUpdating] = useState(false);
  const [selectedDailySlot, setSelectedDailySlot] = useState<rutinler.DailySlot>("morning");
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(new Date().getDay() || 7);
  const [selectedMonthDay, setSelectedMonthDay] = useState<number>(1);
  const [expandedBoards, setExpandedBoards] = useState<Record<PeriodType, boolean>>({
    once: false,
    daily: false,
    weekly: false,
    monthly: false,
  });

  const [hasSetInitialExpanded, setHasSetInitialExpanded] = useState(false);

  useEffect(() => {
    if (isUserLoaded) {
      void fetchEntries();
    }
  }, [isUserLoaded, user]);

  useEffect(() => {
    if (!loading && !hasSetInitialExpanded && entries.length >= 0) {
      const newExpanded = { ...expandedBoards };
      BOARDS.forEach((board) => {
        const hasItems = entries.some((e) => e.period_type === board.key);
        newExpanded[board.key] = hasItems;
      });
      setExpandedBoards(newExpanded);
      setHasSetInitialExpanded(true);
    }
  }, [loading, entries, hasSetInitialExpanded]);

  async function fetchEntries() {
    try {
      setLoading(true);
      if (!user) {
        setEntries([]);
        return;
      }
      const res = await client.rutinler.getEntries(user.id);
      setEntries(res.entries ?? []);
    } catch (error) {
      console.error("fetchEntries error:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCatalog = useMemo(() => {
    const q = catalogQuery.trim().toLocaleLowerCase("tr-TR");
    if (!q) return ROUTINE_CATALOG;

    return ROUTINE_CATALOG.map((group) => ({
      category: group.category,
      items: group.items.filter(
        (item) =>
          item.name.toLocaleLowerCase("tr-TR").includes(q) ||
          group.category.toLocaleLowerCase("tr-TR").includes(q) ||
          item.keywords?.some((k) => k.toLocaleLowerCase("tr-TR").includes(q))
      ),
    })).filter((group) => group.items.length > 0);
  }, [catalogQuery]);

  function openCatalog(period: PeriodType) {
    setActivePeriod(period);
    setCatalogQuery("");
    setDrawerTab(period === "once" ? "custom" : "catalog");
    setShowCatalog(true);
  }

  function closeCatalog() {
    setShowCatalog(false);
    setActivePeriod(null);
    setCatalogQuery("");
    setDrawerTab("catalog");
    setCustomName("");
    setCustomEmoji("✨");
    setShowEmojiPicker(false);
    // Reset selections to defaults
    setSelectedDailySlot("morning");
    setSelectedDayOfWeek(new Date().getDay() || 7);
    setSelectedMonthDay(1);
  }

  function openEdit(entry: rutinler.RoutineEntry) {
    // Close catalog first so two Vaul drawers don't fight
    setShowCatalog(false);
    setActivePeriod(null);
    setShowEmojiPicker(false);
    setEditName(entry.item_name);
    setEditEmoji(entry.item_emoji || "✨");
    setSelectedDailySlot(entry.daily_slot || "morning");
    setSelectedDayOfWeek(entry.day_of_week || 1);
    setSelectedMonthDay(entry.day_of_month || 1);
    // Defer open so the same click doesn't immediately dismiss the drawer
    requestAnimationFrame(() => {
      setEditingEntry(entry);
    });
  }

  function closeEdit() {
    setEditingEntry(null);
    setShowEmojiPicker(false);
  }

  function handleTabChange(tab: DrawerTab) {
    setDrawerTab(tab);
    setShowEmojiPicker(false);
  }

  const renderScheduleSelection = (isEdit = false) => {
    const period = isEdit ? editingEntry?.period_type : activePeriod;
    if (!period) return null;

    if (period === "daily") {
      const slots: { key: rutinler.DailySlot; label: string; icon: any }[] = [
        { key: "morning", label: "Sabah", icon: SunHorizon },
        { key: "afternoon", label: "Öğle", icon: Sun },
        { key: "evening", label: "Akşam", icon: Moon },
      ];

      return (
        <div className="flex gap-2 mb-4">
          {slots.map((slot) => {
            const Icon = slot.icon;
            const active = selectedDailySlot === slot.key;
            return (
              <button
                key={slot.key}
                onClick={() => setSelectedDailySlot(slot.key)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all ${
                  active
                    ? "bg-violet-50 border-violet-200 text-violet-600"
                    : "bg-gray-50 border-gray-100 text-gray-400"
                }`}
              >
                <Icon size={20} weight={active ? "fill" : "bold"} />
                <span className="text-[10px] font-black uppercase tracking-wider">{slot.label}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (period === "weekly") {
      const days = [
        { key: 1, label: "Pzt" },
        { key: 2, label: "Sal" },
        { key: 3, label: "Çar" },
        { key: 4, label: "Per" },
        { key: 5, label: "Cum" },
        { key: 6, label: "Cmt" },
        { key: 7, label: "Paz" },
      ];

      return (
        <div className="flex overflow-x-auto gap-1.5 mb-4 pb-1 scrollbar-hide">
          {days.map((day) => {
            const active = selectedDayOfWeek === day.key;
            return (
              <button
                key={day.key}
                onClick={() => setSelectedDayOfWeek(day.key)}
                className={`shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border text-[10px] font-black uppercase transition-all ${
                  active
                    ? "bg-violet-50 border-violet-200 text-violet-600"
                    : "bg-gray-50 border-gray-100 text-gray-400"
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      );
    }

    if (period === "monthly") {
      return (
        <div className="flex items-center gap-3 mb-4 bg-gray-50 border border-gray-100 p-3 rounded-2xl">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
            Ayın Günü:
          </span>
          <div className="flex-1 flex overflow-x-auto gap-1.5 scrollbar-hide">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
              const active = selectedMonthDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedMonthDay(day)}
                  className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border text-[11px] font-black transition-all ${
                    active
                      ? "bg-violet-500 border-violet-500 text-white"
                      : "bg-white border-gray-200 text-gray-400 hover:border-violet-200"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  function entriesForPeriod(period: PeriodType) {
    return entries.filter((e) => e.period_type === period);
  }

  function entriesForToday(period: PeriodType) {
    const now = new Date();
    const todayDayOfWeek = now.getDay() || 7;
    const todayMonthDay = now.getDate();
    const currentSlot = getCurrentDailySlot();

    return entries.filter((e) => {
      if (e.period_type !== period) return false;
      // Tamamlanan rutinler bu dönem için Bugün'de görünmez
      // Ancak yeni tamamlandıysa animasyon için kısa süre tutuyoruz
      if (e.is_completed && !recentlyCompletedIds.has(e.id)) return false;

      if (period === "daily") {
        if (!e.daily_slot) return true;
        // Slot geçtiyse ve hâlâ yapılmadıysa göster
        return DAILY_SLOT_ORDER[e.daily_slot] <= DAILY_SLOT_ORDER[currentSlot];
      }

      if (period === "weekly") {
        if (!e.day_of_week) return true;
        // Haftanın planlanan günü geçtiyse ve bu hafta tamamlanmadıysa göster
        return todayDayOfWeek >= e.day_of_week;
      }

      if (period === "monthly") {
        if (!e.day_of_month) return true;
        // Ayın planlanan günü geçtiyse ve bu ay tamamlanmadıysa göster
        return todayMonthDay >= e.day_of_month;
      }

      return true;
    });
  }

  function getCurrentDailySlot(): rutinler.DailySlot {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    return "evening";
  }

  function isNameTaken(name: string, period: PeriodType) {
    return false; // Hiçbir kısıtlama olmasın
  }

  function isAlreadyAdded(item: CatalogItem, period: PeriodType) {
    return false; // Aynı şey birden fazla kez eklenebilsin
  }

  async function handleAddEntry(name: string, emoji: string, slug?: string) {
    if (!user || !activePeriod || adding) return;
    setAdding(true);
    try {
      const res = await client.rutinler.addEntry({
        userId: user.id,
        periodType: activePeriod,
        itemName: name,
        itemEmoji: emoji,
        ...(slug ? { itemSlug: slug } : {}),
        ...(activePeriod === "daily" ? { dailySlot: selectedDailySlot } : {}),
        dayOfWeek: activePeriod === "weekly" ? String(selectedDayOfWeek) : "0",
        dayOfMonth: activePeriod === "monthly" ? String(selectedMonthDay) : "0",
      });
      if (res.entry) {
        setEntries((prev) => [...prev, { ...res.entry!, is_completed: false }]);
        // Expand the board when a new entry is added
        setExpandedBoards((prev) => ({
          ...prev,
          [activePeriod]: true,
        }));
      }
      closeCatalog();
    } catch (error) {
      console.error("handleAddEntry error:", error);
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdateEntry() {
    if (!user || !editingEntry || updating) return;
    const name = editName.trim();
    if (!name) return;

    setUpdating(true);
    try {
      const res = await client.rutinler.updateEntry({
        entryId: editingEntry.id,
        userId: user.id,
        itemName: name,
        itemEmoji: editEmoji,
        ...(editingEntry.period_type === "daily" ? { dailySlot: selectedDailySlot } : {}),
        dayOfWeek: editingEntry.period_type === "weekly" ? String(selectedDayOfWeek) : "0",
        dayOfMonth: editingEntry.period_type === "monthly" ? String(selectedMonthDay) : "0",
      });

      if (res.entry) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === editingEntry.id ? { ...res.entry!, is_completed: e.is_completed } : e
          )
        );
      }
      closeEdit();
    } catch (error) {
      console.error("handleUpdateEntry error:", error);
    } finally {
      setUpdating(false);
    }
  }

  async function handleToggleComplete(entry: rutinler.RoutineEntry) {
    if (!user) return;
    const newStatus = !entry.is_completed;

    if (newStatus) {
      setRecentlyCompletedIds((prev) => {
        const next = new Set(prev);
        next.add(entry.id);
        return next;
      });
      // 800ms sonra listeden tamamen çıkart
      setTimeout(() => {
        setRecentlyCompletedIds((prev) => {
          const next = new Set(prev);
          next.delete(entry.id);
          return next;
        });
      }, 800);
    }

    // Optimistic update
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, is_completed: newStatus } : e))
    );

    try {
      await client.rutinler.toggleCompletion({
        entryId: entry.id,
        userId: user.id,
        completed: newStatus,
      });
    } catch (error) {
      console.error("handleToggleComplete error:", error);
      // Rollback
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, is_completed: !newStatus } : e))
      );
    }
  }

  async function handleAdd(item: CatalogItem) {
    await handleAddEntry(item.name, item.emoji, item.slug);
  }

  async function handleAddCustom() {
    const name = customName.trim();
    if (!name || !activePeriod) return;
    if (isNameTaken(name, activePeriod)) return;
    const emoji = customEmoji.trim() || "✨";
    await handleAddEntry(name, emoji);
  }

  async function handleDelete(entry: rutinler.RoutineEntry) {
    if (!user) return;
    const ok = await confirm({
      title: "Rutin silinsin mi?",
      description: `"${entry.item_emoji} ${entry.item_name}" kaldırılacak.`,
      confirmText: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await client.rutinler.deleteEntry(entry.id, { userId: user.id });
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch (error) {
      console.error("handleDelete error:", error);
    }
  }

  function renderScheduleBadges(entry: rutinler.RoutineEntry) {
    return (
      <div className="shrink-0 flex items-center gap-1.5">
        {entry.daily_slot && (
          <div className="flex h-8 w-7 shrink-0 flex-col items-center justify-center rounded-[3px] border border-gray-200 bg-white shadow-sm">
            {entry.daily_slot === "morning" ? (
              <SunHorizon size={12} weight="bold" className="text-amber-500" />
            ) : entry.daily_slot === "afternoon" ? (
              <Sun size={12} weight="bold" className="text-orange-500" />
            ) : (
              <Moon size={12} weight="bold" className="text-indigo-500" />
            )}
            <span className="mt-0.5 text-[6px] font-black uppercase tracking-tighter text-gray-500 leading-none">
              {entry.daily_slot === "morning"
                ? "Sbh"
                : entry.daily_slot === "afternoon"
                ? "Öğl"
                : "Akş"}
            </span>
          </div>
        )}
        {entry.day_of_week && (
          <CalendarMiniBadge
            value={["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][entry.day_of_week - 1]}
            headerClassName="bg-violet-500"
          />
        )}
        {entry.day_of_month && (
          <CalendarMiniBadge value={entry.day_of_month} headerClassName="bg-emerald-500" />
        )}
      </div>
    );
  }

  function renderEntryRow(entry: rutinler.RoutineEntry, showComplete: boolean, isGrouped = false) {
    return (
      <motion.div
        key={entry.id}
        initial={false}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20, height: 0, marginTop: 0, marginBottom: 0, overflow: "hidden" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`group flex items-center gap-3 px-4 py-3 transition-all ${
          !isGrouped ? "rounded-2xl border" : ""
        } ${
          showComplete && entry.is_completed
            ? isGrouped ? "bg-emerald-50/20" : "bg-emerald-50/40 border-emerald-100"
            : !isGrouped ? "bg-gray-50 border-gray-100" : "hover:bg-gray-50/50"
        } ${isGrouped ? "border-b border-gray-50 last:border-0" : ""}`}
      >
        {showComplete && (
          <button
            type="button"
            onClick={() => void handleToggleComplete(entry)}
            className={`shrink-0 w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center relative overflow-hidden ${
              entry.is_completed
                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200"
                : "bg-white border-gray-200 text-transparent"
            }`}
          >
            <AnimatePresence mode="wait">
              {entry.is_completed && (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                >
                  <Check size={14} weight="bold" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        )}

        <div
          onClick={(e) => {
            e.stopPropagation();
            openEdit(entry);
          }}
          className="flex-1 flex items-center justify-between gap-3 min-w-0 cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0 relative">
            <span className="text-xl leading-none shrink-0">{entry.item_emoji}</span>
            <div className="relative min-w-0">
              <span
                className={`text-sm font-bold block truncate transition-colors duration-300 ${
                  showComplete && entry.is_completed ? "text-gray-400" : "text-gray-800"
                }`}
              >
                {entry.item_name}
              </span>
              {showComplete && (
                <motion.div
                  initial={false}
                  animate={{ scaleX: entry.is_completed ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-gray-400 origin-left w-full"
                />
              )}
            </div>
          </div>
          {renderScheduleBadges(entry)}
        </div>
      </motion.div>
    );
  }

  async function handleAddQuickTask(e: React.FormEvent) {
    e.preventDefault();
    const name = quickTask.trim();
    if (!name || !user || adding) return;

    setAdding(true);
    try {
      const res = await client.rutinler.addEntry({
        userId: user.id,
        periodType: "once",
        itemName: name,
        itemEmoji: "📌",
        dayOfWeek: "0",
        dayOfMonth: "0",
      });
      if (res.entry) {
        setEntries((prev) => [...prev, { ...res.entry!, is_completed: false }]);
        setQuickTask("");
        toast.success("Görev eklendi");
      }
    } catch (error) {
      console.error("handleAddQuickTask error:", error);
      toast.error("Görev eklenemedi");
    } finally {
      setAdding(false);
    }
  }

  const { todayEntries, oneOffTasks, routineTasks } = useMemo(() => {
    const allToday = BOARDS.flatMap((board) => entriesForToday(board.key));
    const oneOff = allToday.filter((e) => e.period_type === "once");
    const routines = allToday.filter((e) => e.period_type !== "once");
    return { todayEntries: allToday, oneOffTasks: oneOff, routineTasks: routines };
  }, [entries, recentlyCompletedIds]);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-violet-500" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
              <CalendarBlank size={18} weight="fill" className="text-violet-500 shrink-0" />
              <span className="truncate text-violet-500">Ajanda</span>
            </h1>
          </div>

          <div className="flex mt-2">
            <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100">
              <button
                type="button"
                onClick={() => setMainTab("today")}
                className={pillTabClass(mainTab === "today")}
              >
                <CalendarCheck size={14} weight={mainTab === "today" ? "fill" : "duotone"} />
                <span>Bugün</span>
              </button>
              <button
                type="button"
                onClick={() => setMainTab("manage")}
                className={pillTabClass(mainTab === "manage")}
              >
                <ListBullets size={14} weight={mainTab === "manage" ? "fill" : "duotone"} />
                <span>Rutinlerim</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            Yükleniyor...
          </div>
        ) : !user ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/50 flex flex-col items-center justify-center p-6 shadow-sm">
            <CalendarBlank size={40} className="text-gray-200 mb-4" weight="duotone" />
            <p className="text-sm font-bold text-gray-400">
              Rutin tablolarını oluşturmak için giriş yap.
            </p>
          </div>
        ) : mainTab === "today" ? (
          <div className="space-y-4">
            <Toaster position="top-center" />
            
            <form onSubmit={handleAddQuickTask} className="relative">
              <Plus
                size={16}
                weight="bold"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400"
              />
              <input
                type="text"
                value={quickTask}
                onChange={(e) => setQuickTask(e.target.value)}
                placeholder="Hızlı görev ekle..."
                className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-bold shadow-sm outline-none focus:border-violet-300 placeholder:text-gray-400 placeholder:font-medium transition-all"
              />
            </form>

            {todayEntries.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <CalendarCheck size={48} className="mx-auto text-gray-200 mb-4" weight="duotone" />
                <p className="text-sm font-bold text-gray-500 mb-1">Bugün için görev veya rutin yok</p>
                <p className="text-xs text-gray-400 mb-4">
                  Yeni bir görev ekle veya rutinlerini ayarla.
                </p>
                <button
                  type="button"
                  onClick={() => setMainTab("manage")}
                  className="px-4 py-2.5 rounded-xl bg-violet-500 text-white text-xs font-black active:scale-95"
                >
                  Rutinlerimi ayarla
                </button>
              </div>
            ) : (
            <div className="space-y-6">
              {oneOffTasks.length > 0 && (
                <div className="space-y-2">
                  <p className="px-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Görevler
                  </p>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <AnimatePresence initial={false}>
                      {oneOffTasks.map((entry) => renderEntryRow(entry, true, true))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {routineTasks.length > 0 && (
                <div className="space-y-2">
                  <p className="px-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Rutinler
                  </p>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <AnimatePresence initial={false}>
                      {routineTasks.map((entry) => renderEntryRow(entry, true, true))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {BOARDS.map((board) => {
              const items = entriesForPeriod(board.key);
              const isExpanded = expandedBoards[board.key];

              return (
                <section
                  key={board.key}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden"
                >
                  <div
                    onClick={() =>
                      setExpandedBoards((prev) => ({
                        ...prev,
                        [board.key]: !prev[board.key],
                      }))
                    }
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-tight">
                      <CaretDown
                        size={14}
                        weight="bold"
                        className={`text-gray-400 transition-transform duration-300 ${
                          isExpanded ? "" : "-rotate-90"
                        }`}
                      />
                      {board.label}
                      {items.length > 0 && (
                        <span className="text-[10px] font-bold text-gray-300 normal-case tracking-normal">
                          {items.length}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCatalog(board.key);
                      }}
                      className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center active:scale-95 border border-violet-100 relative z-10 hover:bg-violet-100 transition-all"
                      aria-label={`${board.label} rutin ekle`}
                    >
                      <Plus size={16} weight="bold" />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="flex-1 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      {items.length === 0 ? (
                        <div className="h-full min-h-[72px] flex items-center justify-center">
                          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                            Henüz kayıt yok
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <AnimatePresence initial={false}>
                            {items.map((entry) => renderEntryRow(entry, true))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>

      <Drawer.Root
        open={showCatalog && !!user && !!activePeriod}
        onOpenChange={(open) => {
          if (!open) closeCatalog();
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-xl flex-col rounded-t-3xl border-t border-gray-200/60 bg-white shadow-2xl outline-none overflow-hidden">
            <div className="mx-auto w-10 h-1 rounded-full bg-gray-200 mt-2 mb-1 shrink-0" />
            <div className="px-4 pb-2 flex items-center justify-between shrink-0">
              <div>
                <Drawer.Title className="text-lg font-black text-gray-900 uppercase tracking-tight">
                  Ekle
                </Drawer.Title>
                <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mt-1">
                  {BOARDS.find((b) => b.key === activePeriod)?.label}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCatalog}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 active:scale-95"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="px-4 mb-3 shrink-0">
              {activePeriod !== "once" && (
                <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100 w-full">
                  {(
                    [
                      { key: "catalog" as const, label: "Katalog", icon: ListBullets },
                      { key: "custom" as const, label: "Özel", icon: PencilSimple },
                    ] as const
                  ).map((tab) => {
                    const TabIcon = tab.icon;
                    const active = drawerTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => handleTabChange(tab.key)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all active:scale-[0.98] ${
                          active
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <TabIcon size={13} weight={active ? "fill" : "duotone"} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {drawerTab === "catalog" ? (
              <>
                <div className="px-4 shrink-0">
                  {renderScheduleSelection()}
                </div>

                <div className="px-4 relative mb-3 shrink-0">
                  <MagnifyingGlass
                    size={16}
                    weight="bold"
                    className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-300"
                  />
                  <input
                    type="text"
                    value={catalogQuery}
                    onChange={(e) => setCatalogQuery(e.target.value)}
                    placeholder="Rutin ara..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:border-violet-400/40 outline-none placeholder:text-gray-400"
                  />
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-5 min-h-0">
                  {filteredCatalog.map((group) => (
                    <div key={group.category}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                        {group.category}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {group.items.map((item) => {
                          if (!activePeriod) return null;
                          const catalogItem: CatalogItem = {
                            ...item,
                            category: group.category,
                          };
                          const added = isAlreadyAdded(catalogItem, activePeriod);

                          return (
                            <button
                              key={item.slug}
                              type="button"
                              disabled={added || adding}
                              onClick={() => void handleAdd(catalogItem)}
                              className={`rounded-xl border flex flex-col items-center justify-center px-2 py-3 transition-all ${
                                added
                                  ? "bg-violet-50/60 border-violet-200/60 opacity-60 cursor-default"
                                  : "bg-gray-50 border-gray-200/80 hover:border-violet-300 active:scale-95"
                              }`}
                            >
                              <span className="text-2xl mb-1">{item.emoji}</span>
                              <span className="text-[10px] font-bold text-gray-800 text-center leading-tight line-clamp-2">
                                {item.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                      {EV_ISLERI_APP && (
                        <button
                          type="button"
                          onClick={() => {
                            window.location.href = getAppHref(EV_ISLERI_APP);
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-left transition-all active:scale-[0.99]"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-teal-700 uppercase tracking-wider">
                              Ev işleri & temizlik
                            </p>
                            <p className="text-[11px] font-bold text-teal-600/90 mt-0.5">
                              Bulaşık, çamaşır, süpürme → Ev İşleri
                            </p>
                          </div>
                          <EV_ISLERI_APP.icon
                            size={20}
                            weight="duotone"
                            className="shrink-0 text-teal-600"
                          />
                        </button>
                      )}
                </div>
              </>
            ) : (
              <div className="flex-1 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-h-0 overflow-y-auto">
                {renderScheduleSelection()}

                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-4">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(true)}
                      className="w-20 h-20 bg-white border border-gray-200 rounded-2xl text-center text-4xl outline-none hover:border-violet-400/40 shadow-sm transition-all flex items-center justify-center active:scale-95"
                    >
                      {customEmoji}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleAddCustom();
                    }}
                    placeholder="Rutin adı yaz..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-violet-400/40 placeholder:text-gray-400 placeholder:font-medium"
                    autoFocus
                  />

                  {customName.trim() &&
                    activePeriod &&
                    isNameTaken(customName.trim(), activePeriod) && (
                      <p className="text-[10px] font-bold text-red-500 text-center">
                        Bu isimde rutin zaten var
                      </p>
                    )}

                  <button
                    type="button"
                    disabled={
                      adding ||
                      !customName.trim() ||
                      (activePeriod ? isNameTaken(customName.trim(), activePeriod) : false)
                    }
                    onClick={() => void handleAddCustom()}
                    className="w-full py-3.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  >
                    <Plus size={16} weight="bold" />
                    Rutin Ekle
                  </button>
                </div>
              </div>
            )}
            {showEmojiPicker && drawerTab === "custom" && (
              <EmojiPickerOverlay
                onSelect={setCustomEmoji}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      
      <Drawer.Root
        open={!!editingEntry}
        onOpenChange={(open) => {
          if (!open) closeEdit();
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-xl flex-col rounded-t-3xl border-t border-gray-200/60 bg-white shadow-2xl outline-none overflow-hidden">
            <div className="mx-auto w-10 h-1 rounded-full bg-gray-200 mt-2 mb-1 shrink-0" />
            
            <div className="px-4 pb-2 flex items-center justify-between shrink-0">
              <div>
                <Drawer.Title className="text-lg font-black text-gray-900 uppercase tracking-tight">
                  Düzenle
                </Drawer.Title>
                <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mt-1">
                  {BOARDS.find((b) => b.key === editingEntry?.period_type)?.label}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 active:scale-95"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="flex-1 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] min-h-0 overflow-y-auto pt-2">
              {renderScheduleSelection(true)}

              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-4">
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(true)}
                    className="w-20 h-20 bg-white border border-gray-200 rounded-2xl text-center text-4xl outline-none hover:border-violet-400/40 shadow-sm transition-all flex items-center justify-center active:scale-95"
                  >
                    {editEmoji}
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                    Rutin Adı
                  </p>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleUpdateEntry();
                    }}
                    placeholder="Rutin adı..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-violet-400/40 placeholder:text-gray-400 placeholder:font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (editingEntry)
                        void handleDelete(editingEntry).then(() => closeEdit());
                    }}
                    className="flex-1 py-3.5 rounded-xl border border-red-100 bg-red-50 text-red-500 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-red-100"
                  >
                    <Trash size={16} weight="bold" />
                    Sil
                  </button>
                  <button
                    type="button"
                    disabled={updating || !editName.trim()}
                    onClick={() => void handleUpdateEntry()}
                    className="flex-[2] py-3.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-violet-200"
                  >
                    <Check size={16} weight="bold" />
                    Güncelle
                  </button>
                </div>
              </div>
            </div>
            {showEmojiPicker && !!editingEntry && (
              <EmojiPickerOverlay
                onSelect={setEditEmoji}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
