"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { CaretLeft, CaretDown, CaretUp } from "@phosphor-icons/react";
import { parseRecipeInput } from "../parse-recipe-input";
import { RECIPE_JSON_EXAMPLE } from "../recipe-json-format";
import { createRecipe, getOrCreateUserAction } from "./actions";
import { useShareIntent } from "@/lib/use-share-intent";
import RecipeJsonGuide from "../components/RecipeJsonGuide";

type CreateMode = "text" | "json";

function CreateRecipeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const sharedTextFromIntent = useShareIntent();

  const [recipeText, setRecipeText] = useState("");
  const [createMode, setCreateMode] = useState<CreateMode>("text");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipsOpen, setTipsOpen] = useState(true);

  useEffect(() => {
    const sharedTextFromUrl = searchParams.get("sharedText");
    if (sharedTextFromUrl) {
      const decoded = decodeURIComponent(sharedTextFromUrl);
      setRecipeText(decoded);
      setCreateMode(decoded.trim().startsWith("{") ? "json" : "text");
    } else if (sharedTextFromIntent) {
      setRecipeText(sharedTextFromIntent);
      setCreateMode(sharedTextFromIntent.trim().startsWith("{") ? "json" : "text");
    }
  }, [searchParams, sharedTextFromIntent]);

  async function handleImport() {
    if (!recipeText.trim()) {
      setError("Lütfen tarif içeriğini girin");
      return;
    }

    if (!user?.id) {
      setError("Lütfen giriş yapın");
      return;
    }

    const { data: parsed, error: parseError } = parseRecipeInput(recipeText, createMode);
    if (parseError || !parsed) {
      setError(parseError ?? "Tarif okunamadı");
      return;
    }

    try {
      setIsImporting(true);
      setError(null);

      const userResult = await getOrCreateUserAction(user.id);
      if (userResult.error || !userResult.data) {
        setError(userResult.error || "Kullanıcı bilgisi alınamadı");
        return;
      }

      const recipeResult = await createRecipe(
        parsed.title,
        userResult.data.id,
        parsed.ingredients,
        parsed.instructions
      );

      if (recipeResult.data) {
        router.push(`/apps/recipe?id=${recipeResult.data.id}`);
        return;
      }

      setError(recipeResult.error || "Tarif kaydedilemedi");
    } catch (err) {
      console.error("Import error:", err);
      setError("Tarif kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsImporting(false);
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
      active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      <header className="sticky top-0 z-30 bg-[#FAF9F7]/95 backdrop-blur-md border-b border-gray-200/40">
        <div className="flex items-center justify-between px-4 py-3 max-w-xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="shrink-0 flex items-center justify-center w-8 h-8 bg-white rounded-lg border border-gray-200/60 active:scale-95"
          >
            <CaretLeft size={14} weight="bold" className="text-orange-500" />
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || !recipeText.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95"
          >
            {isImporting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 max-w-xl mx-auto w-full overflow-y-auto">
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 mb-4">
          <button type="button" onClick={() => setCreateMode("text")} className={tabClass(createMode === "text")}>
            Metin
          </button>
          <button type="button" onClick={() => setCreateMode("json")} className={tabClass(createMode === "json")}>
            JSON
          </button>
        </div>

        {createMode === "text" ? (
          <div className="bg-orange-50 border border-orange-200/60 rounded-xl mb-4 overflow-hidden">
            <button
              onClick={() => setTipsOpen(!tipsOpen)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <span className="text-orange-800 font-bold text-sm">İçe aktarma ipuçları</span>
              {tipsOpen ? (
                <CaretUp size={18} className="text-orange-700" />
              ) : (
                <CaretDown size={18} className="text-orange-700" />
              )}
            </button>

            {tipsOpen && (
              <div className="px-4 pb-3 text-orange-700 text-sm space-y-2">
                <p>Tarifin doğru algılanması için şu formata uyun:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>İlk satır:</strong> Tarif başlığı
                  </li>
                  <li>
                    <strong>Malzemeler:</strong> satırından sonra her malzeme ayrı satırda
                  </li>
                  <li>
                    <strong>Yapılış:</strong> satırından sonra numaralı adımlar (1. 2. 3.)
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <RecipeJsonGuide />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <textarea
          value={recipeText}
          onChange={(e) => {
            setRecipeText(e.target.value);
            setError(null);
          }}
          placeholder={
            createMode === "json"
              ? RECIPE_JSON_EXAMPLE
              : `Körili Kremalı Tavuklu Makarna

Malzemeler:
125 g makarna
250 g tavuk göğsü
1 tatlı kaşığı köri
...

Yapılış:
1. 1 litre kaynar suya 1 tatlı kaşığı tuz ekle...
2. 8–10 dakika haşla...
...`
          }
          spellCheck={createMode === "text"}
          className={`w-full h-[calc(100vh-280px)] p-4 bg-white border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-orange-500/40 text-gray-900 placeholder:text-gray-400 text-sm leading-relaxed ${
            createMode === "json" ? "font-mono text-xs" : ""
          }`}
        />
      </main>
    </div>
  );
}

export default function CreateRecipePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      }
    >
      <CreateRecipeContent />
    </Suspense>
  );
}
