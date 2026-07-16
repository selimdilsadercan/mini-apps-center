"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import { useUser } from "@clerk/clerk-react";
import type { lib } from "@/lib/client";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  getMealPlanAction,
  getOrCreateUserAction,
  getUserRecipesAction,
  setMealPlanAction,
} from "../actions";
import { createRecipe } from "../create/actions";
import RecipeShell from "../components/RecipeShell";
import AddMealDrawer from "../components/AddMealDrawer";
import { getRecipeEmoji } from "../recipe-emoji";

type MealType = "breakfast" | "lunch" | "dinner";
type ViewMode = "daily" | "weekly";

type PlanMeal = {
  id: string;
  title: string;
  recipeId?: string;
  mealType: MealType;
};

type PlanData = Record<string, PlanMeal[]>;

type WeekDay = {
  name: string;
  shortName: string;
  date: number;
  fullDate: Date;
  key: string;
  meals: PlanMeal[];
};

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function createMealId(): string {
  return crypto.randomUUID();
}

function mealInitial(title: string): string {
  return title.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?";
}

const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const dayNamesShort = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const mealTypeSections: Array<{ type: MealType; label: string; shortLabel: string }> = [
  { type: "breakfast", label: "Kahvaltı", shortLabel: "Kah" },
  { type: "lunch", label: "Öğle", shortLabel: "Öğ" },
  { type: "dinner", label: "Akşam", shortLabel: "Akş" },
];

