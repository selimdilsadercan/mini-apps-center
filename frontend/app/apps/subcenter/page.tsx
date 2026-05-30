"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash,
  CheckCircle,
  X,
  Receipt,
  Stack,
  PencilSimple,
  MagnifyingGlass,
  CaretDown,
  FilmStrip,
  MusicNotes,
  Robot,
  Code,
  Palette,
  ChatCircle,
  Package,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";

const client = createBrowserClient();

interface Subscription {
  id: string;
  user_id: string;
  name: string;
  plan_name: string;
  region: string;
  price: number;
  currency: string;
  cycle: string;
  category: string;
  color: string;
  icon: string;
  start_date: string;
  created_at: string;
}

interface GlobalPreset {
  id: string;
  name: string;
  plan_name: string;
  region: string;
  avg_price: number;
  currency: string;
  category: string;
  color: string;
  icon: string;
  usage_count: number;
  domain?: string;
}

function getRenewalDisplayDate(startDate: string, cycle: string): Date {
  const start = new Date(`${startDate}T12:00:00`);
  const renewalDay = start.getDate();
  const now = new Date();
  const year = now.getFullYear();
  const month = cycle === "yearly" ? start.getMonth() : now.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(renewalDay, lastDayOfMonth);
  return new Date(year, month, day, 12, 0, 0);
}

const EMPTY_SUB_FORM: Partial<Subscription> = {
  name: "",
  plan_name: "Standard",
  region: "TR",
  price: 0,
  cycle: "monthly",
  category: "Entertainment",
  color: "#6366F1",
  icon: "💳",
  currency: "TRY",
  start_date: new Date().toISOString().split("T")[0],
};

const USD_TRY_FALLBACK = 39;

type AddModalStep = "categories" | "brands" | "plan" | "form";

type CatalogBrand = {
  name: string;
  icon: string;
  color: string;
  category: string;
  plans: GlobalPreset[];
};

function brandsForCategory(presets: GlobalPreset[], categoryName: string, search: string): CatalogBrand[] {
  const byName = new Map<string, GlobalPreset[]>();
  for (const preset of presets.filter((p) => p.category === categoryName)) {
    const list = byName.get(preset.name) ?? [];
    list.push(preset);
    byName.set(preset.name, list);
  }
  let brands = Array.from(byName.entries()).map(([name, plans]) => ({
    name,
    icon: plans[0].icon,
    color: plans[0].color,
    category: plans[0].category,
    plans,
  }));
  const q = search.trim().toLowerCase();
  if (q) {
    brands = brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.plans.some((p) => p.plan_name.toLowerCase().includes(q))
    );
  }
  return brands;
}

function categoryMatchesSearch(
  cat: SubscriptionCategory,
  presets: GlobalPreset[],
  search: string
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return cat.name.toLowerCase().includes(q) || brandsForCategory(presets, cat.name, search).length > 0;
}

interface SubscriptionCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

const FALLBACK_CATEGORIES: SubscriptionCategory[] = [
  { id: "entertainment", name: "Entertainment", icon: "🎬", color: "#E50914", sort_order: 1 },
  { id: "music", name: "Music", icon: "🎵", color: "#1DB954", sort_order: 2 },
  { id: "ai", name: "AI", icon: "🤖", color: "#10A37F", sort_order: 3 },
  { id: "software", name: "Software", icon: "💻", color: "#6366F1", sort_order: 4 },
  { id: "design", name: "Design", icon: "✨", color: "#00C4CC", sort_order: 5 },
  { id: "social", name: "Social", icon: "💬", color: "#1877F2", sort_order: 6 },
  { id: "other", name: "Other", icon: "📦", color: "#64748B", sort_order: 7 },
];

const CATEGORY_ICON_MAP: Record<string, PhosphorIcon> = {
  entertainment: FilmStrip,
  music: MusicNotes,
  ai: Robot,
  software: Code,
  design: Palette,
  social: ChatCircle,
  other: Package,
};

function CategoryIcon({ categoryId, color, size = 20 }: { categoryId: string; color: string; size?: number }) {
  const IconComponent = CATEGORY_ICON_MAP[categoryId] ?? Package;
  return <IconComponent size={size} weight="duotone" style={{ color }} className="shrink-0" />;
}

