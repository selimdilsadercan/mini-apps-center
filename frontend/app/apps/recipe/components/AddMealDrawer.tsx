"use client";

import { useEffect, useState } from "react";
import { X, ChefHat } from "@phosphor-icons/react";
import type { lib } from "@/lib/client";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type MealType = "breakfast" | "lunch" | "dinner";

type AddMealTab = "custom" | "recipes";
const mealTypeLabels: Array<{ value: MealType; label: string }> = [
  { value: "breakfast", label: "Kahvaltı" },
  { value: "lunch", label: "Öğle" },
  { value: "dinner", label: "Akşam" },
];

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
  onAddCustom: (title: string, mealType: MealType) => void;
}) {
  const [activeTab, setActiveTab] = useState<AddMealTab>("recipes");
  const [customTitle, setCustomTitle] = useState("");
  const [mealType, setMealType] = useState<MealType>(defaultMealType ?? "dinner");

  useEffect(() => {
    if (open && defaultMealType) {
      setMealType(defaultMealType);
    }
  }, [open, defaultMealType]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setCustomTitle("");
      setActiveTab("recipes");
      setMealType(defaultMealType ?? "dinner");
    }
    onOpenChange(nextOpen);
  }

  function handleAddCustom() {
    const title = customTitle.trim();
    if (!title) return;
    onAddCustom(title, mealType);
    setCustomTitle("");
    handleOpenChange(false);
  }

  function handleSelectRecipe(recipe: lib.RecipeSummary) {
    onSelectRecipe(recipe, mealType);
    handleOpenChange(false);
  }

  const tabClass = (active: boolean) =>
    `flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${
      active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-w-xl mx-auto rounded-t-3xl border-t border-gray-200/60">
        <DrawerHeader className="px-4 pt-2 pb-0 text-left">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base font-black text-gray-900 uppercase tracking-tight">
              {dayLabel}
            </DrawerTitle>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all active:scale-95"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
          <p className="text-xs font-bold text-gray-400 mt-1">Bu güne yemek ekle</p>
        </DrawerHeader>

        <div className="px-4 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex gap-1 p-1 rounded-xl bg-orange-50">
              {mealTypeLabels.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMealType(item.value)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${
                    mealType === item.value
                      ? "bg-white text-orange-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex gap-1 p-1 rounded-xl bg-gray-100">
              <button type="button" onClick={() => setActiveTab("custom")} className={tabClass(activeTab === "custom")}>
                Yemek yaz
              </button>
              <button type="button" onClick={() => setActiveTab("recipes")} className={tabClass(activeTab === "recipes")}>
                Tariflerim
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pb-6 pt-3 max-h-[60vh] overflow-y-auto">
          {activeTab === "custom" ? (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                Yemek adı
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCustom();
                }}
                placeholder="Örn: Mercimek çorbası"
                autoFocus
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500/40 bg-white mb-3"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!customTitle.trim()}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wide active:scale-95 transition-all"
              >
                Ekle
              </button>
            </div>
          ) : recipesLoading ? (
            <p className="text-center text-xs font-bold text-gray-300 py-6 uppercase tracking-widest animate-pulse">
              Yükleniyor...
            </p>
          ) : recipes.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
              <ChefHat size={28} className="text-gray-200 mx-auto mb-2" weight="duotone" />
              <p className="text-xs font-bold text-gray-400">Henüz kayıtlı tarif yok</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {recipes.map((recipe) => (
                <li key={recipe.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectRecipe(recipe)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/50 transition-all text-left active:scale-[0.99]"
                  >
                    {recipe.image_url ? (
                      <img
                        src={recipe.image_url}
                        alt=""
                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <span className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200/80 flex items-center justify-center font-black text-gray-500 text-sm shrink-0">
                        {recipe.title.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?"}
                      </span>
                    )}
                    <span className="text-sm font-bold text-gray-900 line-clamp-2">{recipe.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
