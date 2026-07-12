"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  ListChecks,
  Plus,
  Trash,
  CaretLeft,
  CaretUp,
  Basket,
  ShareNetwork,
  UserMinus,
  Copy,
  X,
  Check,
  PencilSimple,
  ArrowsClockwise,
  House,
  Cheese,
  Fish,
  Bread,
  Grains,
  JarLabel,
  Carrot,
  Orange,
  Nut,
  Egg,
  Popcorn,
  Coffee,
  BeerBottle,
  Snowflake,
  Jar,
  Pepper,
  Star,
  Baby,
  SprayBottle,
  Shower,
  Notebook,
  Package,
  Cookie,
  ListBullets,
  MagnifyingGlass,
  SquaresFour,
  List,
  WifiSlash,
  CloudArrowUp,
  type Icon,
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { eksik_var } from "@/lib/client";
import toast, { Toaster } from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const client = createBrowserClient();

import COMMON_ITEMS from "./common_items.json";
import { getItemImageUrl, getItemInitial, normalizeItemNameForAdd, formatItemName } from "./item-images";

type CommonItem = {
  name: string;
  category: string;
  slug?: string;
  atlasCategory?: string;
};
type Suggestion = { name: string; category?: string; existingItem?: eksik_var.MissingItem };

const ALL_COMMON_ITEMS: CommonItem[] = COMMON_ITEMS.flatMap((group) =>
  group.items.map((item) => ({
    name: item.name,
    category: group.category,
    slug: item.slug,
    atlasCategory: item.atlasCategory,
  }))
);

const CATEGORY_BY_NAME = new Map(
  ALL_COMMON_ITEMS.map((item) => [item.name.toLocaleLowerCase("tr-TR"), item.category])
);

const CATEGORY_ORDER = [...COMMON_ITEMS.map((group) => group.category), "Diğer"];

const CATEGORY_ICONS: Record<string, Icon> = {
  "Süt Ürünleri": Cheese,
  "Et ve Balık": Fish,
  "Ekmek ve Unlu Mamül": Bread,
  "Bakliyat ve Makarna": Grains,
  "Yağ, Sos ve Salça": JarLabel,
  Sebze: Carrot,
  Meyve: Orange,
  Kuruyemiş: Nut,
  Kahvaltılık: Egg,
  Atıştırmalık: Popcorn,
  "Kahve ve Çay": Coffee,
  İçecek: BeerBottle,
  "Dondurulmuş ve Hazır": Snowflake,
  "Konserve ve Turşu": Jar,
  "Baharat ve Temel Malzeme": Pepper,
  "Tatlı Malzemeleri": Cookie,
  "Özel Ürünler": Star,
  Bebek: Baby,
  Temizlik: SprayBottle,
  "Kişisel Bakım": Shower,
  "Ev ve Kırtasiye": Notebook,
  Diğer: Package,
};

const CATEGORY_SUPER_GROUPS: { title: string; categories: string[] }[] = [
  {
    title: "Gıda",
    categories: [
      "Süt Ürünleri",
      "Et ve Balık",
      "Ekmek ve Unlu Mamül",
      "Bakliyat ve Makarna",
      "Yağ, Sos ve Salça",
      "Sebze",
      "Meyve",
      "Kuruyemiş",
      "Kahvaltılık",
      "Baharat ve Temel Malzeme",
      "Tatlı Malzemeleri",
    ],
  },
  {
    title: "Atıştırma & İçecek",
    categories: ["Atıştırmalık", "Kahve ve Çay", "İçecek"],
  },
  {
    title: "Dolap",
    categories: ["Dondurulmuş ve Hazır", "Konserve ve Turşu"],
  },
  {
    title: "Ev & Kişisel",
    categories: ["Temizlik", "Kişisel Bakım", "Ev ve Kırtasiye", "Bebek"],
  },
  {
    title: "Diğer",
    categories: ["Özel Ürünler", "Diğer"],
  },
];

function getItemCategory(name: string): string {
  return CATEGORY_BY_NAME.get(name.toLocaleLowerCase("tr-TR")) ?? "Diğer";
}

function getDisplayCategory(item: { name: string; category?: string | null }): string {
  return item.category ?? getItemCategory(item.name);
}

function isCustomItemName(name: string): boolean {
  return !CATEGORY_BY_NAME.has(name.toLocaleLowerCase("tr-TR"));
}

function getSuggestionScore(name: string, query: string): number {
  const lower = name.toLocaleLowerCase("tr-TR");
  if (lower === query) return 0;
  if (lower.startsWith(query)) return 100;
  if (lower.split(/\s+/).some((word) => word.startsWith(query))) return 200;
  return 300 + lower.indexOf(query);
}

function sortByRelevance(items: CommonItem[], query: string): CommonItem[] {
  return [...items].sort((a, b) => {
    const scoreDiff = getSuggestionScore(a.name, query) - getSuggestionScore(b.name, query);
    if (scoreDiff !== 0) return scoreDiff;
    return a.name.length - b.name.length;
  });
}

function groupItemsByCategory<T extends { name: string; category?: string | null }>(items: T[]) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const category = getDisplayCategory(item);
    const group = groups.get(category);
    if (group) {
      group.push(item);
    } else {
      groups.set(category, [item]);
    }
  }

  return [...groups.entries()]
    .sort(([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))
    .map(([category, groupItems]) => ({ category, items: groupItems }));
}

