"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
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
  Calendar,
  Cloud,
  Heart,
  GraduationCap,
  Coins,
  GameController,
  Lightning,
  Shield,
  ShoppingCart,
  SoccerBall,
  CaretLeft,
  CreditCard,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

const client = createBrowserClient();

interface Subscription {
  id: string;
  userId: string;
  name: string;
  planName: string;
  region: string;
  price: number;
  currency: string;
  cycle: string;
  category: string;
  color: string;
  icon: string;
  startDate: string;
  trialDuration: string | null;
  website: string | null;
  createdAt: string;
}

interface GlobalPreset {
  id: string;
  name: string;
  planName: string;
  region: string;
  avgPrice: number;
  currency: string;
  category: string;
  color: string;
  icon: string;
  usageCount: number;
  domain?: string;
}

function getRenewalDisplayDate(startDate: string, cycle: string): Date {
  const start = new Date(`${startDate}T12:00:00`);
  const now = new Date();
  
  // If the subscription start date is in the future, the next renewal is the start date itself
  if (start > now) {
    return start;
  }

  let nextRenewal = new Date(start);
  while (nextRenewal <= now) {
    if (cycle === "yearly") {
      nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
    } else {
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);
    }
  }
  return nextRenewal;
}

function getTrialInfo(startDateStr: string, trialDuration: string | null, locale: string) {
  if (!trialDuration) return null;
  const start = new Date(`${startDateStr}T12:00:00`);
  const trialEnd = new Date(start);

  if (trialDuration === "1_week") {
    trialEnd.setDate(trialEnd.getDate() + 7);
  } else if (trialDuration === "1_month") {
    trialEnd.setMonth(trialEnd.getMonth() + 1);
  } else if (trialDuration === "3_months") {
    trialEnd.setMonth(trialEnd.getMonth() + 3);
  } else if (trialDuration === "6_months") {
    trialEnd.setMonth(trialEnd.getMonth() + 6);
  } else if (trialDuration === "1_year") {
    trialEnd.setFullYear(trialEnd.getFullYear() + 1);
  } else {
    return null;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(trialEnd.getFullYear(), trialEnd.getMonth(), trialEnd.getDate());

  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return {
      isActive: true,
      daysLeft: diffDays,
      endDate: trialEnd,
      label: locale === "tr" ? `${diffDays} gün kaldı` : `${diffDays} days left`,
    };
  } else {
    return {
      isActive: false,
      daysLeft: 0,
      endDate: trialEnd,
      label: locale === "tr" ? "Bitti" : "Ended",
    };
  }
}

const EMPTY_SUB_FORM: Partial<Subscription> = {
  name: "",
  planName: "Standard",
  region: "TR",
  price: 0,
  cycle: "monthly",
  category: "Entertainment",
  color: "#6366F1",
  icon: "💳",
  currency: "TRY",
  startDate: new Date().toISOString().split("T")[0],
  trialDuration: null,
  website: "",
};

const TRIAL_OPTIONS = [
  { value: null, label: "none" },
  { value: "1_week", label: "1week" },
  { value: "1_month", label: "1month" },
  { value: "3_months", label: "3months" },
  { value: "6_months", label: "6months" },
  { value: "1_year", label: "1year" },
] as const;

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
        b.plans.some((p) => p.planName.toLowerCase().includes(q))
    );
  }
  return brands;
}

function categoryMatchesSearch(
  cat: SubscriptionCategory,
  presets: GlobalPreset[],
  search: string,
  labelForCategory?: (idOrName: string) => string
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const label = labelForCategory?.(cat.id)?.toLowerCase() ?? "";
  return (
    cat.name.toLowerCase().includes(q) ||
    cat.id.toLowerCase().includes(q) ||
    label.includes(q) ||
    brandsForCategory(presets, cat.name, search).length > 0
  );
}

interface SubscriptionCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
}