function startOfWeekMonday(date: Date) {
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(date.getDate() + diff);
  return monday;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default function PlanPage() {
  const { user, isLoaded } = useUser();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateKey(today);

  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [selectedDayKey, setSelectedDayKey] = useState(todayKey);
  const [planData, setPlanData] = useState<PlanData>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDayKey, setDrawerDayKey] = useState<string | null>(null);
  const [drawerDayLabel, setDrawerDayLabel] = useState("");
  const [drawerMealType, setDrawerMealType] = useState<MealType | null>(null);
  const [recipes, setRecipes] = useState<lib.RecipeSummary[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<{ dayKey: string; meal: PlanMeal } | null>(null);
  const [mealSheetOpen, setMealSheetOpen] = useState(false);
  const [isEditingMeal, setIsEditingMeal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editMealType, setEditMealType] = useState<MealType>("dinner");
  const [pageLoading, setPageLoading] = useState(true);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef(false);
  const pendingSaveRef = useRef<PlanData | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const clerkId = user.id;

    async function loadInitialData() {
      try {
        setPageLoading(true);
        const userResult = await getOrCreateUserAction(clerkId);
        if (!userResult.data?.id) return;

        setDbUserId(userResult.data.id);
        const mealPlanResult = await getMealPlanAction(userResult.data.id);
        if (mealPlanResult.data) {
          setPlanData(mealPlanResult.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setPageLoading(false);
      }
    }

    loadInitialData();
  }, [isLoaded, user]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    async function loadRecipes() {
      try {
        setRecipesLoading(true);
        const userResult = await getOrCreateUserAction(user!.id);
        if (!userResult.data) return;
        const recipesResult = await getUserRecipesAction(userResult.data.id);
        setRecipes(recipesResult.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setRecipesLoading(false);
      }
    }

    loadRecipes();
  }, [isLoaded, user]);

  const recipesById = recipes.reduce<Record<string, lib.RecipeSummary>>((acc, recipe) => {
    acc[recipe.id] = recipe;
    return acc;
  }, {});

  const weekDays: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    date.setHours(0, 0, 0, 0);
    const key = dateKey(date);
    return {
      name: dayNames[i],
      shortName: dayNamesShort[i],
      date: date.getDate(),
      fullDate: date,
      key,
      meals: planData[key] ?? [],
    };
  });

  const weekEndDate = new Date(currentWeekStart);
  weekEndDate.setDate(currentWeekStart.getDate() + 6);

  const selectedDay = weekDays.find((day) => day.key === selectedDayKey) ?? weekDays[0];

  useEffect(() => {
    setSelectedDayKey((prev) => {
      const keys = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        return dateKey(date);
      });
      if (keys.includes(prev)) return prev;
      return keys.includes(todayKey) ? todayKey : keys[0];
    });
  }, [currentWeekStart, todayKey]);

  async function flushPersist(next: PlanData) {
    if (!dbUserId) return;

    if (saveInFlightRef.current) {
      pendingSaveRef.current = next;
      return;
    }

    saveInFlightRef.current = true;
    let payload: PlanData | null = next;

    try {
      while (payload) {
        const result = await setMealPlanAction(dbUserId, payload);
        if (result.error) {
          console.error("Meal plan save failed:", result.error);
        }
        const pending = pendingSaveRef.current;
        pendingSaveRef.current = null;
        payload = pending;
      }
    } finally {
      saveInFlightRef.current = false;
    }
  }

  function schedulePersist(next: PlanData) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      void flushPersist(next);
    }, 400);
  }

  function updatePlan(dayKey: string, updater: (meals: PlanMeal[]) => PlanMeal[]) {
    setPlanData((prev) => {
      const next = { ...prev, [dayKey]: updater(prev[dayKey] ?? []) };
      schedulePersist(next);
      return next;
    });
  }

  function openAddMeal(dayKey: string, dayLabel: string, mealType?: MealType) {
    setDrawerDayKey(dayKey);
    setDrawerDayLabel(dayLabel);
    setDrawerMealType(mealType ?? null);
    setDrawerOpen(true);
  }

  function addMeal(dayKey: string, meal: Omit<PlanMeal, "id">) {
    updatePlan(dayKey, (meals) => [...meals, { ...meal, id: createMealId() }]);
  }

  function removeMeal(dayKey: string, mealId: string) {
    updatePlan(dayKey, (meals) => meals.filter((meal) => meal.id !== mealId));
    setMealSheetOpen(false);
    setSelectedMeal(null);
    setIsEditingMeal(false);
  }

  function openMealSheet(dayKey: string, meal: PlanMeal) {
    setSelectedMeal({ dayKey, meal });
    setEditTitle(meal.title);
    setEditMealType(meal.mealType);
    setIsEditingMeal(false);
    setMealSheetOpen(true);
  }

  function saveEditMeal() {
    if (!selectedMeal) return;
    const title = editTitle.trim();
    if (!title) return;
    updatePlan(selectedMeal.dayKey, (meals) =>
      meals.map((meal) =>
        meal.id === selectedMeal.meal.id
          ? { ...meal, title, mealType: editMealType }
          : meal
      )
    );
    setMealSheetOpen(false);
    setSelectedMeal(null);
    setIsEditingMeal(false);
  }

  function shiftWeek(delta: number) {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + delta * 7);
    setCurrentWeekStart(d);
  }

  function selectDay(dayKey: string) {
    setSelectedDayKey(dayKey);
    if (viewMode === "weekly") {
      setViewMode("daily");
    }
  }

  const viewTabClass = (active: boolean) =>
    `flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${active ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted"
    }`;

  if (!isLoaded || pageLoading) {
    return (
      <RecipeShell activeTab="plan">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </RecipeShell>
    );
  }

  return (
    <RecipeShell activeTab="plan">
      <div className="flex items-center justify-between gap-3 mb-4">
        {/* Date Selector (Left side) */}
        <div className="flex items-center gap-0.5 bg-app-surface border border-app-border rounded-lg px-0.5 py-0.5 shadow-sm shrink-0">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-app-surface-muted active:scale-95 transition-all shrink-0"
            aria-label="Önceki hafta"
          >
            <CaretLeft size={12} weight="bold" className="text-app-muted" />
          </button>

          <span className="text-[9px] font-black uppercase tracking-wide text-app-text px-1 min-w-[88px] text-center select-none leading-none">
            {formatDate(currentWeekStart)} – {formatDate(weekEndDate)}
          </span>

          <button
            type="button"
            onClick={() => shiftWeek(1)}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-app-surface-muted active:scale-95 transition-all shrink-0"
            aria-label="Sonraki hafta"
          >
            <CaretRight size={12} weight="bold" className="text-app-muted" />
          </button>
        </div>

        {/* View Mode Switcher (Right side) */}
        <div className="flex gap-0.5 p-1 rounded-xl bg-app-tab-track border border-app-border w-36 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("daily")}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide text-center transition-all ${
              viewMode === "daily" ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
            }`}
          >
            Günlük
          </button>
          <button
            type="button"
            onClick={() => setViewMode("weekly")}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide text-center transition-all ${
              viewMode === "weekly" ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
            }`}
          >
            Haftalık
          </button>
        </div>
      </div>

      {viewMode === "daily" && (
        <DayStrip
          weekDays={weekDays}
          selectedDayKey={selectedDayKey}
          todayKey={todayKey}
          onSelect={setSelectedDayKey}
        />
      )}

      {viewMode === "daily" ? (
        <DailyMealSections
          day={selectedDay}
          recipesById={recipesById}
          onAddMeal={openAddMeal}
          onOpenMeal={openMealSheet}
        />
      ) : (
        <WeeklyGrid
          weekDays={weekDays}
          todayKey={todayKey}
          recipesById={recipesById}
          onAddMeal={openAddMeal}
          onOpenMeal={openMealSheet}
          onSelectDay={selectDay}
        />
      )}

      <AddMealDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        dayLabel={drawerDayLabel}
        recipes={recipes}
        recipesLoading={recipesLoading}
        defaultMealType={drawerMealType ?? undefined}
        onSelectRecipe={(recipe, mealType) => {
          if (!drawerDayKey) return;
          addMeal(drawerDayKey, {
            title: recipe.title,
            recipeId: recipe.id,
            mealType,
          });
        }}
        onAddCustom={async (title, category, mealType) => {
          if (!drawerDayKey || !dbUserId) return;
          const res = await createRecipe(title, dbUserId, [], [], category);
          if (res.data) {
            addMeal(drawerDayKey, {
              title: res.data.title,
              recipeId: res.data.id,
              mealType,
            });
            const recipesResult = await getUserRecipesAction(dbUserId);
            setRecipes(recipesResult.data ?? []);
          }
        }}
      />

      <Drawer
        open={mealSheetOpen}
        onOpenChange={(open) => {
          setMealSheetOpen(open);
          if (!open) {
            setSelectedMeal(null);
            setIsEditingMeal(false);
          }
        }}
      >
        <DrawerContent className="max-w-xl mx-auto rounded-t-3xl border-t border-app-border bg-app-surface">
          <DrawerHeader className="px-4 pt-2 pb-0 text-left">
            <DrawerTitle className="text-base font-black text-app-text uppercase tracking-tight">
              {isEditingMeal ? "Öğünü Düzenle" : selectedMeal?.meal.title ?? "Öğün"}
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6 pt-3">
            {!selectedMeal ? null : isEditingMeal ? (
              <div className="space-y-2">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-app-border rounded-xl focus:outline-none focus:border-orange-500/40 bg-app-surface text-app-text"
                  placeholder="Yemek adı"
                />
                <div className="flex gap-1">
                  {mealTypeSections.map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setEditMealType(item.type)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide ${
                        editMealType === item.type
                          ? "bg-orange-500 text-white"
                          : "bg-app-tab-track text-app-muted"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingMeal(false)}
                    className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide text-app-muted bg-app-surface-muted"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={saveEditMeal}
                    className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide text-white bg-orange-500"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedMeal.meal.recipeId && (
                  <Link
                    href={`/apps/recipe?id=${selectedMeal.meal.recipeId}`}
                    onClick={() => setMealSheetOpen(false)}
                    className="block w-full text-center py-2.5 rounded-xl border border-app-border bg-app-surface text-xs font-black uppercase tracking-wide text-app-text"
                  >
                    Tarife Git
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditingMeal(true)}
                  className="w-full py-2.5 rounded-xl border border-app-border bg-app-surface text-xs font-black uppercase tracking-wide text-app-text"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => removeMeal(selectedMeal.dayKey, selectedMeal.meal.id)}
                  className="w-full py-2.5 rounded-xl bg-red-500 text-xs font-black uppercase tracking-wide text-white"
                >
                  Çıkart
                </button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </RecipeShell>
  );
}