function ItemThumbnail({
  name,
  size = "card",
}: {
  name: string;
  size?: "card" | "sheet" | "suggestion";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getItemImageUrl(name);
  const initial = getItemInitial(name);
  const boxClass =
    size === "sheet"
      ? "w-20 h-20 text-2xl"
      : size === "suggestion"
        ? "w-8 h-8 text-xs shrink-0"
        : "w-11 h-11 text-base mb-1.5";
  const roundClass = size === "suggestion" ? "rounded-lg" : "rounded-xl";

  useEffect(() => {
    setImageFailed(false);
  }, [name, imageUrl]);

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        onError={() => setImageFailed(true)}
        className={`${boxClass} object-contain ${roundClass}`}
      />
    );
  }

  return (
    <div
      className={`${boxClass} ${roundClass} bg-gray-100 border border-gray-200/80 flex items-center justify-center font-black text-gray-500`}
    >
      {initial}
    </div>
  );
}

function ListToolbar({
  activeTab,
  onTabChange,
  missingCount,
  homeCount,
  viewMode,
  onViewModeChange,
}: {
  activeTab: "missing" | "home";
  onTabChange: (tab: "missing" | "home") => void;
  missingCount: number;
  homeCount: number;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}) {
  const segmentClass = (active: boolean) =>
    `inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-[0.98] ${active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  const viewSegmentClass = (active: boolean) =>
    `inline-flex items-center justify-center px-2 py-1.5 rounded-lg transition-all active:scale-[0.98] ${active ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
    }`;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100">
        <button type="button" onClick={() => onTabChange("missing")} className={segmentClass(activeTab === "missing")}>
          <Basket size={14} weight={activeTab === "missing" ? "fill" : "duotone"} />
          <span className="uppercase tracking-wide whitespace-nowrap">Eksiklerim</span>
          <span
            className={`tabular-nums ${activeTab === "missing" ? "text-emerald-600" : "text-gray-400"}`}
          >
            {missingCount}
          </span>
        </button>
        <button type="button" onClick={() => onTabChange("home")} className={segmentClass(activeTab === "home")}>
          <House size={14} weight={activeTab === "home" ? "fill" : "duotone"} />
          <span className="uppercase tracking-wide whitespace-nowrap">Evde Var</span>
          <span className={`tabular-nums ${activeTab === "home" ? "text-emerald-600" : "text-gray-400"}`}>
            {homeCount}
          </span>
        </button>
      </div>

      <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100 shrink-0">
        <button
          type="button"
          onClick={() => onViewModeChange("grid")}
          className={viewSegmentClass(viewMode === "grid")}
          aria-label="Izgara görünümü"
        >
          <SquaresFour size={14} weight={viewMode === "grid" ? "fill" : "duotone"} />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("list")}
          className={viewSegmentClass(viewMode === "list")}
          aria-label="Liste görünümü"
        >
          <List size={14} weight={viewMode === "list" ? "fill" : "duotone"} />
        </button>
      </div>
    </div>
  );
}

function ChecklistToggle({ checked }: { checked: boolean }) {
  return (
    <span
      className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-colors ${checked ? "bg-emerald-500 text-white" : "border-2 border-gray-300 bg-white"
        }`}
      aria-hidden
    >
      {checked && <Check size={12} weight="bold" />}
    </span>
  );
}