const CATEGORY_META: Record<string, { icon: string; color: string; sort_order: number }> = {
  "Entertainment": { icon: "🎬", color: "#E50914", sort_order: 1 },
  "Music": { icon: "🎵", color: "#1DB954", sort_order: 2 },
  "AI": { icon: "🤖", color: "#10A37F", sort_order: 3 },
  "Software": { icon: "💻", color: "#6366F1", sort_order: 4 },
  "Design": { icon: "✨", color: "#00C4CC", sort_order: 5 },
  "Social": { icon: "💬", color: "#1877F2", sort_order: 6 },
  "Cloud Storage": { icon: "☁️", color: "#0284C7", sort_order: 7 },
  "Dating": { icon: "❤️", color: "#EC4899", sort_order: 8 },
  "Education": { icon: "🎓", color: "#F59E0B", sort_order: 9 },
  "Finance": { icon: "💵", color: "#10B981", sort_order: 10 },
  "Gaming": { icon: "🎮", color: "#8B5CF6", sort_order: 11 },
  "Productivity": { icon: "⚡", color: "#3B82F6", sort_order: 12 },
  "Security": { icon: "🛡️", color: "#14B8A6", sort_order: 13 },
  "Shopping": { icon: "🛍️", color: "#EF4444", sort_order: 14 },
  "Sports": { icon: "⚽", color: "#22C55E", sort_order: 15 },
  "Other": { icon: "📦", color: "#64748B", sort_order: 16 },
};

const CATEGORY_NAME_TO_ID: Record<string, string> = {
  Entertainment: "entertainment",
  Music: "music",
  AI: "ai",
  Software: "software",
  Design: "design",
  Social: "social",
  "Cloud Storage": "cloud",
  Dating: "dating",
  Education: "education",
  Finance: "finance",
  Gaming: "gaming",
  Productivity: "productivity",
  Security: "security",
  Shopping: "shopping",
  Sports: "sports",
  Other: "other",
};

const CATEGORY_ICON_MAP: Record<string, PhosphorIcon> = {
  entertainment: FilmStrip,
  music: MusicNotes,
  ai: Robot,
  software: Code,
  design: Palette,
  social: ChatCircle,
  cloud: Cloud,
  cloud_storage: Cloud,
  dating: Heart,
  education: GraduationCap,
  finance: Coins,
  gaming: GameController,
  productivity: Lightning,
  security: Shield,
  shopping: ShoppingCart,
  sports: SoccerBall,
  other: Package,
};

function CategoryIcon({ categoryId, color, size = 20 }: { categoryId: string; color: string; size?: number }) {
  const IconComponent = CATEGORY_ICON_MAP[categoryId.replace(/-/g, "_")] ?? Package;
  return <IconComponent size={size} weight="duotone" style={{ color }} className="shrink-0" />;
}

const getDomainForService = (name: string, presetList: GlobalPreset[]) => {
  let cleanName = name.trim().toLowerCase();
  
  // Remove protocols and www.
  cleanName = cleanName
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .split("/")[0]; // get only host part

  // If it looks like a domain name (contains a dot and no spaces)
  if (cleanName.includes(".") && !cleanName.includes(" ")) {
    return cleanName;
  }

  // Otherwise normalize Turkish characters and search in presets
  const normalName = cleanName
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
    return cleanPresetName === normalName || normalName.includes(cleanPresetName) || cleanPresetName.includes(normalName);
  });
  return preset?.domain ?? null;
};