const getDomainForService = (name: string, presetList: GlobalPreset[]) => {
  const cleanName = name
    .toLowerCase()
    .trim()
    .replace(/ı/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o");

  const preset = presetList.find((p) => {
    const cleanPresetName = p.name
      .toLowerCase()
      .trim()
      .replace(/ı/g, "i")
      .replace(/i̇/g, "i")
      .replace(/ş/g, "s")
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ö/g, "o");
    return cleanPresetName === cleanName || cleanName.includes(cleanPresetName) || cleanPresetName.includes(cleanName);
  });
  return preset?.domain ?? null;
};

function BrandIcon({
  name,
  icon,
  size = 24,
  presets,
}: {
  name: string;
  icon: string;
  size?: number;
  presets: GlobalPreset[];
}) {
  const [attempt, setAttempt] = useState(0);
  const domain = getDomainForService(name, presets);
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

  let logoUrl: string | null = null;
  if (domain) {
    if (attempt === 0) {
      logoUrl = token ? `https://img.logo.dev/${domain}?token=${token}` : `https://unavatar.io/${domain}?fallback=false`;
    } else if (attempt === 1) {
      logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  }

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="object-contain rounded-lg"
        style={{ width: size, height: size }}
        onError={() => setAttempt((prev) => prev + 1)}
      />
    );
  }

  return <span className="relative z-10" style={{ fontSize: size - 8 }}>{icon || "💳"}</span>;
}

