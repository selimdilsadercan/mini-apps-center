"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import { useUser } from "@clerk/clerk-react";
import type { lib } from "@/lib/client";
import { getOrCreateUserAction, getUserRecipesAction } from "../actions";
import RecipeShell from "../components/RecipeShell";
import AddMealDrawer from "../components/AddMealDrawer";
import {
  type PlanData,
  type PlanMeal,
  createMealId,
  dateKey,
  loadPlanData,
  savePlanData,
} from "./plan-types";

const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeekMonday(date: Date) {
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(date.getDate() + diff);
  return monday;
}

export default function PlanPage() {
  const { user, isLoaded } = useUser();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [planData, setPlanData] = useState<PlanData>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedDayLabel, setSelectedDayLabel] = useState("");
  const [recipes, setRecipes] = useState<lib.RecipeSummary[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);

  useEffect(() => {
    setPlanData(loadPlanData());
  }, []);

  useEffect(() => {
    if (!drawerOpen || !isLoaded || !user) return;

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
  }, [drawerOpen, isLoaded, user]);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    date.setHours(0, 0, 0, 0);
    const key = dateKey(date);
    return {
      name: dayNames[i],
      date: date.getDate(),
      fullDate: date,
      key,
      isToday: isSameCalendarDay(date, today),
      meals: planData[key] ?? [],
    };
  });

  const weekEndDate = new Date(currentWeekStart);
  weekEndDate.setDate(currentWeekStart.getDate() + 6);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

  function updatePlan(dayKey: string, updater: (meals: PlanMeal[]) => PlanMeal[]) {
    setPlanData((prev) => {
      const next = { ...prev, [dayKey]: updater(prev[dayKey] ?? []) };
      savePlanData(next);
      return next;
    });
  }

  function openAddMeal(dayKey: string, dayLabel: string) {
    setSelectedDayKey(dayKey);
    setSelectedDayLabel(dayLabel);
    setDrawerOpen(true);
  }

  function addMeal(dayKey: string, meal: Omit<PlanMeal, "id">) {
    updatePlan(dayKey, (meals) => [...meals, { ...meal, id: createMealId() }]);
  }

  return (
    <RecipeShell activeTab="plan">
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => {
            const d = new Date(currentWeekStart);
            d.setDate(d.getDate() - 7);
            setCurrentWeekStart(d);
          }}
          className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-gray-200/60 hover:border-orange-500/30 active:scale-95 transition-all"
        >
          <CaretLeft size={16} weight="bold" className="text-gray-500" />
        </button>
        <span className="text-xs font-black uppercase tracking-wide text-gray-700">
          {formatDate(currentWeekStart)} – {formatDate(weekEndDate)}
        </span>
        <button
          onClick={() => {
            const d = new Date(currentWeekStart);
            d.setDate(d.getDate() + 7);
            setCurrentWeekStart(d);
          }}
          className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-gray-200/60 hover:border-orange-500/30 active:scale-95 transition-all"
        >
          <CaretRight size={16} weight="bold" className="text-gray-500" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden divide-y divide-gray-100 shadow-sm">
        {weekDays.map((day) => (
          <div
            key={day.key}
            className={`px-3 py-3 ${day.isToday ? "bg-gray-50/80" : ""}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                {day.isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" aria-hidden />
                )}
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    day.isToday ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {day.name} {day.date}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openAddMeal(day.key, `${day.name} ${day.date}`)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors"
                aria-label={`${day.name} için yemek ekle`}
              >
                <Plus size={16} weight="bold" />
              </button>
            </div>

            {day.meals.length === 0 ? (
              <p className="text-xs font-bold text-gray-300">Henüz tarif eklenmedi</p>
            ) : (
              <ul className="space-y-1">
                {day.meals.map((meal) => (
                  <li key={meal.id}>
                    {meal.recipeId ? (
                      <Link
                        href={`/apps/recipe?id=${meal.recipeId}`}
                        className="text-xs font-bold text-gray-800 hover:text-orange-600 transition-colors"
                      >
                        {meal.title}
                      </Link>
                    ) : (
                      <span className="text-xs font-bold text-gray-800">{meal.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <AddMealDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        dayLabel={selectedDayLabel}
        recipes={recipes}
        recipesLoading={recipesLoading}
        onSelectRecipe={(recipe) => {
          if (!selectedDayKey) return;
          addMeal(selectedDayKey, { title: recipe.title, recipeId: recipe.id });
        }}
        onAddCustom={(title) => {
          if (!selectedDayKey) return;
          addMeal(selectedDayKey, { title });
        }}
      />
    </RecipeShell>
  );
}
