"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { ChefHat } from "@phosphor-icons/react";
import type { lib, contributions } from "@/lib/client";
import { getMealPlanAction, getOrCreateUserAction, getUserRecipesAction, getCommunityRecipesAction } from "../actions";
import RecipeShell from "./RecipeShell";
import AddRecipeSheet from "./AddRecipeSheet";
import toast from "react-hot-toast";
import { getRecipeEmoji } from "../recipe-emoji";

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

export default function RecipeHub() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [recipes, setRecipes] = useState<lib.RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Community / Sub-tabs states
  const [activeSubTab, setActiveSubTab] = useState<"my_recipes" | "community">("my_recipes");
  const [communityRecipes, setCommunityRecipes] = useState<contributions.ContributionItem[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        if (!user) return;

        const userResult = await getOrCreateUserAction(user!.id);
        if (!userResult.data) {
          setError(userResult.error || "Kullanıcı bilgisi alınamadı");
          return;
        }

        const recipesResult = await getUserRecipesAction(userResult.data.id);
        if (recipesResult.error) {
          setError(recipesResult.error);
          return;
        }

        setRecipes(recipesResult.data ?? []);
      } catch (err) {
        console.error(err);
        setError("Tarifler yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, isLoaded]);

  // Load community contributions when the community tab is selected
  useEffect(() => {
    if (activeSubTab === "community") {
      async function loadComm() {
        try {
          setCommunityLoading(true);
          const res = await getCommunityRecipesAction();
          if (res.error) {
            console.error("Community recipes API error:", res.error);
            toast.error(`Tarifler yüklenemedi: ${res.error}`);
            return;
          }
          if (res.data) {
            setCommunityRecipes(res.data);
          }
        } catch (err) {
          console.error("Error loading community recipes:", err);
          toast.error("Tarifler yüklenirken bir hata oluştu");
        } finally {
          setCommunityLoading(false);
        }
      }
      loadComm();
    }
  }, [activeSubTab]);

  if (!isLoaded || loading) {
    return (
      <RecipeShell activeTab="recipes">
        <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </RecipeShell>
    );
  }

  if (!user) {
    return (
      <RecipeShell activeTab="recipes">
        <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center p-6 shadow-sm">
          <ChefHat size={40} className="text-app-muted mb-4" weight="duotone" />
          <p className="text-sm font-bold text-app-muted">Tariflerini görmek için giriş yapmalısın.</p>
        </div>
      </RecipeShell>
    );
  }

  return (
    <>
      <RecipeShell activeTab="recipes" onAdd={() => setShowAddSheet(true)}>
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track">
            <button
              onClick={() => setActiveSubTab("my_recipes")}
              className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer ${
                activeSubTab === "my_recipes" ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
              }`}
            >
              Tariflerim
            </button>
            <button
              onClick={() => setActiveSubTab("community")}
              className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer ${
                activeSubTab === "community" ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
              }`}
            >
              Keşfet
            </button>
          </div>
        </div>

        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-sm font-bold">{error}</p>
          </div>
        ) : activeSubTab === "my_recipes" ? (
          <div className="space-y-4">
            {recipes.length === 0 ? (
              <div className="text-center py-10 bg-app-surface rounded-2xl border border-app-border shadow-sm">
                <ChefHat size={32} className="text-app-muted mx-auto mb-2" weight="duotone" />
                <p className="text-xs font-bold text-app-muted mb-4">Henüz tarif yok</p>
                <button
                  onClick={() => setShowAddSheet(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  İlk Tarifini Ekle
                </button>
              </div>
            ) : (() => {
              const grouped = recipes.reduce<Record<string, lib.RecipeSummary[]>>((acc, recipe) => {
                const cat = recipe.category || "Diğer";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(recipe);
                return acc;
              }, {});

              const order = ["Kahvaltı", "Tatlı", "Ana Yemek", "Yan Yemek", "Atıştırmalık", "Diğer"];
              const sortedCats = Object.keys(grouped).sort((a, b) => {
                const idxA = order.indexOf(a);
                const idxB = order.indexOf(b);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
              });

              return (
                <div className="space-y-5">
                  {sortedCats.map((catName) => (
                    <div key={catName} className="space-y-2">
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-app-muted px-1">
                        {catName} ({grouped[catName].length})
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {grouped[catName].map((recipe) => (
                          <button
                            key={recipe.id}
                            onClick={() => router.push(`/apps/recipe?id=${recipe.id}`)}
                            className="bg-app-surface rounded-xl border border-app-border relative flex flex-col items-center justify-center px-2 py-4 group hover:border-orange-500/30 hover:shadow-md transition-all shadow-sm overflow-hidden active:scale-95 cursor-pointer text-left w-full select-none"
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
                  ))}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="space-y-4">
            {communityLoading ? (
              <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
                Yükleniyor...
              </div>
            ) : communityRecipes.length === 0 ? (
              <div className="text-center py-10 bg-app-surface rounded-2xl border border-app-border shadow-sm">
                <ChefHat size={32} className="text-app-muted mx-auto mb-2" weight="duotone" />
                <p className="text-xs font-bold text-app-muted">Henüz topluluk tarifi yok</p>
              </div>
            ) : (() => {
              const grouped = communityRecipes.reduce<Record<string, contributions.ContributionItem[]>>((acc, item) => {
                const cat = (item.data?.category as string) || "Diğer";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(item);
                return acc;
              }, {});

              const order = ["Kahvaltı", "Tatlı", "Ana Yemek", "Yan Yemek", "Atıştırmalık", "Diğer"];
              const sortedCats = Object.keys(grouped).sort((a, b) => {
                const idxA = order.indexOf(a);
                const idxB = order.indexOf(b);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
              });

              return (
                <div className="space-y-5">
                  {sortedCats.map((catName) => (
                    <div key={catName} className="space-y-2">
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-app-muted px-1">
                        {catName} ({grouped[catName].length})
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {grouped[catName].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => router.push(`/apps/recipe?id=${item.id}&source=community`)}
                            className="bg-app-surface rounded-xl border border-app-border relative flex flex-col items-center justify-center px-2 py-4 group hover:border-orange-500/30 hover:shadow-md transition-all shadow-sm overflow-hidden active:scale-95 cursor-pointer text-left w-full select-none"
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt=""
                                className="w-11 h-11 mb-1.5 rounded-xl object-cover"
                              />
                            ) : (
                              <RecipeInitial title={item.title} />
                            )}
                            <h4 className="text-[12px] font-bold text-app-text text-center leading-tight line-clamp-2 px-1">
                              {item.title}
                            </h4>
                            <p className="text-[9px] text-app-muted mt-1.5 font-medium truncate max-w-full text-center px-1">
                              🍳 {item.contributorName || "Topluluk Üyesi"}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </RecipeShell>
      <AddRecipeSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} />
    </>
  );
}