function ItemsByCategory({
  items,
  viewMode,
  isHomeList,
  onItemTap,
  getLongPressProps,
  registerItemRef,
}: {
  items: eksik_var.MissingItem[];
  viewMode: "grid" | "list";
  isHomeList: boolean;
  onItemTap: (item: eksik_var.MissingItem) => void;
  getLongPressProps: (item: eksik_var.MissingItem) => Record<string, unknown>;
  registerItemRef?: (id: string, el: HTMLDivElement | null) => void;
}) {
  const cardClass =
    "bg-white rounded-xl border border-gray-200/50 group hover:border-emerald-500/30 hover:shadow-md transition-all shadow-sm overflow-hidden active:scale-[0.98] cursor-pointer select-none";

  const groups = groupItemsByCategory(items);

  return (
    <div className="space-y-6">
      {groups.map(({ category, items: categoryItems }) => (
        <div key={category} className="category-group">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {category}
            </span>
            <span className="text-[10px] font-bold text-gray-300">{categoryItems.length}</span>
          </div>

          <div className={viewMode === "grid" ? "grid grid-cols-3 gap-2" : "bg-white rounded-xl border border-gray-200/60 overflow-hidden divide-y divide-gray-100 shadow-sm"}>
            <AnimatePresence initial={false}>
              {categoryItems.map((item) => {
                const isOptimistic = item.id.startsWith("temp-");
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 1.6,
                      y: -50,
                      filter: "blur(20px)",
                      transition: { duration: 0.5, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}
                    ref={(el) => registerItemRef?.(item.id, el as any)}
                    role="button"
                    tabIndex={0}
                    {...getLongPressProps(item)}
                    onClick={() => onItemTap(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onItemTap(item);
                      }
                    }}
                    className={viewMode === "grid" 
                      ? `scroll-mt-28 ${cardClass} relative flex flex-col items-center justify-center px-2 py-4 text-left w-full ${isOptimistic ? "opacity-60" : ""}`
                      : `scroll-mt-28 flex items-center gap-3 px-3 py-3 min-h-[52px] hover:bg-gray-50/80 active:bg-emerald-50/50 transition-colors cursor-pointer select-none text-left w-full ${isOptimistic ? "opacity-60" : ""}`
                    }
                  >
                    {viewMode === "list" && <ChecklistToggle checked={isHomeList} />}
                    <ItemThumbnail name={item.name} size={viewMode === "grid" ? "card" : "suggestion"} />
                    
                    <div className={viewMode === "grid" ? "w-full" : "flex-1 min-w-0"}>
                      <div className={viewMode === "grid" ? "flex flex-col items-center" : "flex items-center gap-1.5"}>
                        <h3 className={viewMode === "grid" 
                          ? "text-[12px] font-bold text-gray-900 text-center leading-tight line-clamp-2 px-1"
                          : "text-sm font-bold text-gray-900 leading-snug line-clamp-2"
                        }>
                          {item.name}
                        </h3>
                        {isOptimistic && viewMode === "list" && (
                          <CloudArrowUp size={12} weight="bold" className="text-emerald-500 animate-pulse shrink-0" />
                        )}
                      </div>
                      {item.notes && (
                        <p className={viewMode === "grid"
                          ? "text-[9px] text-gray-400 text-center line-clamp-1 mt-1 px-1"
                          : "text-[10px] text-gray-400 line-clamp-1"
                        }>
                          {item.notes}
                        </p>
                      )}
                    </div>

                    {viewMode === "grid" && isOptimistic && (
                      <div className="absolute top-1.5 right-1.5 animate-pulse">
                        <CloudArrowUp size={12} weight="bold" className="text-emerald-500" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (category: string) => void;
}) {
  return (
    <div className="max-h-[360px] overflow-y-auto pr-1 space-y-4">
      {CATEGORY_SUPER_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">
            {group.title}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {group.categories.map((category) => {
              const IconComponent = CATEGORY_ICONS[category] ?? Package;
              const isSelected = value === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onChange(category)}
                  className={`flex flex-col items-center justify-center gap-1 min-h-[68px] text-[9px] font-bold leading-tight px-1 py-2 rounded-xl border transition-all active:scale-[0.98] ${isSelected
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-900/10"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-500/30"
                    }`}
                >
                  <IconComponent
                    size={18}
                    weight={isSelected ? "fill" : "duotone"}
                    className={isSelected ? "text-white" : "text-emerald-600"}
                  />
                  <span className="text-center line-clamp-2">{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const MOVE_TOAST_DURATION_MS = 3000;
const MOVE_TOAST_MAX_VISIBLE = 2;
const MOVE_TOASTER_ID = "eksik-var-moves";
const moveToastQueue: string[] = [];

function showItemMovedToast(
  name: string,
  isNowAtHome: boolean,
  onUndo: () => void
) {
  while (moveToastQueue.length >= MOVE_TOAST_MAX_VISIBLE) {
    const oldest = moveToastQueue.shift();
    if (oldest) {
      toast.dismiss(oldest, MOVE_TOASTER_ID);
      toast.remove(oldest, MOVE_TOASTER_ID);
    }
  }

  const id = toast.custom(
    (t) => (
      <div
        className={`${t.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          } flex items-center gap-3 bg-gray-900 text-white text-sm font-bold px-4 py-3 rounded-2xl shadow-xl max-w-[min(calc(100vw-2rem),24rem)] transition-all duration-200`}
      >
        <span className="flex-1 min-w-0 leading-snug">
          <span className="text-white">{name}</span>
          <span className="text-gray-300 font-semibold">
            {isNowAtHome ? " evde vara taşındı" : " eksiklere geri alındı"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => {
            const index = moveToastQueue.indexOf(t.id);
            if (index >= 0) moveToastQueue.splice(index, 1);
            toast.dismiss(t.id, MOVE_TOASTER_ID);
            onUndo();
          }}
          className="shrink-0 text-emerald-400 font-black text-xs uppercase tracking-wide hover:text-emerald-300 active:scale-95 transition-all"
        >
          Geri Al
        </button>
      </div>
    ),
    {
      duration: MOVE_TOAST_DURATION_MS,
      position: "bottom-center",
      toasterId: MOVE_TOASTER_ID,
    }
  );

  moveToastQueue.push(id);
  window.setTimeout(() => {
    const index = moveToastQueue.indexOf(id);
    if (index >= 0) moveToastQueue.splice(index, 1);
  }, MOVE_TOAST_DURATION_MS + 400);
}

export default function EksikVarPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const queryClient = useQueryClient();

  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["eksik-var", "items", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await client.eksik_var.getItems(user.id);
      return response.items || [];
    },
    enabled: !!user,
  });

  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  // Sharing states
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showCatalogSheet, setShowCatalogSheet] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [sharedMembers, setSharedMembers] = useState<eksik_var.SharedMember[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingShareData, setLoadingShareData] = useState(false);
  const [copied, setCopied] = useState(false);

  const [editingItem, setEditingItem] = useState<eksik_var.MissingItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [pendingCustomName, setPendingCustomName] = useState<string | null>(null);
  const [selectedAddCategory, setSelectedAddCategory] = useState<string | null>(null);
  const [selectedAddNotes, setSelectedAddNotes] = useState("");
  const [scrollToItemId, setScrollToItemId] = useState<string | null>(null);
  const [activeListTab, setActiveListTab] = useState<"missing" | "home">("missing");
  const [listViewMode, setListViewMode] = useState<"grid" | "list">("grid");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Mutations
  const addItemMutation = useMutation({
    mutationFn: async (vars: { name: string; category?: string; notes?: string }) => {
      if (!user) throw new Error("No user");
      const res = await client.eksik_var.addItem({
        userId: user.id,
        name: vars.name,
        category: vars.category,
        notes: vars.notes,
      });
      return res.item;
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ["eksik-var", "items", user?.id] });
      const previousItems = queryClient.getQueryData<eksik_var.MissingItem[]>(["eksik-var", "items", user?.id]);
      const optimisticItem: eksik_var.MissingItem = {
        id: `temp-${Date.now()}`,
        user_id: user?.id || "",
        name: newItem.name,
        category: newItem.category || null,
        notes: newItem.notes || null,
        is_used: activeListTab === "home",
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData(["eksik-var", "items", user?.id], (old: any) => [optimisticItem, ...(old || [])]);
      return { previousItems };
    },
    onError: (err, newItem, context) => {
      queryClient.setQueryData(["eksik-var", "items", user?.id], context?.previousItems);
      toast.error("Ürün eklenemedi.");
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: ["eksik-var", "items", user?.id] });
      if (data) setScrollToItemId(data.id);
    },
  });

  const toggleUsedMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("No user");
      const res = await client.eksik_var.toggleItemUsed(id, { userId: user.id });
      return res.item;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["eksik-var", "items", user?.id] });
      const previousItems = queryClient.getQueryData<eksik_var.MissingItem[]>(["eksik-var", "items", user?.id]);
      const item = previousItems?.find((i) => i.id === id);
      if (item) {
        queryClient.setQueryData(["eksik-var", "items", user?.id], (old: any) =>
          old?.map((i: any) => (i.id === id ? { ...i, is_used: !i.is_used } : i))
        );
      }
      return { previousItems, item };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(["eksik-var", "items", user?.id], context?.previousItems);
      toast.error("İşlem başarısız.");
    },
    onSuccess: (data, id, context) => {
      if (data) {
        showItemMovedToast(data.name, data.is_used, () => {
          toggleUsedMutation.mutate(id);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["eksik-var", "items", user?.id] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("No user");
      return await client.eksik_var.deleteItem(id, { userId: user.id });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["eksik-var", "items", user?.id] });
      const previousItems = queryClient.getQueryData<eksik_var.MissingItem[]>(["eksik-var", "items", user?.id]);
      queryClient.setQueryData(["eksik-var", "items", user?.id], (old: any) =>
        old?.filter((i: any) => i.id !== id)
      );
      return { previousItems };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(["eksik-var", "items", user?.id], context?.previousItems);
      toast.error("Silme işlemi başarısız.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["eksik-var", "items", user?.id] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (vars: { id: string; name?: string; category?: string; notes?: string }) => {
      if (!user) throw new Error("No user");
      const res = await client.eksik_var.updateItem(vars.id, {
        userId: user.id,
        name: vars.name,
        category: vars.category,
        notes: vars.notes,
      });
      return res.item;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["eksik-var", "items", user?.id] });
      const previousItems = queryClient.getQueryData<eksik_var.MissingItem[]>(["eksik-var", "items", user?.id]);
      queryClient.setQueryData(["eksik-var", "items", user?.id], (old: any) =>
        old?.map((i: any) => (i.id === vars.id ? { ...i, ...vars } : i))
      );
      return { previousItems };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(["eksik-var", "items", user?.id], context?.previousItems);
      toast.error("Güncelleme başarısız.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["eksik-var", "items", user?.id] });
    },
  });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const totalCatalogItems = useMemo(
    () => COMMON_ITEMS.reduce((sum, group) => sum + group.items.length, 0),
    []
  );

  const filteredCatalog = useMemo(() => {
    const query = catalogQuery.trim().toLocaleLowerCase("tr-TR");
    if (!query) return COMMON_ITEMS;

    return COMMON_ITEMS.map((group) => ({
      category: group.category,
      items: group.items.filter(
        (item) =>
          item.name.toLocaleLowerCase("tr-TR").includes(query) ||
          group.category.toLocaleLowerCase("tr-TR").includes(query)
      ),
    })).filter((group) => group.items.length > 0);
  }, [catalogQuery]);

  const closeCatalogSheet = () => {
    setShowCatalogSheet(false);
    setCatalogQuery("");
  };

  const isInActiveList = (name: string) =>
    items.some(
      (item) =>
        !item.is_used &&
        item.name.toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR")
    );

  const handleCatalogItemTap = (name: string) => {
    if (isInActiveList(name)) return;
    handleAddItem(name);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showShareSheet && user) {
      fetchShareData();
    }
  }, [showShareSheet, user]);

  useEffect(() => {
    if (!scrollToItemId) return;

    const timer = window.setTimeout(() => {
      const el = itemRefs.current.get(scrollToItemId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setScrollToItemId(null);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [scrollToItemId, items]);

  const fetchShareData = async () => {
    if (!user) return;
    try {
      setLoadingShareData(true);
      const membersRes = await client.eksik_var.getSharedMembers(user.id);
      setSharedMembers(membersRes.members || []);

      const friendsRes = await client.friendship.getFriends(user.id);
      setFriends(friendsRes.friends || []);
    } catch (error) {
      console.error("fetchShareData error:", error);
    } finally {
      setLoadingShareData(false);
    }
  };

  const handleShareWithFriend = async (friendUserId: string) => {
    if (!user) return;
    try {
      await client.eksik_var.shareWithFriend({
        userId: user.id,
        friendUserId: friendUserId,
      });
      fetchShareData();
    } catch (error) {
      console.error("handleShareWithFriend error:", error);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!user) return;
    try {
      await client.eksik_var.removeSharedMember({
        userId: user.id,
        targetUserId: targetUserId,
      });
      fetchShareData();
    } catch (error) {
      console.error("handleRemoveMember error:", error);
    }
  };

  const handleCreateInvite = async () => {
    if (!user) return;
    try {
      const res = await client.eksik_var.createShareInvite({ userId: user.id });
      if (res.inviteId) {
        const inviteUrl = `${window.location.origin}/apps/eksik-var/s?t=${res.inviteId}`;
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("handleCreateInvite error:", error);
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setSuggestions([]);
      setSelectedSuggestionIndex(0);
      return;
    }
    const query = trimmed.toLocaleLowerCase("tr-TR");

    // 1. Get matching items from user's list (both active and used)
    const userMatches = items
      .filter((item) => item.name.toLocaleLowerCase("tr-TR").includes(query))
      .map((item) => ({
        name: item.name,
        category: getDisplayCategory(item),
        existingItem: item,
      }));

    // 2. Get matching items from ALL_COMMON_ITEMS
    const commonMatches = ALL_COMMON_ITEMS.filter((item) =>
      item.name.toLocaleLowerCase("tr-TR").includes(query)
    );

    // 3. Merge them, keeping user matches as priority (they have existingItem)
    const mergedMap = new Map<string, Suggestion>();
    for (const match of userMatches) {
      mergedMap.set(match.name.toLocaleLowerCase("tr-TR"), match);
    }
    for (const match of commonMatches) {
      const key = match.name.toLocaleLowerCase("tr-TR");
      if (!mergedMap.has(key)) {
        mergedMap.set(key, match);
      }
    }

    const merged = Array.from(mergedMap.values());
    const sorted = sortByRelevance(merged as CommonItem[], query);
    const hasExactMatch =
      sorted.length > 0 && sorted[0].name.toLocaleLowerCase("tr-TR") === query;

    // Check if the trimmed input matches any existing item in user's list
    const exactExisting = items.find(
      (item) => item.name.toLocaleLowerCase("tr-TR") === query
    );

    setSuggestions(
      hasExactMatch
        ? (sorted as Suggestion[]).slice(0, 5)
        : [
          {
            name: formatItemName(trimmed),
            category: exactExisting ? getDisplayCategory(exactExisting) : undefined,
            existingItem: exactExisting,
          },
          ...(sorted as Suggestion[]).slice(0, 4),
        ]
    );
    setSelectedSuggestionIndex(0);
    setShowSuggestions(true);
  };

  const getActiveSuggestionName = () => {
    if (showSuggestions && suggestions.length > 0) {
      return suggestions[selectedSuggestionIndex]?.name ?? inputValue;
    }
    return inputValue;
  };

  const handleSelectExistingItem = (existingItem: eksik_var.MissingItem) => {
    setActiveListTab(existingItem.is_used ? "home" : "missing");
    setScrollToItemId(existingItem.id);
    setInputValue("");
    setShowSuggestions(false);
  };

  const handleAddItem = async (nameToAdd: string, categoryOverride?: string, notesOverride?: string) => {
    const normalized = normalizeItemNameForAdd(nameToAdd);
    if (!normalized) return;
    if (!user) return;

    if (
      items.some(
        (item) =>
          !item.is_used &&
          item.name.toLocaleLowerCase("tr-TR") === normalized.toLocaleLowerCase("tr-TR")
      )
    ) {
      return;
    }

    const isCustom = isCustomItemName(normalized);
    if (isCustom && !categoryOverride) {
      setPendingCustomName(normalized);
      setSelectedAddCategory(null);
      setSelectedAddNotes("");
      setCategoryModalOpen(true);
      setShowSuggestions(false);
      return;
    }

    addItemMutation.mutate({
      name: normalized,
      category: categoryOverride,
      notes: notesOverride,
    });

    setInputValue("");
    setSuggestions([]);
    setSelectedSuggestionIndex(0);
    setShowSuggestions(false);
    setCategoryModalOpen(false);
    setPendingCustomName(null);
    setSelectedAddCategory(null);
    setSelectedAddNotes("");
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    setPendingCustomName(null);
    setSelectedAddCategory(null);
    setSelectedAddNotes("");
  };

  const handleConfirmCategoryAdd = async () => {
    if (!pendingCustomName || !selectedAddCategory) return;
    handleAddItem(pendingCustomName, selectedAddCategory, selectedAddNotes);
  };

  const handleDeleteItem = async (id: string) => {
    if (!user) return;
    deleteItemMutation.mutate(id);
  };

  const handleToggleUsed = async (id: string) => {
    if (!user) return;
    toggleUsedMutation.mutate(id);
  };

  const openEditSheet = (item: eksik_var.MissingItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(getDisplayCategory(item));
    setEditNotes(item.notes || "");
  };

  const closeEditSheet = () => {
    setEditingItem(null);
    setEditName("");
    setEditCategory(null);
    setEditNotes("");
  };

  const startLongPress = (item: eksik_var.MissingItem) => {
    longPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      openEditSheet(item);
      navigator.vibrate?.(40);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleItemTap = (item: eksik_var.MissingItem) => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    handleToggleUsed(item.id);
  };

  const getLongPressProps = (item: eksik_var.MissingItem) => ({
    onTouchStart: () => startLongPress(item),
    onTouchEnd: cancelLongPress,
    onTouchMove: cancelLongPress,
    onTouchCancel: cancelLongPress,
    onMouseDown: () => startLongPress(item),
    onMouseUp: cancelLongPress,
    onMouseLeave: cancelLongPress,
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      openEditSheet(item);
    },
  });

  const handleSaveEdit = async () => {
    if (!user || !editingItem) return;
    const normalized = normalizeItemNameForAdd(editName);
    if (!normalized) return;

    const nameChanged =
      normalized.toLocaleLowerCase("tr-TR") !== editingItem.name.toLocaleLowerCase("tr-TR");
    const categoryChanged =
      editCategory !== null && editCategory !== (editingItem.category ?? getItemCategory(editingItem.name));
    const notesChanged = editNotes !== (editingItem.notes || "");
    const isCustom = isCustomItemName(normalized) || !!editingItem.category;

    if (
      nameChanged &&
      items.some(
        (item) =>
          item.id !== editingItem.id &&
          !item.is_used &&
          item.name.toLocaleLowerCase("tr-TR") === normalized.toLocaleLowerCase("tr-TR")
      )
    ) {
      return;
    }

    if (!nameChanged && !(isCustom && categoryChanged) && !notesChanged) {
      closeEditSheet();
      return;
    }

    updateItemMutation.mutate({
      id: editingItem.id,
      ...(nameChanged ? { name: normalized } : {}),
      ...(isCustom && categoryChanged && editCategory ? { category: editCategory } : {}),
      ...(notesChanged ? { notes: editNotes } : {}),
    });
    closeEditSheet();
  };

  const handleEditToggle = async () => {
    if (!editingItem) return;
    handleToggleUsed(editingItem.id);
    closeEditSheet();
  };

  const handleEditDelete = async () => {
    if (!editingItem) return;
    handleDeleteItem(editingItem.id);
    closeEditSheet();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 selection:bg-emerald-100">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.href = getAppRootUrl()}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-emerald-500" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
              <ListChecks size={18} weight="fill" className="text-emerald-500 shrink-0" />
              <span className="truncate">
                Eksik <span className="text-emerald-500">Var</span>
              </span>
              {!isOnline && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                  <WifiSlash size={10} weight="bold" />
                  <span className="text-[8px] font-black uppercase tracking-wider">Çevrimdışı</span>
                </div>
              )}
            </h1>

            {user && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setShowCatalogSheet(true)}
                  className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
                  title="Ürün Listesi"
                >
                  <ListBullets size={16} weight="bold" />
                </button>
                <button
                  onClick={() => setShowShareSheet(true)}
                  className="flex items-center justify-center w-8 h-8 text-emerald-500 hover:bg-emerald-50 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
                  title="Listeyi Paylaş"
                >
                  <ShareNetwork size={16} weight="bold" />
                </button>
              </div>
            )}
          </div>

          {/* Tabs & Toolbar */}
          {user && (
            <ListToolbar
              activeTab={activeListTab}
              onTabChange={setActiveListTab}
              missingCount={items.filter((i) => !i.is_used).length}
              homeCount={items.filter((i) => i.is_used).length}
              viewMode={listViewMode}
              onViewModeChange={setListViewMode}
            />
          )}

          {/* Input & Autocomplete */}
          {user && (
            <div className="relative" ref={suggestionsRef}>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (showSuggestions && suggestions.length > 0) {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSelectedSuggestionIndex((index) =>
                          Math.min(index + 1, suggestions.length - 1)
                        );
                        return;
                      }
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSelectedSuggestionIndex((index) => Math.max(index - 1, 0));
                        return;
                      }
                      if (e.key === "Escape") {
                        setShowSuggestions(false);
                        return;
                      }
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddItem(getActiveSuggestionName());
                    }
                  }}
                  onFocus={() => {
                    if (inputValue.trim()) setShowSuggestions(true);
                  }}
                  placeholder={
                    activeListTab === "home"
                      ? "Evde olan bir ürün yazın..."
                      : "Eksik ürün yazın..."
                  }
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500/40 outline-none transition-all placeholder:text-gray-400 text-gray-900"
                />
                <button
                  onClick={() => handleAddItem(getActiveSuggestionName())}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all shrink-0"
                >
                  <Plus size={18} weight="bold" />
                </button>
              </div>

              {/* Autocomplete suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[2.75rem] bg-white border border-gray-200/50 rounded-xl shadow-lg overflow-hidden z-30">
                  <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Öneriler
                  </div>
                  {suggestions.map((item, index) => {
                    const isSelected = index === selectedSuggestionIndex;
                    const existingItem = item.existingItem || items.find(
                      (i) => i.name.toLocaleLowerCase("tr-TR") === item.name.toLocaleLowerCase("tr-TR")
                    );
                    return (
                      <div
                        key={`${item.name}-${item.category ?? index}`}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        onClick={() => {
                          if (existingItem) {
                            handleSelectExistingItem(existingItem);
                          } else {
                            handleAddItem(item.name);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (existingItem) {
                              handleSelectExistingItem(existingItem);
                            } else {
                              handleAddItem(item.name);
                            }
                          }
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-all flex items-center gap-3 border-b border-gray-50 last:border-b-0 cursor-pointer ${isSelected
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-emerald-600"
                          }`}
                      >
                        <ItemThumbnail name={item.name} size="suggestion" />
                        <span className="min-w-0 truncate flex-1">{item.name}</span>
                        {existingItem ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectExistingItem(existingItem);
                            }}
                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shrink-0 transition-colors active:scale-95"
                          >
                            Var
                          </button>
                        ) : item.category ? (
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${isSelected ? "text-emerald-400" : "text-gray-300"
                              }`}
                          >
                            {item.category}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-32 max-w-xl mx-auto w-full">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            Yükleniyor...
          </div>
        ) : !user ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/50 flex flex-col items-center justify-center p-6 shadow-sm">
            <Basket size={40} className="text-gray-200 mb-4" />
            <p className="text-sm font-bold text-gray-400">Eksik listeni görebilmek için giriş yapmalısın.</p>
          </div>
        ) : user ? (() => {
          const filteredItems = items.filter(i => activeListTab === "missing" ? !i.is_used : i.is_used);
          const isEmpty = filteredItems.length === 0;

          return (
            <div className="relative">
              {isEmpty ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
                  {activeListTab === "missing" ? (
                    <>
                      <Basket size={32} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-400">Alışveriş listene eklenecek ürün yok.</p>
                    </>
                  ) : (
                    <>
                      <House size={32} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-400">Evde olan ürünler burada görünür.</p>
                    </>
                  )}
                </div>
              ) : (
                <ItemsByCategory
                  key={activeListTab}
                  items={filteredItems}
                  viewMode={listViewMode}
                  isHomeList={activeListTab === "home"}
                  onItemTap={(item) => handleItemTap(item)}
                  getLongPressProps={getLongPressProps}
                  registerItemRef={(id, el) => {
                    if (el) itemRefs.current.set(id, el);
                    else itemRefs.current.delete(id);
                  }}
                />
              )}
            </div>
          );
        })() : null}
      </main>

      {/* Category Picker Modal (custom items) */}
      {categoryModalOpen && pendingCustomName && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            onClick={closeCategoryModal}
          />

          <div className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white rounded-t-3xl border-t border-gray-200/60 z-50 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                Kategori Seç
              </h2>
              <button
                onClick={closeCategoryModal}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all active:scale-95"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <ItemThumbnail name={pendingCustomName} size="suggestion" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                    Yeni ürün
                  </p>
                  <p className="text-sm font-black text-gray-900 truncate">{pendingCustomName}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                  Hangi kategoride?
                </label>
                <CategoryPicker
                  value={selectedAddCategory}
                  onChange={setSelectedAddCategory}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                  Notlar (Opsiyonel)
                </label>
                <textarea
                  value={selectedAddNotes}
                  onChange={(e) => setSelectedAddNotes(e.target.value)}
                  placeholder="Ürün hakkında not ekleyin..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:border-emerald-500/40 outline-none transition-all min-h-[80px] resize-none"
                />
              </div>

              <button
                onClick={handleConfirmCategoryAdd}
                disabled={addItemMutation.isPending || !selectedAddCategory}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-emerald-900/10"
              >
                <Plus size={16} weight="bold" />
                {addItemMutation.isPending ? "Ekleniyor..." : "Listeye Ekle"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Bottom Sheet */}
      {editingItem && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            onClick={closeEditSheet}
          />

          <div className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white rounded-t-3xl border-t border-gray-200/60 z-50 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                <PencilSimple size={20} className="text-emerald-500" />
                Ürünü Düzenle
              </h2>
              <button
                onClick={closeEditSheet}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all active:scale-95"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center">
                <ItemThumbnail
                  name={editName.trim() || editingItem.name}
                  size="sheet"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Ürün Adı
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:border-emerald-500/40 outline-none transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                  Notlar
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ürün hakkında not ekleyin..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:border-emerald-500/40 outline-none transition-all min-h-[80px] resize-none"
                />
              </div>

              {(isCustomItemName(editName.trim() || editingItem.name) || editingItem.category) ? (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                    Kategori
                  </label>
                  <CategoryPicker
                    value={editCategory}
                    onChange={setEditCategory}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Kategori
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    {getItemCategory(editName.trim() || editingItem.name)}
                  </span>
                </div>
              )}

              <button
                onClick={handleSaveEdit}
                disabled={updateItemMutation.isPending || !editName.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-emerald-900/10"
              >
                <Check size={16} weight="bold" />
                {updateItemMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </button>

              <button
                onClick={handleEditToggle}
                className="w-full bg-white border border-gray-200 hover:border-emerald-500/30 text-gray-700 font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <ArrowsClockwise size={16} weight="bold" className="text-emerald-500" />
                {editingItem.is_used ? "Eksiklere Geri Al" : "Evde Var Olarak İşaretle"}
              </button>

              <button
                onClick={handleEditDelete}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Trash size={16} weight="bold" />
                Listeden Sil
              </button>
            </div>
          </div>
        </>
      )}

      {/* Catalog Bottom Sheet */}
      {showCatalogSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            onClick={closeCatalogSheet}
          />

          <div className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white rounded-t-3xl border-t border-gray-200/60 z-50 p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                  <ListBullets size={20} className="text-emerald-500" />
                  Ürün Listesi
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                  {totalCatalogItems} ürün · {COMMON_ITEMS.length} kategori
                </p>
              </div>
              <button
                onClick={closeCatalogSheet}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all active:scale-95"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="relative mb-4 shrink-0">
              <MagnifyingGlass
                size={16}
                weight="bold"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
              />
              <input
                type="text"
                value={catalogQuery}
                onChange={(e) => setCatalogQuery(e.target.value)}
                placeholder="Ürün veya kategori ara..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:border-emerald-500/40 outline-none transition-all placeholder:text-gray-400 text-gray-900"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-5">
              {filteredCatalog.length === 0 ? (
                <p className="text-center text-xs font-bold text-gray-400 py-8">
                  Aramanla eşleşen ürün bulunamadı.
                </p>
              ) : (
                filteredCatalog.map((group) => {
                  const CategoryIcon = CATEGORY_ICONS[group.category] ?? Package;

                  return (
                    <div key={group.category}>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <CategoryIcon size={14} weight="duotone" className="text-emerald-600 shrink-0" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {group.category}
                        </span>
                        <span className="text-[10px] font-bold text-gray-300 ml-auto">
                          {group.items.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {group.items.map((item) => {
                          const alreadyAdded = isInActiveList(item.name);

                          return (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => handleCatalogItemTap(item.name)}
                              disabled={alreadyAdded}
                              className={`rounded-xl border relative flex flex-col items-center justify-center px-2 py-3 transition-all text-left w-full ${alreadyAdded
                                  ? "bg-emerald-50/60 border-emerald-200/60 opacity-70 cursor-default"
                                  : "bg-gray-50 border-gray-200/80 hover:border-emerald-500/30 active:scale-95"
                                }`}
                            >
                              {alreadyAdded && (
                                <Check
                                  size={12}
                                  weight="bold"
                                  className="absolute top-1.5 right-1.5 text-emerald-500"
                                />
                              )}
                              <ItemThumbnail name={item.name} size="suggestion" />
                              <span className="text-[10px] font-bold text-gray-800 text-center leading-tight line-clamp-2 mt-1.5">
                                {item.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Share Bottom Sheet */}
      {showShareSheet && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            onClick={() => setShowShareSheet(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-white rounded-t-3xl border-t border-gray-200/60 z-50 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                <ShareNetwork size={20} className="text-emerald-500" />
                Listeyi Paylaş
              </h2>
              <button
                onClick={() => setShowShareSheet(false)}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all active:scale-95"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Invite Link Section */}
            <div className="mb-6 bg-emerald-50/40 rounded-2xl p-4 border border-emerald-500/10">
              <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-1.5">Davet Linki</h3>
              <p className="text-xs text-emerald-600/80 mb-3 leading-relaxed">
                Bu linki gönderdiğin kişiler alışveriş listene ortak olabilir, yeni ürün ekleyip silebilirler.
              </p>
              <button
                onClick={handleCreateInvite}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-emerald-900/10"
              >
                {copied ? (
                  <>
                    <Check size={14} weight="bold" />
                    <span>Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} weight="bold" />
                    <span>Davet Linkini Kopyala</span>
                  </>
                )}
              </button>
            </div>

            {/* Loading state for sharing data */}
            {loadingShareData ? (
              <div className="text-center py-8 text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                Yükleniyor...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Shared Members List */}
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Ortak Üyeler</h3>
                  {sharedMembers.length === 0 ? (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl text-center border border-dashed border-gray-200">
                      Bu listeyi henüz kimseyle paylaşmadın.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sharedMembers.map((member) => (
                        <div
                          key={member.member_id}
                          className="flex items-center justify-between p-3 bg-gray-50/60 rounded-xl border border-gray-100"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.username || ""}
                                className="w-7 h-7 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px] font-black uppercase">
                                {member.username?.slice(0, 2) || "Ü"}
                              </div>
                            )}
                            <span className="text-xs font-bold text-gray-800 truncate">
                              @{member.username || "Kullanıcı"}
                            </span>
                            {member.is_owner && (
                              <span className="bg-gray-200 text-gray-600 text-[8px] font-black px-1.5 py-0.5 rounded leading-none">
                                Sahibi
                              </span>
                            )}
                          </div>

                          {!member.is_owner && (
                            <button
                              onClick={() => handleRemoveMember(member.member_id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                              title="Paylaşımı Sonlandır"
                            >
                              <UserMinus size={14} weight="bold" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Share with Friends */}
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">Arkadaşlarından Ekle</h3>
                  {friends.length === 0 ? (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl text-center border border-dashed border-gray-200">
                      Arkadaş listen boş.
                    </p>
                  ) : (
                    (() => {
                      // Filter out friends who are already shared members
                      const unsharedFriends = friends.filter(
                        (friend) => !sharedMembers.some((m) => m.member_id === friend.id)
                      );

                      if (unsharedFriends.length === 0) {
                        return (
                          <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl text-center border border-dashed border-gray-200">
                            Tüm arkadaşların listene zaten ortak.
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {unsharedFriends.map((friend) => (
                            <div
                              key={friend.id}
                              className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-150"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {friend.avatar ? (
                                  <img
                                    src={friend.avatar}
                                    alt={friend.username || ""}
                                    className="w-7 h-7 rounded-full object-cover border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-[10px] font-black uppercase">
                                    {friend.username?.slice(0, 2) || "A"}
                                  </div>
                                )}
                                <span className="text-xs font-bold text-gray-800 truncate">
                                  @{friend.username || "Arkadaş"}
                                </span>
                              </div>

                              <button
                                onClick={() => handleShareWithFriend(friend.id)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
                              >
                                Paylaş
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 duration-200 border border-emerald-400"
          aria-label="Yukarı git"
        >
          <CaretUp size={24} weight="bold" />
        </button>
      )}

      <Toaster
        toasterId={MOVE_TOASTER_ID}
        position="bottom-center"
        containerStyle={{ bottom: 16 }}
        gutter={8}
        reverseOrder={false}
        toastOptions={{
          className: "!bg-transparent !shadow-none !p-0",
          duration: MOVE_TOAST_DURATION_MS,
          custom: { duration: MOVE_TOAST_DURATION_MS },
        }}
      />
    </div>
  );
}