function BrandIcon({
  name,
  icon,
  size = 24,
  presets,
  website,
}: {
  name: string;
  icon: string;
  size?: number;
  presets: GlobalPreset[];
  website?: string | null;
}) {
  const [attempt, setAttempt] = useState(0);
  const domain = website || getDomainForService(name, presets);
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
  const { confirm } = useConfirmDialog();
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAllTrials, setShowAllTrials] = useState(false);

  const categories = useMemo<SubscriptionCategory[]>(() => {
    const names = Array.from(new Set(presets.map(p => p.category)));
    return names.map(name => {
      const meta = CATEGORY_META[name] ?? { icon: "📦", color: "#64748B", sort_order: 99 };
      return {
        id: CATEGORY_NAME_TO_ID[name] ?? name.toLowerCase().replace(/\s+/g, "-"),
        name,
        icon: meta.icon,
        color: meta.color,
        sort_order: meta.sort_order,
      };
    }).sort((a, b) => a.sort_order - b.sort_order);
  }, [presets]);

  const uniquePresets = useMemo(() => {
    const seen = new Set<string>();
    return presets.filter(p => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    });
  }, [presets]);

  const EMPTY_SAMPLE_CATEGORIES = ["Entertainment", "Music", "AI", "Gaming", "Cloud Storage"];

  const EMPTY_STATE_BRAND_PRIORITY: Record<string, string[]> = {
    Entertainment: ["YouTube Premium", "MUBI", "Exxen"],
    Music: ["Apple Music", "Amazon Music", "Deezer"],
    AI: ["ChatGPT Plus", "Gemini Advanced", "Claude Pro"],
    Gaming: ["Xbox Game Pass", "PlayStation Plus", "Nintendo Switch Online"],
    "Cloud Storage": ["Google One", "iCloud+", "Microsoft OneDrive", "Dropbox"],
  };

  const emptyStateSamples = useMemo(() => {
    const result: GlobalPreset[] = [];
    for (const category of EMPTY_SAMPLE_CATEGORIES) {
      const priorities = EMPTY_STATE_BRAND_PRIORITY[category] ?? [];
      let preset =
        priorities
          .map((brand) => presets.find((p) => p.category === category && p.name === brand))
          .find(Boolean) ?? presets.find((p) => p.category === category);
      if (preset) result.push(preset);
    }
    return result.slice(0, 5);
  }, [presets]);

  const [selectedBrandName, setSelectedBrandName] = useState<string | null>(null);
  const [newSub, setNewSub] = useState<Partial<Subscription>>({ ...EMPTY_SUB_FORM });

  const resolveCategoryKey = (idOrName: string): string => {
    const fromList = categories.find((c) => c.id === idOrName || c.name === idOrName);
    if (fromList) return CATEGORY_NAME_TO_ID[fromList.name] ?? fromList.id;
    return CATEGORY_NAME_TO_ID[idOrName] ?? idOrName;
  };

  const categoryLabel = (idOrName: string) => {
    const key = resolveCategoryKey(idOrName);
    const label = t(`categories.${key}`);
    return label.startsWith("subcenter.") ? idOrName : label;
  };

  const categorySections = useMemo(
    () =>
      categories.map((cat) => ({
        category: cat,
        brands: brandsForCategory(presets, cat.name, brandSearch),
      })),
    [categories, presets, brandSearch]
  );

  const visibleSections = useMemo(
    () => categorySections.filter((s) => categoryMatchesSearch(s.category, presets, brandSearch, categoryLabel)),
    [categorySections, presets, brandSearch, categories, locale]
  );

  const categoryNamesKey = useMemo(
    () => categories.map((c) => c.name).join("\0"),
    [categories]
  );

  const plansForSelectedBrand = useMemo(
    () => (selectedBrandName ? presets.filter((p) => p.name === selectedBrandName) : []),
    [selectedBrandName, presets]
  );

  const fetchPresets = async () => {
    try {
      const resp = await client.subcenter.getGlobalPresets();
      setPresets(resp.presets);
    } catch (err) {
      console.error("Failed to load presets:", err);
    }
  };

  const fetchData = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
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
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetchPresets();
  }, []);

  useEffect(() => {
    if (isUserLoaded) {
      fetchData();
    }
  }, [isUserLoaded, user?.id]);

  const applyPreset = (preset: GlobalPreset) => {
    setNewSub({
      name: preset.name,
      planName: preset.planName,
      region: preset.region,
      price: preset.avgPrice,
      currency: preset.currency,
      cycle: "monthly",
      category: preset.category,
      color: preset.color,
      icon: preset.icon,
      startDate: new Date().toISOString().split("T")[0],
      website: preset.domain || "",
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
          .filter((cat) => categoryMatchesSearch(cat, presets, value, categoryLabel))
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
      planName: sub.planName,
      region: sub.region,
      price: sub.price,
      cycle: sub.cycle,
      category: sub.category,
      color: sub.color,
      icon: sub.icon,
      currency: sub.currency,
      startDate: new Date(sub.startDate).toISOString().split("T")[0],
      trialDuration: sub.trialDuration,
      website: sub.website,
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
          planName: newSub.planName || "Standard",
          region: newSub.region || "TR",
          price: newSub.price,
          currency: newSub.currency || "TRY",
          cycle: newSub.cycle || "monthly",
          category: newSub.category || "Other",
          color: newSub.color || "#6366F1",
          icon: newSub.icon || "💳",
          startDate: newSub.startDate || new Date().toISOString().split("T")[0],
          trialDuration: newSub.trialDuration || null,
          website: newSub.website || null,
        });

        if (resp.subscription) {
          setSubscriptions(subscriptions.map((s) => (s.id === editingId ? resp.subscription! : s)));
        }
      } else {
        const resp = await client.subcenter.createSubscription({
          userId: user.id,
          name: newSub.name,
          planName: newSub.planName || "Standard",
          region: newSub.region || "TR",
          price: newSub.price,
          currency: newSub.currency || "TRY",
          cycle: newSub.cycle || "monthly",
          category: newSub.category || "Other",
          color: newSub.color || "#6366F1",
          icon: newSub.icon || "💳",
          startDate: newSub.startDate || new Date().toISOString().split("T")[0],
          trialDuration: newSub.trialDuration || null,
          website: newSub.website || null,
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
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = async (id: string) => {
    const ok = await confirm({
      title: locale === "tr" ? "Aboneliği Sil?" : "Delete Subscription?",
      description: locale === "tr"
        ? "Bu aboneliği kalıcı olarak silmek istediğinden emin misin?"
        : "Are you sure you want to permanently delete this subscription?",
      confirmText: locale === "tr" ? "Sil" : "Delete",
      variant: "danger",
    });
    if (ok) {
      void removeSub(id);
    }
  };



  const groupedSubs = useMemo(() => {
    const trials: Subscription[] = [];
    const activeSubs: Subscription[] = [];
    for (const sub of subscriptions) {
      const trialInfo = getTrialInfo(sub.startDate, sub.trialDuration, locale);
      if (trialInfo?.isActive) {
        trials.push(sub);
      } else {
        activeSubs.push(sub);
      }
    }
    // Sort trials: closest to ending first
    trials.sort((a, b) => {
      const aInfo = getTrialInfo(a.startDate, a.trialDuration, locale);
      const bInfo = getTrialInfo(b.startDate, b.trialDuration, locale);
      return (aInfo?.daysLeft ?? 0) - (bInfo?.daysLeft ?? 0);
    });
    // Sort active subs: closest renewal date first
    activeSubs.sort((a, b) => {
      const aRenewal = getRenewalDisplayDate(a.startDate, a.cycle).getTime();
      const bRenewal = getRenewalDisplayDate(b.startDate, b.cycle).getTime();
      return aRenewal - bRenewal;
    });
    return { trials, activeSubs };
  }, [subscriptions, locale]);

  const { immediateTrials, longTrials } = useMemo(() => {
    const immediate: Subscription[] = [];
    const long: Subscription[] = [];
    for (const sub of groupedSubs.trials) {
      const trialInfo = getTrialInfo(sub.startDate, sub.trialDuration, locale);
      if ((trialInfo?.daysLeft ?? 0) <= 100) {
        immediate.push(sub);
      } else {
        long.push(sub);
      }
    }
    return { immediateTrials: immediate, longTrials: long };
  }, [groupedSubs.trials, locale]);

  const renderSubscriptionCard = (sub: Subscription) => {
    const trialInfo = getTrialInfo(sub.startDate, sub.trialDuration, locale);
    const renewalDate = getRenewalDisplayDate(sub.startDate, sub.cycle);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(renewalDate.getFullYear(), renewalDate.getMonth(), renewalDate.getDate());
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return (
      <motion.div
        key={sub.id}
        layoutId={sub.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-app-surface rounded-2xl border border-app-border shadow-sm p-4 flex flex-col gap-3 relative"
      >
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-app-surface-muted border border-app-border overflow-hidden shrink-0">
              <BrandIcon name={sub.name} icon={sub.icon} size={24} presets={presets} website={sub.website} />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-black text-app-text tracking-tight truncate leading-tight">{sub.name}</h4>
                <span className="text-[10px] font-bold text-app-muted truncate">({sub.planName})</span>
              </div>
              <span className="text-[8px] font-bold text-app-muted uppercase tracking-widest mt-1 block leading-none">
                {categoryLabel(sub.category)}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-sm font-black text-app-text tracking-tight">
              {formatPriceDisplay(sub.price, sub.currency)}
            </span>
            <span className="block text-[8px] font-bold text-app-muted uppercase tracking-wider mt-0.5">
              /{sub.cycle === "monthly" ? (locale === "tr" ? "aylık" : "mo") : (locale === "tr" ? "yıllık" : "yr")}
            </span>
          </div>
        </div>

        <div className="h-px bg-app-border w-full" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-app-muted min-w-0">
            <Calendar size={14} className="text-app-muted shrink-0" />
            <span className="text-[10px] font-medium text-app-text truncate">
              {trialInfo?.isActive ? (
                <span className="flex items-center gap-1.5">
                  {locale === "tr" ? "Deneme Bitişi: " : "Trial ends: "}
                  {formatRenewalDate(trialInfo.endDate)}
                  <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {trialInfo.label}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  {locale === "tr" ? "Yenilenme: " : "Renewal: "}
                  {formatRenewalDate(renewalDate)}
                  <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-app-surface-muted text-app-muted border border-app-border">
                    {locale === "tr" ? `${diffDays} gün kaldı` : `${diffDays} days left`}
                  </span>
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleEdit(sub)}
              className="w-7 h-7 flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-surface-muted rounded-lg border border-transparent hover:border-app-border transition-all active:scale-95 cursor-pointer"
            >
              <PencilSimple size={14} weight="bold" />
            </button>
            <button
              onClick={() => confirmDelete(sub.id)}
              className="w-7 h-7 flex items-center justify-center text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Trash size={14} weight="bold" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (!isUserLoaded) return null;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <header className="sticky top-0 z-30 bg-app-header backdrop-blur-md border-b border-app-border/60">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { window.location.href = getAppRootUrl(); }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border/60 active:scale-95 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" className="text-[#339AF0]" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
              <CreditCard size={18} weight="fill" className="text-[#339AF0] shrink-0" />
              <span className="truncate">
                SUBCENTER
              </span>
            </h1>

            <button
              onClick={openIssueBill}
              className="w-8 h-8 rounded-lg border border-app-border/60 flex items-center justify-center text-app-muted hover:text-[#339AF0] active:scale-95 bg-app-surface transition-all cursor-pointer"
              aria-label={t("issueBill")}
            >
              <Plus size={14} weight="bold" className="text-[#339AF0]" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-4 pt-4 pb-24">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="w-9 h-9 border-2 border-blue-200 border-t-[#339AF0] rounded-full animate-spin" />
          </div>
        ) : subscriptions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-12"
          >
            <div className="bg-app-surface rounded-2xl border border-app-border shadow-sm px-6 py-10 text-center relative overflow-hidden">
              <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                {emptyStateSamples.map((preset) => (
                  <div
                    key={`${preset.name}-${preset.category}`}
                    className="w-10 h-10 rounded-xl bg-app-surface-muted border border-app-border flex items-center justify-center shadow-sm"
                  >
                    <BrandIcon name={preset.name} icon={preset.icon} size={20} presets={presets} />
                  </div>
                ))}
              </div>

              <h2 className="text-base font-black text-app-text tracking-tight mb-2 uppercase">{t("emptyTitle")}</h2>
              <p className="text-xs font-medium text-app-muted leading-relaxed max-w-xs mx-auto">
                {t("emptyDescription")}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Free Trials */}
            {groupedSubs.trials.length > 0 && (
              <div className="space-y-2.5">
                <p className="px-1 text-[10px] font-black uppercase tracking-widest text-app-muted">
                  {locale === "tr" ? "ÜCRETSİZ DENEMELER" : "FREE TRIALS"} ({groupedSubs.trials.length})
                </p>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {immediateTrials.map(renderSubscriptionCard)}
                    {showAllTrials && longTrials.map(renderSubscriptionCard)}
                  </AnimatePresence>

                  {longTrials.length > 0 && (
                    <button
                      onClick={() => setShowAllTrials(!showAllTrials)}
                      className="w-full mt-2 py-2.5 px-4 rounded-xl border border-app-border bg-app-surface text-app-text hover:bg-app-surface-muted transition-all active:scale-[0.98] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {showAllTrials ? (
                        <>
                          <span>{locale === "tr" ? "Daha Az Göster" : "Show Less"}</span>
                          <CaretDown size={14} className="rotate-180 transition-transform" />
                        </>
                      ) : (
                        <>
                          <span>
                            {locale === "tr"
                              ? `Daha Fazla Göster (${longTrials.length})`
                              : `Show More (${longTrials.length})`}
                          </span>
                          <CaretDown size={14} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Active Subscriptions */}
            {groupedSubs.activeSubs.length > 0 && (
              <div className="space-y-2.5">
                <p className="px-1 text-[10px] font-black uppercase tracking-widest text-app-muted">
                  {locale === "tr" ? "AKTİF ABONELİKLER" : "ACTIVE SUBSCRIPTIONS"} ({groupedSubs.activeSubs.length})
                </p>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {groupedSubs.activeSubs.map(renderSubscriptionCard)}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Vaul Bottom Drawer */}
      <Drawer.Root
        open={showAddModal}
        onOpenChange={(open) => {
          if (!open) closeAddModal();
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-xl flex-col rounded-t-3xl border-t border-app-border bg-app-surface shadow-2xl outline-none overflow-hidden">
            <div className="mx-auto w-10 h-1 rounded-full bg-app-border mt-2 mb-1 shrink-0" />
            
            {/* Header */}
            <div className="px-4 pb-2 flex items-center justify-between shrink-0 border-b border-app-border bg-app-surface z-10 relative">
              <div className="flex items-center gap-3 min-w-0">
                {((addModalStep === "form" && !editingId) || addModalStep === "plan") && (
                  <button
                    onClick={addModalStep === "plan" ? goBackFromPlan : goBackFromForm}
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-app-surface-muted hover:bg-app-surface border border-app-border text-app-muted transition-all cursor-pointer"
                  >
                    <CaretLeft size={14} weight="bold" />
                  </button>
                )}
                <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center text-[#339AF0] border border-blue-500/20">
                  {editingId ? <PencilSimple size={16} weight="bold" /> : <Stack size={16} weight="bold" />}
                </div>
                <Drawer.Title className="text-sm font-black text-app-text uppercase truncate">
                  {editingId
                    ? t("editBill")
                    : addModalStep === "categories"
                      ? t("selectCategory")
                      : addModalStep === "plan"
                        ? t("selectPlan")
                        : t("billDetails")}
                </Drawer.Title>
                <Drawer.Description className="sr-only">
                  Abonelik detayları ve form işlemleri
                </Drawer.Description>
              </div>
              <button onClick={closeAddModal} className="w-8 h-8 shrink-0 flex items-center justify-center hover:bg-app-surface-muted rounded-full text-app-muted cursor-pointer">
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Scrollable Content */}
            {addModalStep === "categories" && !editingId ? (
              <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
                <div className="relative mb-4">
                  <MagnifyingGlass size={16} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted pointer-events-none" />
                  <input
                    type="search"
                    value={brandSearch}
                    onChange={(e) => handleBrandSearchChange(e.target.value)}
                    placeholder={t("brandSearchPlaceholder")}
                    className="w-full bg-app-surface-muted border border-app-border rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-app-text placeholder:text-app-muted focus:outline-none focus:border-[#339AF0] focus:bg-app-surface transition-all"
                  />
                </div>

                <button
                  onClick={startCustomSubscription}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-app-border text-app-text hover:border-[#339AF0] hover:text-[#339AF0] hover:bg-blue-500/10 font-bold text-sm transition-all cursor-pointer mb-6"
                >
                  <Plus size={16} weight="bold" />
                  {t("addCustomSubscription")}
                </button>

                {visibleSections.length === 0 ? (
                  <p className="text-center text-xs font-bold text-app-muted py-8">{t("noBrandsFound")}</p>
                ) : (
                  <div className="space-y-2">
                    {visibleSections.map(({ category, brands }) => {
                      const expanded = expandedCategories.has(category.name);
                      return (
                        <div key={category.id}>
                          <button
                            type="button"
                            onClick={() => toggleCategoryExpanded(category.name)}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 bg-app-surface hover:bg-app-surface-muted transition-colors cursor-pointer text-left sticky top-0 z-20 border border-app-border ${expanded ? "rounded-t-xl border-b-0" : "rounded-xl"}`}
                            style={{ borderLeft: `3px solid ${category.color}` }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CategoryIcon categoryId={category.id} color={category.color} size={18} />
                              <span className="text-xs font-bold text-app-text truncate">{categoryLabel(category.name)}</span>
                              <span className="text-[10px] font-bold text-app-muted shrink-0">({brands.length})</span>
                            </div>
                            <CaretDown
                              size={14}
                              weight="bold"
                              className={`shrink-0 text-app-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                            />
                          </button>
                          <AnimatePresence initial={false}>
                            {expanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden border border-t-0 border-app-border rounded-b-xl mb-2 bg-app-surface"
                              >
                                <div className="p-3 pt-2">
                                  {brands.length === 0 ? (
                                    <p className="text-center text-xs font-bold text-app-muted py-4">{t("noBrandsFound")}</p>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                      {brands.map((brand) => (
                                        <button
                                          key={brand.name}
                                          onClick={() => selectBrand(brand)}
                                          className="flex flex-col items-center justify-center gap-1.5 p-3 min-h-[5.5rem] rounded-xl border border-app-border bg-app-surface-muted/40 hover:bg-app-surface hover:border-app-border hover:shadow-sm transition-all text-center cursor-pointer"
                                        >
                                          <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                                            <BrandIcon name={brand.name} icon={brand.icon} size={24} presets={presets} />
                                          </div>
                                          <p className="text-[10px] font-bold text-app-text leading-tight line-clamp-2">{brand.name}</p>
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
                    })}
                  </div>
                )}
              </div>
            ) : addModalStep === "plan" && !editingId ? (
              <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
                <p className="text-center text-xs font-bold text-app-muted mb-4">{selectedBrandName}</p>
                <div className="space-y-2">
                  {plansForSelectedBrand.map((preset, i) => (
                    <button
                      key={`${preset.planName}-${i}`}
                      onClick={() => selectPlan(preset)}
                      className={`w-full flex items-center justify-between gap-3 p-4 rounded-xl border transition-all cursor-pointer text-left ${newSub.planName === preset.planName
                        ? "bg-app-text border-app-text text-app-surface"
                        : "bg-app-surface-muted border-app-border hover:bg-app-surface hover:border-app-border"
                        }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${newSub.planName === preset.planName ? "text-app-surface" : "text-app-text"}`}>
                          {preset.planName}
                        </p>
                        <p className={`text-[10px] font-medium uppercase tracking-wide ${newSub.planName === preset.planName ? "text-app-muted/80" : "text-app-muted"}`}>
                          {preset.region}
                        </p>
                      </div>
                      <span className={`text-sm font-bold font-mono tabular-nums shrink-0 ${newSub.planName === preset.planName ? "text-app-surface" : "text-app-text"}`}>
                        {formatPriceDisplay(preset.avgPrice, preset.currency)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
                {presets.filter((p) => p.name === newSub.name).length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-app-muted uppercase tracking-wider px-1">{t("quickPlan")}</label>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                      {presets
                        .filter((p) => p.name === newSub.name)
                        .map((p, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              setNewSub({
                                ...newSub,
                                planName: p.planName,
                                price: p.avgPrice,
                                region: p.region,
                                currency: p.currency,
                                category: p.category,
                                color: p.color,
                                icon: p.icon,
                                website: p.domain || "",
                              })
                            }
                            className={`flex-shrink-0 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wide transition-all cursor-pointer ${newSub.planName === p.planName
                              ? "bg-app-text text-app-surface border-app-text"
                              : "bg-app-surface-muted text-app-muted border-app-border hover:border-app-border"
                              }`}
                          >
                            {p.planName}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-app-muted uppercase tracking-wider px-1">{t("category")}</label>
                  <select
                    className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[#339AF0] appearance-none cursor-pointer"
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
                        {categoryLabel(cat.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-app-muted uppercase tracking-wider px-1">{t("service")}</label>
                  <input
                    type="text"
                    placeholder={t("servicePlaceholder")}
                    className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[#339AF0] focus:bg-app-surface transition-all"
                    value={newSub.name}
                    onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-app-muted uppercase tracking-wider px-1">{t("website")}</label>
                  <input
                    type="text"
                    placeholder={t("websitePlaceholder")}
                    className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[#339AF0] focus:bg-app-surface transition-all"
                    value={newSub.website || ""}
                    onChange={(e) => setNewSub({ ...newSub, website: e.target.value })}
                  />
                  <p className="text-[9px] font-bold text-blue-500/80 px-1 mt-0.5">
                    {t("websiteHelp")}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-app-muted uppercase tracking-wider px-1">{t("planLevel")}</label>
                  <input
                    type="text"
                    placeholder={t("planPlaceholder")}
                    className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[#339AF0] focus:bg-app-surface transition-all"
                    value={newSub.planName}
                    onChange={(e) => setNewSub({ ...newSub, planName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-app-muted uppercase tracking-wider px-1">{t("cycle")}</label>
                    <select
                      className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[#339AF0] appearance-none cursor-pointer"
                      value={newSub.cycle}
                      onChange={(e) => setNewSub({ ...newSub, cycle: e.target.value })}
                    >
                      <option value="monthly">{t("monthly")}</option>
                      <option value="yearly">{t("yearly")}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-app-muted uppercase tracking-wider px-1">{t("startDate")}</label>
                    <input
                      type="date"
                      className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[#339AF0] focus:bg-app-surface transition-all cursor-pointer"
                      value={newSub.startDate}
                      onChange={(e) => setNewSub({ ...newSub, startDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-app-muted uppercase tracking-wider px-1">{t("trialDuration")}</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {TRIAL_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setNewSub({ ...newSub, trialDuration: opt.value })}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                          (newSub.trialDuration || null) === opt.value
                            ? "bg-app-text text-app-surface border-app-text"
                            : "bg-app-surface-muted text-app-muted border-app-border hover:border-app-border"
                        }`}
                      >
                        {t(`trialOptions.${opt.label}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-app-muted uppercase tracking-wider px-1">{t("currency")}</label>
                    <select
                      className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-[#339AF0] appearance-none cursor-pointer"
                      value={newSub.currency || "TRY"}
                      onChange={(e) => setNewSub({ ...newSub, currency: e.target.value })}
                    >
                      <option value="TRY">{t("currencyTry")}</option>
                      <option value="USD">{t("currencyUsd")}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-app-muted uppercase tracking-wider px-1">
                      {newSub.currency === "USD" ? t("amountUsd") : t("amount")}
                    </label>
                    <input
                      type="number"
                      placeholder={newSub.currency === "USD" ? t("amountUsdPlaceholder") : t("amountPlaceholder")}
                      className="w-full bg-app-surface-muted border border-app-border rounded-xl px-4 py-3 text-xs font-black font-mono focus:outline-none focus:border-[#339AF0] transition-all"
                      value={newSub.price || ""}
                      onChange={(e) => setNewSub({ ...newSub, price: parseFloat(e.target.value) })}
                    />
                    {!!newSub.price && newSub.price > 0 && newSub.currency === "USD" && (
                      <p className="text-[10px] font-bold font-mono text-app-muted px-1 mt-0.5">
                        {formatPriceDisplay(newSub.price, "USD")}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSaveSubscription}
                  className="w-full bg-app-text hover:bg-[#339AF0] text-app-surface font-black py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                >
                  <CheckCircle size={16} weight="fill" />
                  {editingId ? t("update") : t("saveBill")}
                </button>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
