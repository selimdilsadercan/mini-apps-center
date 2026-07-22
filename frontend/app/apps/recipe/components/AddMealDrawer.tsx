"use client";

import { useEffect, useMemo, useState } from "react";
import { X, ChefHat } from "@phosphor-icons/react";
import type { lib } from "@/lib/client";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { getRecipeEmoji } from "../recipe-emoji";
import CATEGORIES from "../categories.json";

type MealType = "breakfast" | "lunch" | "dinner";
type AddMealTab = "custom" | "recipes";

const RECIPE_CATEGORY_ORDER = ["Kahvaltı", "Tatlı", "Ana Yemek", "Yan Yemek", "Atıştırmalık", "Diğer"];

function suggestedCategory(mealType: MealType): string | null {
  if (mealType === "breakfast") return "Kahvaltı";
  return null;
}

function RecipeInitial({ title }: { title: string }) {
  const emoji = getRecipeEmoji(title);
  if (emoji) {
    return (
      <div className="w-11 h-11 mb-1.5 rounded-xl bg-orange-50/60 border border-orange-100 flex items-center justify-center text-xl select-none">
        {emoji}
      </div>
    );
  }
  const initial = title.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?";
  return (
    <div className="w-11 h-11 mb-1.5 rounded-xl bg-app-surface-muted border border-app-border flex items-center justify-center font-black text-app-muted text-base">
      {initial}
    </div>
  );
}

export default function AddMealDrawer({
  open,
  onOpenChange,
  dayLabel,
  recipes,
  recipesLoading,
  defaultMealType,
  onSelectRecipe,
  onAddCustom,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayLabel: string;
  recipes: lib.RecipeSummary[];
  recipesLoading: boolean;
  defaultMealType?: MealType;
  onSelectRecipe: (recipe: lib.RecipeSummary, mealType: MealType) => void;
  onAddCustom: (title: string, category: string, mealType: MealType) => void;
}) {
  const [activeTab, setActiveTab] = useState<AddMealTab>("recipes");
  const [customTitle, setCustomTitle] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>(defaultMealType ?? "dinner");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      const type = defaultMealType ?? "dinner";
      setMealType(type);
      setCategory(suggestedCategory(type));
    }
  }, [open, defaultMealType]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setCustomTitle("");
      setActiveTab("recipes");
      setCategory(null);
      setMealType(defaultMealType ?? "dinner");
      setSearchQuery("");
    }
    onOpenChange(nextOpen);
  }

  function handleAddCustom() {
    const title = customTitle.trim();
    if (!title || !category) return;
    onAddCustom(title, category, mealType);
    setCustomTitle("");
    setCategory(null);
    handleOpenChange(false);
  }

  function handleSelectRecipe(recipe: lib.RecipeSummary) {
    onSelectRecipe(recipe, mealType);
    handleOpenChange(false);
  }

  const tabClass = (active: boolean) =>
    `flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${
      active ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
    }`;

  const groupedRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? recipes.filter((r) => r.title.toLowerCase().includes(query))
      : recipes;

    const grouped = filtered.reduce<Record<string, lib.RecipeSummary[]>>((acc, recipe) => {
      const cat = recipe.category || "Diğer";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(recipe);
      return acc;
    }, {});

    return Object.keys(grouped)
      .sort((a, b) => {
        const idxA = RECIPE_CATEGORY_ORDER.indexOf(a);
        const idxB = RECIPE_CATEGORY_ORDER.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      })
      .map((catName) => ({ catName, items: grouped[catName] }));
  }, [recipes, searchQuery]);

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-w-xl mx-auto rounded-t-3xl border-t border-app-border bg-app-surface">
        <DrawerHeader className="px-4 pt-2 pb-0 text-left">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base font-black text-app-text uppercase tracking-tight">
              {dayLabel}
            </DrawerTitle>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="w-8 h-8 rounded-full bg-app-surface-muted flex items-center justify-center text-app-muted hover:text-app-text transition-all active:scale-95"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </DrawerHeader>

        <div className="px-4 pt-3">
          <div className="flex gap-1 p-1 rounded-xl bg-app-tab-track">
            <button type="button" onClick={() => setActiveTab("custom")} className={tabClass(activeTab === "custom")}>
              Yemek yaz
            </button>
            <button type="button" onClick={() => setActiveTab("recipes")} className={tabClass(activeTab === "recipes")}>
              Tariflerim
            </button>
          </div>
        </div>

        <div className="px-4 pb-6 pt-3 max-h-[60vh] overflow-y-auto">
          {activeTab === "custom" ? (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-2 block">
                  Yemek adı
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customTitle.trim() && category) handleAddCustom();
                  }}
                  placeholder="Örn: Mercimek çorbası"
                  autoFocus
                  className="w-full px-3 py-2.5 text-sm border border-app-border rounded-xl focus:outline-none focus:border-orange-500/40 bg-app-surface font-bold text-app-text"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-2 block">
                  Kategori <span className="text-orange-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                        category === cat
                          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                          : "bg-app-surface-muted text-app-muted border-app-border hover:border-orange-200 dark:hover:border-orange-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!customTitle.trim() || !category}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wide active:scale-95 transition-all shadow-md shadow-orange-100"
              >
                Ekle
              </button>
            </div>
          ) : recipesLoading ? (
            <p className="text-center text-xs font-bold text-app-muted py-6 uppercase tracking-widest animate-pulse">
              Yükleniyor...
            </p>
          ) : recipes.length === 0 ? (
            <div className="text-center py-6 bg-app-surface-muted rounded-xl border border-app-border">
              <ChefHat size={28} className="text-app-muted mx-auto mb-2" weight="duotone" />
              <p className="text-xs font-bold text-app-muted">Henüz kayıtlı tarif yok</p>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tariflerinde ara..."
                className="w-full px-3 py-2 text-xs border border-app-border rounded-xl focus:outline-none focus:border-orange-500/40 bg-app-surface font-semibold text-app-text mb-2"
              />

              {groupedRecipes.length === 0 ? (
                <p className="text-center text-xs font-bold text-app-muted py-6">
                  Eşleşen tarif bulunamadı
                </p>
              ) : (
                groupedRecipes.map(({ catName, items }) => (
                  <div key={catName} className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-app-muted px-1">
                      {catName} ({items.length})
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {items.map((recipe) => (
                        <button
                          key={recipe.id}
                          type="button"
                          onClick={() => handleSelectRecipe(recipe)}
                          className="bg-app-surface rounded-xl border border-app-border relative flex flex-col items-center justify-center px-2 py-4 hover:border-orange-500/30 hover:shadow-md transition-all shadow-sm overflow-hidden active:scale-95 text-left w-full select-none"
                        >
                          {recipe.image_url ? (
                            <img
                              src={recipe.image_url}
                              alt=""
                              className="w-11 h-11 mb-1.5 rounded-xl object-cover"
                            />
                          ) : (
                            <RecipeInitial title={recipe.title} />
                          )}
                          <h4 className="text-[12px] font-bold text-app-text text-center leading-tight line-clamp-2 px-1">
                            {recipe.title}
                          </h4>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