export default function SubscriptionCenter() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { locale } = useLanguage();
  const t = useTranslations("subcenter");
  const dateLocale = locale === "tr" ? "tr-TR" : "en-US";

  const formatRenewalDate = (date: Date) =>
    date.toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });

  const formatMoney = (price: number, fractionDigits = 2) =>
    price.toLocaleString(dateLocale, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });

  const formatPriceDisplay = (price: number, currency = "TRY") => {
    const frac = price % 1 === 0 ? 0 : 2;
    if (currency === "USD") {
      const tryAmount = price * (usdTryRate ?? USD_TRY_FALLBACK);
      return `$${formatMoney(price, frac)} (₺${formatMoney(tryAmount, frac)})`;
    }
    return `₺${formatMoney(price, frac)}`;
  };

  const [usdTryRate, setUsdTryRate] = useState<number | null>(null);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [presets, setPresets] = useState<GlobalPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalStep, setAddModalStep] = useState<AddModalStep>("categories");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<SubscriptionCategory[]>([]);
  const [selectedBrandName, setSelectedBrandName] = useState<string | null>(null);
  const [newSub, setNewSub] = useState<Partial<Subscription>>({ ...EMPTY_SUB_FORM });

  const categorySections = useMemo(
    () =>
      categories.map((cat) => ({
        category: cat,
        brands: brandsForCategory(presets, cat.name, brandSearch),
      })),
    [categories, presets, brandSearch]
  );

  const visibleSections = useMemo(
    () => categorySections.filter((s) => categoryMatchesSearch(s.category, presets, brandSearch)),
    [categorySections, presets, brandSearch]
  );

  const categoryNamesKey = useMemo(
    () => categories.map((c) => c.name).join("\0"),
    [categories]
  );

  const plansForSelectedBrand = useMemo(
    () => (selectedBrandName ? presets.filter((p) => p.name === selectedBrandName) : []),
    [selectedBrandName, presets]
  );

  const fetchCategories = async () => {
    try {
      const resp = await client.subcenter.getCategories();
      if (Array.isArray(resp.categories)) {
        setCategories(resp.categories);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategories(FALLBACK_CATEGORIES);
    }
  };

  const fetchPresets = async () => {
    if (process.env.NODE_ENV === "development") {
      try {
        const localPresets = [
          ...require("../../../../backend/subcenter/data/entertainment.json"),
          ...require("../../../../backend/subcenter/data/music.json"),
          ...require("../../../../backend/subcenter/data/ai.json"),
          ...require("../../../../backend/subcenter/data/software.json"),
          ...require("../../../../backend/subcenter/data/other.json"),
          ...require("../../../../backend/subcenter/data/design.json"),
          ...require("../../../../backend/subcenter/data/social.json"),
        ].map((p: { name: string; plan_name: string; region: string; price: number; currency: string; category: string; color: string; icon: string; domain?: string }) => ({
          id: `${p.name.toLowerCase().replace(/\s+/g, "-")}-${p.plan_name.toLowerCase().replace(/\s+/g, "-")}-${p.region.toLowerCase()}`,
          name: p.name,
          plan_name: p.plan_name,
          region: p.region,
          avg_price: p.price,
          currency: p.currency,
          category: p.category,
          color: p.color,
          icon: p.icon,
          usage_count: 1,
          domain: p.domain,
        }));
        setPresets(localPresets);
      } catch (err) {
        console.error("Failed to load local presets:", err);
      }
    } else {
      try {
        const resp = await client.subcenter.getGlobalPresets();
        setPresets(resp.presets);
      } catch (err) {
        console.error("Failed to load presets:", err);
      }
    }
  };

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const subsResp = await client.subcenter.getUserSubscriptions(user.id);
      setSubscriptions(subsResp.subscriptions);
    } catch (err) {
      console.error("Failed to load subs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    client.subcenter
      .getExchangeRate()
      .then((data) => {
        if (typeof data.rate === "number" && data.rate > 0) setUsdTryRate(data.rate);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchPresets();
  }, []);

  useEffect(() => {
    if (isUserLoaded && user?.id) {
      fetchData();
    }
  }, [isUserLoaded, user?.id]);

  const applyPreset = (preset: GlobalPreset) => {
    setNewSub({
      name: preset.name,
      plan_name: preset.plan_name,
      region: preset.region,
      price: preset.avg_price,
      currency: preset.currency,
      cycle: "monthly",
      category: preset.category,
      color: preset.color,
      icon: preset.icon,
      start_date: new Date().toISOString().split("T")[0],
    });
  };

  const handleBrandSearchChange = (value: string) => {
    setBrandSearch(value);
    const q = value.trim();
    if (!q) {
      setExpandedCategories(new Set(categories.map((c) => c.name)));
      return;
    }
    setExpandedCategories(
      new Set(
        categories
          .filter((cat) => categoryMatchesSearch(cat, presets, value))
          .map((c) => c.name)
      )
    );
  };

  useEffect(() => {
    if (!showAddModal || addModalStep !== "categories" || brandSearch.trim()) return;
    setExpandedCategories(new Set(categories.map((c) => c.name)));
  }, [showAddModal, addModalStep, categoryNamesKey, brandSearch]);

  const toggleCategoryExpanded = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const categoryLabel = (name: string) => {
    const label = t(`categories.${name}`);
    return label.startsWith("subcenter.") ? name : label;
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setAddModalStep("categories");
    setBrandSearch("");
    setExpandedCategories(new Set());
    setSelectedBrandName(null);
    setNewSub({ ...EMPTY_SUB_FORM });
  };

  useEffect(() => {
    if (!showAddModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAddModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showAddModal]);

  const openIssueBill = () => {
    setEditingId(null);
    setNewSub({ ...EMPTY_SUB_FORM });
    setBrandSearch("");
    setExpandedCategories(new Set(categories.map((c) => c.name)));
    setAddModalStep("categories");
    setShowAddModal(true);
  };

  const selectBrand = (brand: CatalogBrand) => {
    setSelectedBrandName(brand.name);
    applyPreset(brand.plans[0]);
    setAddModalStep(brand.plans.length > 1 ? "plan" : "form");
  };

  const selectPlan = (preset: GlobalPreset) => {
    applyPreset(preset);
    setAddModalStep("form");
  };

  const goBackFromForm = () => {
    if (selectedBrandName && plansForSelectedBrand.length > 1) {
      setAddModalStep("plan");
      return;
    }
    if (selectedBrandName) {
      setSelectedBrandName(null);
      setAddModalStep("categories");
      return;
    }
    setAddModalStep("categories");
  };

  const goBackFromPlan = () => {
    setSelectedBrandName(null);
    setAddModalStep("categories");
  };

  const startCustomSubscription = () => {
    setSelectedBrandName(null);
    setNewSub({ ...EMPTY_SUB_FORM });
    setAddModalStep("form");
  };

  const handleEdit = (sub: Subscription) => {
    setEditingId(sub.id);
    setNewSub({
      name: sub.name,
      plan_name: sub.plan_name,
      region: sub.region,
      price: sub.price,
      cycle: sub.cycle,
      category: sub.category,
      color: sub.color,
      icon: sub.icon,
      currency: sub.currency,
      start_date: new Date(sub.start_date).toISOString().split("T")[0],
    });
    setAddModalStep("form");
    setShowAddModal(true);
  };

  const handleSaveSubscription = async () => {
    if (!user?.id || !newSub.name || !newSub.price) return;

    try {
      if (editingId) {
        const resp = await client.subcenter.updateSubscription(editingId, {
          userId: user.id,
          name: newSub.name,
          planName: newSub.plan_name || "Standard",
          region: newSub.region || "TR",
          price: newSub.price,
          currency: newSub.currency || "TRY",
          cycle: newSub.cycle || "monthly",
          category: newSub.category || "Other",
          color: newSub.color || "#6366F1",
          icon: newSub.icon || "💳",
          startDate: newSub.start_date || new Date().toISOString().split("T")[0],
        });

        if (resp.subscription) {
          setSubscriptions(subscriptions.map((s) => (s.id === editingId ? resp.subscription! : s)));
        }
      } else {
        const resp = await client.subcenter.createSubscription({
          userId: user.id,
          name: newSub.name,
          planName: newSub.plan_name,
          region: newSub.region,
          price: newSub.price,
          currency: newSub.currency || "TRY",
          cycle: newSub.cycle || "monthly",
          category: newSub.category || "Other",
          color: newSub.color || "#6366F1",
          icon: newSub.icon || "💳",
          startDate: newSub.start_date || new Date().toISOString().split("T")[0],
        });

        if (resp.subscription) {
          setSubscriptions([resp.subscription, ...subscriptions]);
        }
      }

      closeAddModal();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const removeSub = async (id: string) => {
    if (!user?.id || !id) return;
    try {
      setIsDeleting(true);
      const resp = await client.subcenter.deleteSubscription(id, { userId: user.id });
      if (resp.success) {
        setSubscriptions(subscriptions.filter((s) => s.id !== id));
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const monthlyTotal = useMemo(() => {
    return subscriptions.reduce((acc, sub) => acc + (sub.cycle === "monthly" ? sub.price : sub.price / 12), 0);
  }, [subscriptions]);

  if (!isUserLoaded) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F4F6] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      <div className="h-3 bg-slate-300 border-b border-slate-400 w-full" />

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm px-6">
        <div className="max-w-5xl mx-auto h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase leading-none">
                <Receipt size={24} weight="fill" className="text-indigo-600" />
                SubCenter
              </h1>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{t("subtitle")}</p>
            </div>
          </div>

          <button
            onClick={openIssueBill}
            className="flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all active:scale-95 font-black text-[11px] uppercase tracking-widest cursor-pointer"
          >
            <Plus size={16} weight="bold" />
            <span>{t("issueBill")}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
        <section className="space-y-8">
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col">
              <h3 className="text-sm font-black text-slate-800 uppercase">{t("activeInvoices")}</h3>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                {t("recordsActive", { count: subscriptions.length })}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t("runningTotalMo")}</span>
              <span className="text-2xl font-black text-indigo-600 tracking-tighter leading-none">₺ {formatMoney(monthlyTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence mode="popLayout">
              {subscriptions.map((sub) => (
                <motion.div
                  key={sub.id}
                  layoutId={sub.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative group"
                >
                  <div className="bg-[#FAFAF8] shadow-sm flex flex-col overflow-hidden group-hover:shadow-md transition-shadow duration-300 border-y border-dashed border-slate-300">
                    <div className="border-x border-dashed border-slate-300 px-3 py-1.5">
                      <div className="border-b border-dashed border-slate-200 pb-1.5 mb-1.5">
                        <div className="flex gap-3 items-stretch">
                          <div className="shrink-0 flex flex-col items-center gap-1.5 text-center">
                            <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 max-w-[7rem]">{sub.name}</h4>
                            <div className="w-16 h-16 flex items-center justify-center bg-white border border-dashed border-slate-200 overflow-hidden p-1">
                              <BrandIcon name={sub.name} icon={sub.icon} size={40} presets={presets} />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col items-end justify-between text-right">
                            <div>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-none">{t("renewalDate")}</p>
                              <p className="text-sm text-slate-700 font-mono tabular-nums leading-tight mt-0.5">
                                {formatRenewalDate(getRenewalDisplayDate(sub.start_date, sub.cycle))}
                              </p>
                            </div>
                            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums leading-none">
                              {formatPriceDisplay(sub.price, sub.currency || "TRY")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-0.5 -mx-0.5">
                        <button
                          onClick={() => handleEdit(sub)}
                          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors active:scale-95 cursor-pointer"
                        >
                          <PencilSimple size={17} weight="bold" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(sub.id)}
                          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors active:scale-95 cursor-pointer"
                        >
                          <Trash size={17} weight="bold" />
                        </button>
                      </div>
                    </div>

                    <div
                      className="h-1.5 w-full border-x border-dashed border-slate-300"
                      style={{
                        background: `linear-gradient(135deg, #F3F4F6 25%, transparent 25%) -3px 0 / 6px 6px,
                                      linear-gradient(225deg, #F3F4F6 25%, transparent 25%) -3px 0 / 6px 6px`,
                        backgroundColor: "#FAFAF8",
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAddModal}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-h-[85vh] bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden flex flex-col ${addModalStep === "categories" ? "max-w-xl" : "max-w-md"}`}
            >
              <div className="p-6 pb-4 flex items-center justify-between shrink-0 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  {((addModalStep === "form" && !editingId) || addModalStep === "plan") && (
                    <button
                      onClick={addModalStep === "plan" ? goBackFromPlan : goBackFromForm}
                      className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 transition-all cursor-pointer"
                    >
                      <ArrowLeft size={16} weight="bold" />
                    </button>
                  )}
                  <div className="w-10 h-10 shrink-0 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                    {editingId ? <PencilSimple size={20} weight="bold" /> : <Stack size={20} weight="bold" />}
                  </div>
                  <h2 className="text-base font-black text-slate-800 uppercase truncate">
                    {editingId
                      ? t("editBill")
                      : addModalStep === "categories"
                        ? t("selectCategory")
                        : addModalStep === "plan"
                          ? t("selectPlan")
                          : t("billDetails")}
                  </h2>
                </div>
                <button onClick={closeAddModal} className="w-9 h-9 shrink-0 flex items-center justify-center hover:bg-slate-50 rounded-full text-slate-300 cursor-pointer">
                  <X size={18} weight="bold" />
                </button>
              </div>

              {addModalStep === "categories" && !editingId ? (
                <>
                  <div className="shrink-0 px-4 pt-3 pb-2">
                    <div className="relative">
                      <MagnifyingGlass size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="search"
                        value={brandSearch}
                        onChange={(e) => handleBrandSearchChange(e.target.value)}
                        placeholder={t("brandSearchPlaceholder")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pb-3 min-h-0 space-y-2">
                    {visibleSections.length === 0 ? (
                      <p className="text-center text-sm font-bold text-slate-400 py-8">{t("noBrandsFound")}</p>
                    ) : (
                      visibleSections.map(({ category, brands }) => {
                        const expanded = expandedCategories.has(category.name);
                        return (
                          <div key={category.id} className="rounded-2xl border border-slate-100 overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => toggleCategoryExpanded(category.name)}
                              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 transition-colors cursor-pointer text-left"
                              style={{ borderLeft: `3px solid ${category.color}` }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <CategoryIcon categoryId={category.id} color={category.color} size={20} />
                                <span className="text-sm font-bold text-slate-800 truncate">{categoryLabel(category.name)}</span>
                                <span className="text-[10px] font-bold text-slate-400 shrink-0">({brands.length})</span>
                              </div>
                              <CaretDown
                                size={16}
                                weight="bold"
                                className={`shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                              />
                            </button>
                            <AnimatePresence initial={false}>
                              {expanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-3 pt-2 border-t border-slate-100">
                                    {brands.length === 0 ? (
                                      <p className="text-center text-xs font-bold text-slate-400 py-4">{t("noBrandsFound")}</p>
                                    ) : (
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {brands.map((brand) => (
                                          <button
                                            key={brand.name}
                                            onClick={() => selectBrand(brand)}
                                            className="flex flex-col items-center justify-center gap-1.5 p-3 min-h-[6.5rem] rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all text-center cursor-pointer"
                                          >
                                            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                                              <BrandIcon name={brand.name} icon={brand.icon} size={32} presets={presets} />
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2">{brand.name}</p>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="shrink-0 p-4 pt-2 border-t border-slate-100 bg-white">
                    <button
                      onClick={startCustomSubscription}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 font-bold text-sm transition-all cursor-pointer"
                    >
                      <Plus size={18} weight="bold" />
                      {t("addCustomSubscription")}
                    </button>
                  </div>
                </>
              ) : addModalStep === "plan" && !editingId ? (
                <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
                  <p className="text-center text-sm font-bold text-slate-600 mb-4">{selectedBrandName}</p>
                  <div className="space-y-2">
                    {plansForSelectedBrand.map((preset, i) => (
                      <button
                        key={`${preset.plan_name}-${i}`}
                        onClick={() => selectPlan(preset)}
                        className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                          newSub.plan_name === preset.plan_name
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${newSub.plan_name === preset.plan_name ? "text-white" : "text-slate-800"}`}>
                            {preset.plan_name}
                          </p>
                          <p className={`text-[10px] font-medium uppercase tracking-wide ${newSub.plan_name === preset.plan_name ? "text-slate-300" : "text-slate-400"}`}>
                            {preset.region}
                          </p>
                        </div>
                        <span className={`text-sm font-bold font-mono tabular-nums shrink-0 ${newSub.plan_name === preset.plan_name ? "text-white" : "text-slate-700"}`}>
                          {formatPriceDisplay(preset.avg_price, preset.currency)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 min-h-0">
                  {presets.some((p) => p.name === newSub.name) && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">{t("quickPlan")}</label>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {presets
                          .filter((p) => p.name === newSub.name)
                          .map((p, i) => (
                            <button
                              key={i}
                              onClick={() =>
                                setNewSub({
                                  ...newSub,
                                  plan_name: p.plan_name,
                                  price: p.avg_price,
                                  region: p.region,
                                  currency: p.currency,
                                  category: p.category,
                                  color: p.color,
                                  icon: p.icon,
                                })
                              }
                              className={`flex-shrink-0 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
                                newSub.plan_name === p.plan_name
                                  ? "bg-slate-900 text-white border-slate-900"
                                  : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                              }`}
                            >
                              {p.plan_name}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">{t("category")}</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                      value={newSub.category || "Other"}
                      onChange={(e) => {
                        const cat = categories.find((c) => c.name === e.target.value);
                        setNewSub({
                          ...newSub,
                          category: e.target.value,
                          color: cat?.color || newSub.color,
                          icon: cat?.icon || newSub.icon,
                        });
                      }}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {categoryLabel(cat.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">{t("service")}</label>
                    <input
                      type="text"
                      placeholder={t("servicePlaceholder")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      value={newSub.name}
                      onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">{t("planLevel")}</label>
                      <input
                        type="text"
                        placeholder={t("planPlaceholder")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        value={newSub.plan_name}
                        onChange={(e) => setNewSub({ ...newSub, plan_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">{t("region")}</label>
                      <input
                        type="text"
                        placeholder={t("regionPlaceholder")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase"
                        value={newSub.region}
                        onChange={(e) => setNewSub({ ...newSub, region: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">{t("currency")}</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                        value={newSub.currency || "TRY"}
                        onChange={(e) => setNewSub({ ...newSub, currency: e.target.value })}
                      >
                        <option value="TRY">{t("currencyTry")}</option>
                        <option value="USD">{t("currencyUsd")}</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">{t("cycle")}</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                        value={newSub.cycle}
                        onChange={(e) => setNewSub({ ...newSub, cycle: e.target.value })}
                      >
                        <option value="monthly">{t("monthly")}</option>
                        <option value="yearly">{t("yearly")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">
                      {newSub.currency === "USD" ? t("amountUsd") : t("amount")}
                    </label>
                    <input
                      type="number"
                      placeholder={newSub.currency === "USD" ? t("amountUsdPlaceholder") : t("amountPlaceholder")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-black font-mono focus:outline-none focus:border-indigo-500 transition-all"
                      value={newSub.price || ""}
                      onChange={(e) => setNewSub({ ...newSub, price: parseFloat(e.target.value) })}
                    />
                    {!!newSub.price && newSub.price > 0 && newSub.currency === "USD" && (
                      <p className="text-xs font-bold font-mono text-slate-500 px-1 tabular-nums">
                        {formatPriceDisplay(newSub.price, "USD")}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleSaveSubscription}
                    className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[11px]"
                  >
                    <CheckCircle size={22} weight="fill" />
                    {editingId ? t("update") : t("saveBill")}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-[2.5rem] shadow-2xl z-[111] overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6 shadow-sm border border-red-100">
                <Trash size={32} weight="fill" />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase mb-2">{t("voidReceiptTitle")}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">{t("voidReceiptDescription")}</p>

              <div className="grid grid-cols-2 gap-4 mt-10">
                <button
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(null)}
                  className="py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  {t("keepIt")}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => removeSub(showDeleteConfirm!)}
                  className="py-4 rounded-2xl bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-700 shadow-lg shadow-red-200 transition-all cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isDeleting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {isDeleting ? t("processing") : t("voidDelete")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
