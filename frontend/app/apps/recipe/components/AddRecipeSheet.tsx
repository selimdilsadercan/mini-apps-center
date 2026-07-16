"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { CaretDown, CaretUp, X } from "@phosphor-icons/react";
import { parseRecipeInput } from "../parse-recipe-input";
import { RECIPE_JSON_EXAMPLE } from "../recipe-json-format";
import { createRecipe, getOrCreateUserAction } from "../create/actions";
import RecipeJsonGuide from "./RecipeJsonGuide";
import CATEGORIES from "../categories.json";

type CreateMode = "simple" | "text" | "json";

export default function AddRecipeSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user } = useUser();

  const [recipeText, setRecipeText] = useState("");
  const [simpleTitle, setSimpleTitle] = useState("");
  const [createMode, setCreateMode] = useState<CreateMode>("simple");
  const [category, setCategory] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipsOpen, setTipsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSimpleTitle("");
      setRecipeText("");
      setError(null);
      setCreateMode("simple");
      setCategory(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleImport() {
    if (createMode === "simple") {
      if (!simpleTitle.trim()) {
        setError("Lütfen tarif adını girin");
        return;
      }
    } else {
      if (!recipeText.trim()) {
        setError("Lütfen tarif içeriğini girin");
        return;
      }
    }

    if (!user?.id) {
      setError("Lütfen giriş yapın");
      return;
    }

    let parsed;
    if (createMode === "simple") {
      parsed = {
        title: simpleTitle.trim(),
        ingredients: [],
        instructions: [],
      };
    } else {
      const { data, error: parseError } = parseRecipeInput(recipeText, createMode);
      if (parseError || !data) {
        setError(parseError ?? "Tarif okunamadı");
        return;
      }
      parsed = data;
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
        parsed.instructions,
        category
      );

      if (recipeResult.data) {
        onClose();
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
      active ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
    }`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto bg-app-surface rounded-t-3xl border-t border-app-border z-50 p-6 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-app-border shrink-0">
          <h2 className="text-lg font-black text-app-text uppercase tracking-tight">
            Yeni Tarif Ekle
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-app-surface-muted flex items-center justify-center text-app-muted hover:text-app-text transition-all active:scale-95"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-app-tab-track mb-4 shrink-0">
          <button type="button" onClick={() => setCreateMode("simple")} className={tabClass(createMode === "simple")}>
            Hızlı
          </button>
          <button type="button" onClick={() => setCreateMode("text")} className={tabClass(createMode === "text")}>
            Metin
          </button>
          <button type="button" onClick={() => setCreateMode("json")} className={tabClass(createMode === "json")}>
            JSON
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-red-700 text-sm shrink-0">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 mb-4 space-y-4">
          {createMode === "simple" ? (
            <div className="space-y-4 pt-1">
              <div>
                <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-2 block">
                  Tarif Adı
                </label>
                <input
                  type="text"
                  value={simpleTitle}
                  onChange={(e) => {
                    setSimpleTitle(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleImport();
                    }
                  }}
                  placeholder="Tarif adı (örn: Kaşık Dökmesi)..."
                  className="w-full p-4 bg-app-surface border border-app-border rounded-xl focus:outline-none focus:border-orange-500/40 text-app-text placeholder:text-app-muted text-sm font-bold shadow-sm"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {createMode === "text" ? (
                <div className="bg-orange-50 border border-orange-200/60 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setTipsOpen(!tipsOpen)}
                    type="button"
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
                      <p>Tarif ekleme yöntemleri:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>
                          <strong>Hızlı Ekleme:</strong> Sadece tarif adını yazarak boş bir tarif oluşturabilirsiniz.
                        </li>
                        <li>
                          <strong>Detaylı Ekleme (İlk satır):</strong> Tarif başlığı
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
                <RecipeJsonGuide />
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
                className={`w-full h-64 p-4 bg-app-surface border border-app-border rounded-xl resize-none focus:outline-none focus:border-orange-500/40 text-app-text placeholder:text-app-muted text-sm leading-relaxed ${
                  createMode === "json" ? "font-mono text-xs" : ""
                }`}
              />
            </div>
          )}

          {/* Category Selector (Always visible at the bottom) */}
          <div className="pt-2">
            <label className="text-[10px] font-bold text-app-muted uppercase tracking-wider mb-2 block">
              Kategori
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(category === cat ? null : cat)}
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
        </div>

        <button
          onClick={handleImport}
          disabled={isImporting || (createMode === "simple" ? !simpleTitle.trim() : !recipeText.trim())}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md shadow-orange-900/10 shrink-0"
        >
          {isImporting ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </>
  );
}
