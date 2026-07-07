"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretLeft, PencilSimple, DotsThreeVertical, Trash } from "@phosphor-icons/react";
import { useUser } from "@clerk/clerk-react";
import { getRecipeByIdAction, deleteRecipeAction, getOrCreateUserAction } from "./actions";
import RecipeHub from "./components/RecipeHub";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { lib } from "@/lib/client";
import { scaleIngredientAmount } from "./scale-ingredient";
import InstructionText from "./components/InstructionText";
import IngredientThumbnail from "./components/IngredientThumbnail";
import OptionalIngredientToggles from "./components/OptionalIngredientToggles";
import {
  type RecipeIngredient,
  type RecipeInstruction,
  normalizeRecipeIngredients,
  getOptionalToggles,
  buildDefaultSelectedKeys,
  filterActiveIngredients,
  filterActiveInstructions,
  toggleIngredientKey,
} from "./recipe-variant";
import { Minus, Plus } from "@phosphor-icons/react";

type TabType = "ingredients" | "instructions";

function RecipeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get("id");
  const { user } = useUser();

  const [recipe, setRecipe] = useState<lib.Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("ingredients");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [servings, setServings] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (recipeId) {
      fetchRecipe();
      setServings(1);
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  const allIngredients = useMemo(
    () => normalizeRecipeIngredients((recipe?.ingredients as unknown as RecipeIngredient[]) || []),
    [recipe]
  );
  const allInstructions = useMemo(
    () => (recipe?.instructions as unknown as RecipeInstruction[]) || [],
    [recipe]
  );
  const optionalToggles = useMemo(() => getOptionalToggles(allIngredients), [allIngredients]);
  const activeIngredients = useMemo(
    () => filterActiveIngredients(allIngredients, selectedKeys),
    [allIngredients, selectedKeys]
  );
  const activeInstructions = useMemo(
    () => filterActiveInstructions(allInstructions, selectedKeys),
    [allInstructions, selectedKeys]
  );

  if (!recipeId) {
    return <RecipeHub />;
  }

  async function fetchRecipe() {
    if (!recipeId) return;

    try {
      setLoading(true);
      const result = await getRecipeByIdAction(recipeId);
      if (result.data) {
        setRecipe(result.data);
        const normalized = normalizeRecipeIngredients(
          (result.data.ingredients as unknown as RecipeIngredient[]) || []
        );
        setSelectedKeys(buildDefaultSelectedKeys(normalized));
      } else {
        setError(result.error || "Tarif bulunamadı");
      }
    } catch (err) {
      console.error(err);
      setError("Tarif yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRecipe() {
    if (!recipeId || !user?.id) return;

    try {
      setIsDeleting(true);
      
      // Önce Clerk ID ile Supabase user ID'sini al
      const userResult = await getOrCreateUserAction(user.id);
      if (!userResult.data) {
        setError(userResult.error || "Kullanıcı bilgisi alınamadı");
        setIsDeleteDialogOpen(false);
        return;
      }
      
      const result = await deleteRecipeAction(recipeId, userResult.data.id);
      
      if (result.data) {
        router.push("/apps/recipe");
      } else {
        setError(result.error || "Tarif silinemedi");
        setIsDeleteDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      setError("Tarif silinirken hata oluştu");
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <header className="px-4 py-3 max-w-xl mx-auto w-full">
          <button
            onClick={() => router.push("/apps/recipe")}
            className="shrink-0 flex items-center justify-center w-8 h-8 bg-white rounded-lg border border-gray-200/60 active:scale-95"
          >
            <CaretLeft size={14} weight="bold" className="text-orange-500" />
          </button>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 max-w-xl mx-auto w-full">
          <p className="text-red-500">{error || "Tarif bulunamadı"}</p>
        </main>
      </div>
    );
  }

  const tabBtnClass = (active: boolean) =>
    `flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
      active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  const portionBtnClass = (active: boolean) =>
    `min-w-[2rem] px-2.5 py-1.5 rounded-lg text-xs font-black tabular-nums transition-all active:scale-95 ${
      active ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900">
      <header className="sticky top-0 z-30 bg-[#FAF9F7]/95 backdrop-blur-md border-b border-gray-200/40">
        <div className="flex items-center gap-2 px-4 py-3 max-w-xl mx-auto w-full">
          <button
            onClick={() => router.push("/apps/recipe")}
            className="shrink-0 flex items-center justify-center w-8 h-8 bg-white rounded-lg border border-gray-200/60 active:scale-95"
          >
            <CaretLeft size={14} weight="bold" className="text-orange-500" />
          </button>

          <h1 className="flex-1 min-w-0 text-sm font-black text-gray-900 truncate leading-tight">
            {recipe.title}
          </h1>

          <button
            onClick={() => router.push(`/apps/recipe/edit?id=${recipeId}`)}
            className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-orange-600 hover:bg-orange-50 bg-white rounded-lg border border-gray-200/60 active:scale-95 transition-all"
          >
            <PencilSimple size={16} weight="bold" />
          </button>

          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 bg-white rounded-lg border border-gray-200/60 active:scale-95 transition-all">
                <DotsThreeVertical size={16} weight="bold" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1">
              <button
                onClick={() => {
                  setIsPopoverOpen(false);
                  setIsDeleteDialogOpen(true);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash size={20} />
                <span className="font-medium">Tarifi Sil</span>
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tarifi silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Tarif kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecipe}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Siliniyor..." : "Evet, Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="flex-1 px-4 py-4 pb-8 max-w-xl mx-auto w-full">
        {recipe.image_url && (
          <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden border border-gray-200/60 shadow-sm mb-4">
            <img
              src={recipe.image_url}
              alt={recipe.title || "Tarif"}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
          <div className="px-3 pt-3">
            <div className="flex items-center justify-between gap-3 mb-3 px-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                Porsiyon
              </span>
              <div className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-gray-100 border border-gray-200/80">
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  disabled={servings <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
                  aria-label="Porsiyon azalt"
                >
                  <Minus size={14} weight="bold" />
                </button>
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setServings(n)}
                    className={portionBtnClass(servings === n)}
                  >
                    {n}
                  </button>
                ))}
                {servings > 4 && (
                  <span className={portionBtnClass(true)}>{servings}</span>
                )}
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.min(12, s + 1))}
                  disabled={servings >= 12}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95"
                  aria-label="Porsiyon artır"
                >
                  <Plus size={14} weight="bold" />
                </button>
              </div>
            </div>

            <OptionalIngredientToggles
              toggles={optionalToggles}
              selectedKeys={selectedKeys}
              onToggle={(key, on) => setSelectedKeys((prev) => toggleIngredientKey(prev, key, on))}
            />
          </div>

          <div className="p-3 pt-0">
            <div className="flex gap-1 p-1 rounded-xl bg-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab("ingredients")}
                className={tabBtnClass(activeTab === "ingredients")}
              >
                Malzemeler
                {activeIngredients.length > 0 && (
                  <span className="ml-1 text-[10px] tabular-nums text-orange-500">
                    {activeIngredients.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("instructions")}
                className={tabBtnClass(activeTab === "instructions")}
              >
                Yapılış
                {activeInstructions.length > 0 && (
                  <span className="ml-1 text-[10px] tabular-nums text-orange-500">
                    {activeInstructions.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="px-4 pb-4">
            {activeTab === "ingredients" ? (
              activeIngredients.length === 0 ? (
                <p className="text-xs font-bold text-gray-400 text-center py-8">
                  Malzeme bilgisi bulunmuyor
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                  {activeIngredients.map((ingredient, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 px-3 py-3 text-sm leading-snug"
                    >
                      <IngredientThumbnail name={ingredient.name} />
                      <span className="text-gray-800">
                        {ingredient.amount && (
                          <span className="font-bold text-gray-900">
                            {scaleIngredientAmount(ingredient.amount, servings)}{" "}
                          </span>
                        )}
                        {ingredient.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )
            ) : activeInstructions.length === 0 ? (
              <p className="text-xs font-bold text-gray-400 text-center py-8">
                Yapılış bilgisi bulunmuyor
              </p>
            ) : (
              <ol className="space-y-3">
                {activeInstructions.map((instruction, idx) => (
                  <li
                    key={`${instruction.index}-${idx}`}
                    className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-3"
                  >
                    <span className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <div className="text-sm text-gray-700 leading-relaxed pt-0.5">
                      <InstructionText
                        text={instruction.text}
                        ingredients={activeIngredients}
                        servings={servings}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RecipePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    }>
      <RecipeContent />
    </Suspense>
  );
}
