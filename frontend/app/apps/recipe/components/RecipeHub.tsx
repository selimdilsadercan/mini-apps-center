"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { ChefHat } from "@phosphor-icons/react";
import type { lib } from "@/lib/client";
import { getOrCreateUserAction, getUserRecipesAction } from "../actions";
import RecipeShell from "./RecipeShell";

function RecipeInitial({ title }: { title: string }) {
  const initial = title.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?";
  return (
    <div className="w-11 h-11 mb-1.5 rounded-xl bg-gray-100 border border-gray-200/80 flex items-center justify-center font-black text-gray-500 text-base">
      {initial}
    </div>
  );
}

export default function RecipeHub() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [recipes, setRecipes] = useState<lib.RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        setError(null);

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

  if (!isLoaded || loading) {
    return (
      <RecipeShell activeTab="recipes">
        <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </RecipeShell>
    );
  }

  if (!user) {
    return (
      <RecipeShell activeTab="recipes">
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/50 flex flex-col items-center justify-center p-6 shadow-sm">
          <ChefHat size={40} className="text-gray-200 mb-4" weight="duotone" />
          <p className="text-sm font-bold text-gray-400">Tariflerini görmek için giriş yapmalısın.</p>
        </div>
      </RecipeShell>
    );
  }

  return (
    <RecipeShell activeTab="recipes" onAdd={() => router.push("/apps/recipe/create")}>
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-500 text-sm font-bold">{error}</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-200/50 shadow-sm">
          <ChefHat size={32} className="text-gray-200 mx-auto mb-2" weight="duotone" />
          <p className="text-xs font-bold text-gray-400 mb-4">Henüz tarif yok</p>
          <button
            onClick={() => router.push("/apps/recipe/create")}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all active:scale-95"
          >
            İlk Tarifini Ekle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => router.push(`/apps/recipe?id=${recipe.id}`)}
              className="bg-white rounded-xl border border-gray-200/50 relative flex flex-col items-center justify-center px-2 py-4 group hover:border-orange-500/30 hover:shadow-md transition-all shadow-sm overflow-hidden active:scale-95 cursor-pointer text-left w-full select-none"
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
              <h3 className="text-[12px] font-bold text-gray-900 text-center leading-tight line-clamp-2 px-1">
                {recipe.title}
              </h3>
            </button>
          ))}
        </div>
      )}
    </RecipeShell>
  );
}