function DayStrip({
  weekDays,
  selectedDayKey,
  todayKey,
  onSelect,
}: {
  weekDays: WeekDay[];
  selectedDayKey: string;
  todayKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1 mb-3 w-full">
      {weekDays.map((day) => {
        const isSelected = day.key === selectedDayKey;
        const isToday = day.key === todayKey;
        return (
          <button
            key={day.key}
            type="button"
            onClick={() => onSelect(day.key)}
            className={`min-w-0 py-1.5 rounded-lg border transition-all active:scale-95 ${isSelected
                ? "bg-gray-900 dark:bg-app-tab-active border-gray-900 dark:border-app-border text-white dark:text-app-text"
                : "bg-app-surface border-app-border text-app-muted"
              }`}
          >
            <span
              className={`block text-[7px] font-bold uppercase tracking-wide truncate px-0.5 ${isSelected ? "text-white/60 dark:text-app-muted" : "text-app-muted"
                }`}
            >
              {day.shortName}
            </span>
            <span
              className={`block text-xs font-black leading-none mt-0.5 tabular-nums ${isToday && !isSelected ? "text-app-text" : ""
                }`}
            >
              {day.date}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MealRow({
  meal,
  dayKey,
  recipesById,
  onOpenMeal,
  compact,
}: {
  meal: PlanMeal;
  dayKey: string;
  recipesById: Record<string, lib.RecipeSummary>;
  onOpenMeal: (dayKey: string, meal: PlanMeal) => void;
  compact?: boolean;
}) {
  const imageUrl =
    meal.recipeId && recipesById[meal.recipeId]?.image_url
      ? recipesById[meal.recipeId].image_url
      : null;

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onOpenMeal(dayKey, meal)}
        className="w-full text-left px-1 py-1 rounded-md active:bg-app-surface-muted transition-colors"
        title={meal.title}
      >
        <p className="text-[9px] font-bold text-app-text leading-tight line-clamp-2 break-words">
          {meal.title}
        </p>
      </button>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpenMeal(dayKey, meal)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left active:bg-app-surface-muted transition-colors"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
        ) : (() => {
          const emoji = getRecipeEmoji(meal.title);
          if (emoji) {
            return (
              <div className="w-10 h-10 rounded-lg bg-orange-50/60 border border-orange-100 flex items-center justify-center shrink-0 text-xl select-none">
                {emoji}
              </div>
            );
          }
          return (
            <div className="w-10 h-10 rounded-lg bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
              <span className="text-sm font-black text-app-muted">{mealInitial(meal.title)}</span>
            </div>
          );
        })()}
        <p className="flex-1 text-[13px] font-bold text-app-text leading-snug">{meal.title}</p>
      </button>
    </li>
  );
}

function DailyMealSections({
  day,
  recipesById,
  onAddMeal,
  onOpenMeal,
}: {
  day: WeekDay;
  recipesById: Record<string, lib.RecipeSummary>;
  onAddMeal: (dayKey: string, dayLabel: string, mealType?: MealType) => void;
  onOpenMeal: (dayKey: string, meal: PlanMeal) => void;
}) {
  return (
    <div className="space-y-2">
      {mealTypeSections.map((section) => {
        const meals = day.meals.filter((meal) => meal.mealType === section.type);

        return (
          <section
            key={section.type}
            className="rounded-xl border border-app-border bg-app-surface overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-app-border">
              <span className="text-[10px] font-black uppercase tracking-wider text-app-muted">
                {section.label}
              </span>
              <button
                type="button"
                onClick={() =>
                  onAddMeal(day.key, `${day.name} ${day.date} · ${section.label}`, section.type)
                }
                className="w-7 h-7 flex items-center justify-center rounded-lg text-app-muted hover:text-app-text active:scale-95 transition-all"
                aria-label={`${section.label} ekle`}
              >
                <Plus size={16} weight="bold" />
              </button>
            </div>

            {meals.length === 0 ? (
              <button
                type="button"
                onClick={() =>
                  onAddMeal(day.key, `${day.name} ${day.date} · ${section.label}`, section.type)
                }
                className="w-full px-3 py-4 text-left text-xs font-bold text-app-muted active:bg-app-surface-muted transition-colors"
              >
                Henüz eklenmedi
              </button>
            ) : (
              <ul className="divide-y divide-app-border">
                {meals.map((meal) => (
                  <MealRow
                    key={meal.id}
                    meal={meal}
                    dayKey={day.key}
                    recipesById={recipesById}
                    onOpenMeal={onOpenMeal}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function WeeklyGrid({
  weekDays,
  todayKey,
  recipesById,
  onAddMeal,
  onOpenMeal,
  onSelectDay,
}: {
  weekDays: WeekDay[];
  todayKey: string;
  recipesById: Record<string, lib.RecipeSummary>;
  onAddMeal: (dayKey: string, dayLabel: string, mealType?: MealType) => void;
  onOpenMeal: (dayKey: string, meal: PlanMeal) => void;
  onSelectDay: (dayKey: string) => void;
}) {
  return (
    <div className="rounded-xl border border-app-border bg-app-surface overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-app-border">
        {weekDays.map((day) => {
          const isToday = day.key === todayKey;
          return (
            <div
              key={day.key}
              className={`min-w-0 flex flex-col transition-colors ${
                isToday ? "bg-orange-50/30 dark:bg-orange-950/20" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectDay(day.key)}
                className={`px-0.5 py-2 text-center border-b border-app-border active:bg-app-surface-muted transition-colors ${
                  isToday ? "bg-orange-100/20 dark:bg-orange-950/30" : ""
                }`}
              >
                <p className="text-[8px] font-bold uppercase text-app-muted truncate">
                  {day.shortName}
                </p>
                <p className="text-xs font-black text-app-text tabular-nums">{day.date}</p>
              </button>

              <div className="flex-1 flex flex-col">
                {mealTypeSections.map((section, sectionIndex) => {
                  const meals = day.meals.filter((meal) => meal.mealType === section.type);
                  return (
                    <div
                      key={section.type}
                      className={`flex-1 min-h-[7.5rem] px-0.5 py-1.5 flex flex-col ${
                        sectionIndex < mealTypeSections.length - 1
                          ? "border-b border-app-border"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[7px] font-black uppercase text-app-muted truncate">
                          {section.shortLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onAddMeal(
                              day.key,
                              `${day.name} ${day.date} · ${section.label}`,
                              section.type
                            )
                          }
                          className="w-4 h-4 flex items-center justify-center text-app-muted active:text-app-text hover:text-app-text"
                          aria-label={`${day.name} ${section.label} ekle`}
                        >
                          <Plus size={10} weight="bold" />
                        </button>
                      </div>

                      {meals.length === 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            onAddMeal(
                              day.key,
                              `${day.name} ${day.date} · ${section.label}`,
                              section.type
                            )
                          }
                          className="w-full flex-1 min-h-[1.5rem] flex items-center justify-center active:bg-app-surface-muted transition-colors"
                          aria-label={`${section.label} ekle`}
                        />
                      ) : (
                        <div className="space-y-0.5">
                          {meals.map((meal) => (
                            <MealRow
                              key={meal.id}
                              meal={meal}
                              dayKey={day.key}
                              recipesById={recipesById}
                              onOpenMeal={onOpenMeal}
                              compact
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
