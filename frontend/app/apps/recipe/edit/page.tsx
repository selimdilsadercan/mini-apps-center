"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretLeft, Check, Trash, Plus, DotsSixVertical } from "@phosphor-icons/react";
import { useUser } from "@clerk/clerk-react";
import { getRecipeByIdAction, updateRecipeAction, getOrCreateUserAction } from "./actions";
import CATEGORIES from "../categories.json";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { lib } from "@/lib/client";
import RecipeJsonGuide from "../components/RecipeJsonGuide";
import { toApiIngredients, toApiInstructions } from "../recipe-api-map";

// Local types for editing (with id for drag-drop)
interface EditableIngredient {
  id: string;
  name: string;
  amount?: string;
  key?: string;
  optional?: boolean;
  defaultOn?: boolean;
  label?: string;
}

interface EditableInstruction {
  id: string;
  text: string;
  index?: number;
  step?: number;
  requires?: string[];
}

type EditView = "form" | "json";

interface RecipeJsonPayload {
  title: string;
  ingredients: Omit<EditableIngredient, "id">[];
  instructions: Omit<EditableInstruction, "id">[];
}

function stripIngredient(item: EditableIngredient): Omit<EditableIngredient, "id"> {
  const { id, name, amount, key, optional, defaultOn, label } = item;
  const out: Omit<EditableIngredient, "id"> = { name };
  if (amount) out.amount = amount;
  if (key) out.key = key;
  if (optional) out.optional = optional;
  if (defaultOn === false) out.defaultOn = false;
  if (label) out.label = label;
  return out;
}

function stripInstruction(item: EditableInstruction, order: number) {
  const out: { text: string; index: number; requires?: string[] } = { text: item.text, index: order };
  if (item.requires?.length) out.requires = item.requires;
  return out;
}

// Sortable Item Components
function SortableIngredientItem({
  item,
  onUpdate,
  onDelete,
}: {
  item: EditableIngredient;
  onUpdate: (id: string, updates: Partial<EditableIngredient>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-white rounded-xl border border-gray-200/60 p-3 mb-2 shadow-sm"
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-gray-400 hover:text-gray-600 transition-colors">
        <DotsSixVertical size={20} />
      </button>
      <input
        type="text"
        value={item.amount || ""}
        onChange={(e) => onUpdate(item.id, { amount: e.target.value })}
        placeholder="Miktar"
        className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-bold"
      />
      <input
        type="text"
        value={item.name}
        onChange={(e) => onUpdate(item.id, { name: e.target.value })}
        placeholder="Malzeme adı"
        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-bold"
      />
      <button
        onClick={() => onDelete(item.id)}
        className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all active:scale-95"
      >
        <Trash size={18} />
      </button>
    </div>
  );
}

function SortableInstructionItem({
  item,
  index,
  onUpdate,
  onDelete,
}: {
  item: EditableInstruction;
  index: number;
  onUpdate: (id: string, updates: Partial<EditableInstruction>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 bg-white rounded-xl border border-gray-200/60 p-3 mb-2 shadow-sm"
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-gray-400 hover:text-gray-600 transition-colors mt-1">
        <DotsSixVertical size={20} />
      </button>
      <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
        {index + 1}
      </div>
      <textarea
        value={item.text}
        onChange={(e) => onUpdate(item.id, { text: e.target.value })}
        placeholder="Adım açıklaması"
        rows={2}
        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-bold resize-none leading-relaxed"
      />
      <button
        onClick={() => onDelete(item.id)}
        className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all active:scale-95 mt-0.5"
      >
        <Trash size={18} />
      </button>
    </div>
  );
}

function EditRecipeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get("id");
  const { user } = useUser();

  const [originalRecipe, setOriginalRecipe] = useState<lib.Recipe | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<EditableIngredient[]>([]);
  const [instructions, setInstructions] = useState<EditableInstruction[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [editView, setEditView] = useState<EditView>("form");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const toEditableIngredients = (items: lib.Ingredient[] | null): EditableIngredient[] => {
    if (!items) return [];
    return items.map((item) => {
      const raw = item as lib.Ingredient & {
        key?: string;
        optional?: boolean;
        defaultOn?: boolean;
        label?: string;
      };
      return {
        id: generateId(),
        name: raw.name,
        amount: raw.amount,
        key: raw.key,
        optional: raw.optional,
        defaultOn: raw.defaultOn,
        label: raw.label,
      };
    });
  };

  const toEditableInstructions = (items: lib.Instruction[] | null): EditableInstruction[] => {
    if (!items) return [];
    return items.map((item) => {
      const raw = item as lib.Instruction & { index?: number; requires?: string[] };
      return {
        id: generateId(),
        index: raw.index ?? raw.step,
        text: raw.text,
        requires: raw.requires,
      };
    });
  };

  const buildRecipePayload = useCallback((): RecipeJsonPayload => {
    return {
      title,
      ingredients: ingredients.map(stripIngredient),
      instructions: instructions.map((item, idx) => stripInstruction(item, idx + 1)),
    };
  }, [title, ingredients, instructions]);

  const serializeToJson = useCallback((): string => {
    return JSON.stringify(buildRecipePayload(), null, 2);
  }, [buildRecipePayload]);

  const applyRecipePayload = useCallback((payload: RecipeJsonPayload): string | null => {
    if (!payload.title?.trim()) return "title alanı gerekli";
    if (!Array.isArray(payload.ingredients)) return "ingredients bir dizi olmalı";
    if (!Array.isArray(payload.instructions)) return "instructions bir dizi olmalı";

    setTitle(payload.title.trim());
    setIngredients(
      payload.ingredients.map((item) => ({
        id: generateId(),
        name: item.name ?? "",
        amount: item.amount,
        key: item.key,
        optional: item.optional,
        defaultOn: item.defaultOn,
        label: item.label,
      }))
    );
    setInstructions(
      payload.instructions.map((item, idx) => ({
        id: generateId(),
        index: item.index ?? item.step ?? idx + 1,
        text: item.text ?? "",
        requires: item.requires,
      }))
    );
    return null;
  }, []);

  const parseJsonPayload = useCallback((text: string): { payload?: RecipeJsonPayload; error?: string } => {
    try {
      const parsed = JSON.parse(text) as RecipeJsonPayload;
      if (!parsed.title?.trim()) return { error: "title alanı gerekli" };
      if (!Array.isArray(parsed.ingredients)) return { error: "ingredients bir dizi olmalı" };
      if (!Array.isArray(parsed.instructions)) return { error: "instructions bir dizi olmalı" };
      return { payload: parsed };
    } catch {
      return { error: "Geçersiz JSON formatı" };
    }
  }, []);

  const payloadToEditable = useCallback(
    (payload: RecipeJsonPayload) => ({
      title: payload.title.trim(),
      ingredients: payload.ingredients.map((item) => ({
        id: generateId(),
        name: item.name ?? "",
        amount: item.amount,
        key: item.key,
        optional: item.optional,
        defaultOn: item.defaultOn,
        label: item.label,
      })),
      instructions: payload.instructions.map((item, idx) => ({
        id: generateId(),
        index: item.index ?? item.step ?? idx + 1,
        text: item.text ?? "",
        requires: item.requires,
      })),
    }),
    []
  );

  // Convert back to lib types (API: step + varyant alanları)
  const toLibIngredients = (items: EditableIngredient[]): lib.Ingredient[] => {
    return toApiIngredients(items);
  };

  const toLibInstructions = (items: EditableInstruction[]): lib.Instruction[] => {
    return toApiInstructions(items);
  };

  // Check for changes
  const checkChanges = useCallback(() => {
    if (!originalRecipe) return false;
    if (title !== originalRecipe.title) return true;
    return true;
  }, [originalRecipe, title]);

  useEffect(() => {
    if (recipeId) {
      fetchRecipe();
    } else {
      setError("Tarif ID'si bulunamadı");
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  async function fetchRecipe() {
    if (!recipeId) return;

    try {
      setLoading(true);
      const result = await getRecipeByIdAction(recipeId);
      if (result.data) {
        setOriginalRecipe(result.data);
        setTitle(result.data.title);
        setCategory(result.data.category || null);
        setIngredients(toEditableIngredients(result.data.ingredients));
        setInstructions(toEditableInstructions(result.data.instructions));
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

  // Handle back button
  function handleBack() {
    if (hasChanges) {
      setShowExitDialog(true);
    } else {
      router.back();
    }
  }

  // Handle save
  async function handleSave() {
    if (!recipeId || !user?.id) return;

    let saveTitle = title;
    let saveIngredients = ingredients;
    let saveInstructions = instructions;

    if (editView === "json") {
      const { payload, error: parseError } = parseJsonPayload(jsonText);
      if (parseError || !payload) {
        setJsonError(parseError ?? "Geçersiz JSON");
        setError(parseError ?? "Geçersiz JSON");
        return;
      }
      const editable = payloadToEditable(payload);
      saveTitle = editable.title;
      saveIngredients = editable.ingredients;
      saveInstructions = editable.instructions;
    }

    try {
      setSaving(true);
      setError(null);
      setJsonError(null);

      // Get Supabase user ID
      const userResult = await getOrCreateUserAction(user.id);
      if (!userResult.data) {
        setError(userResult.error || "Kullanıcı bilgisi alınamadı");
        return;
      }

      const result = await updateRecipeAction(
        recipeId,
        userResult.data.id,
        saveTitle,
        toLibIngredients(saveIngredients),
        toLibInstructions(saveInstructions),
        category
      );

      if (result.data) {
        setHasChanges(false);
        router.push(`/apps/recipe?id=${recipeId}`);
      } else {
        setError(result.error || "Tarif güncellenemedi");
      }
    } catch (err) {
      console.error(err);
      setError("Tarif kaydedilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  }

  // Ingredient handlers
  function handleIngredientUpdate(id: string, updates: Partial<EditableIngredient>) {
    setIngredients((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    setHasChanges(true);
  }

  function handleIngredientDelete(id: string) {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
    setHasChanges(true);
  }

  function handleIngredientAdd() {
    setIngredients((prev) => [...prev, { id: generateId(), name: "", amount: "" }]);
    setHasChanges(true);
  }

  function handleIngredientDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setIngredients((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  }

  // Instruction handlers
  function handleInstructionUpdate(id: string, updates: Partial<EditableInstruction>) {
    setInstructions((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    setHasChanges(true);
  }

  function handleInstructionDelete(id: string) {
    setInstructions((prev) => prev.filter((item) => item.id !== id));
    setHasChanges(true);
  }

  function handleInstructionAdd() {
    setInstructions((prev) => [...prev, { id: generateId(), index: prev.length + 1, text: "" }]);
    setHasChanges(true);
  }

  function switchEditView(next: EditView) {
    if (next === editView) return;

    if (next === "json") {
      setJsonText(serializeToJson());
      setJsonError(null);
      setEditView("json");
      return;
    }

    const { payload, error: parseError } = parseJsonPayload(jsonText);
    if (parseError || !payload) {
      setJsonError(parseError ?? "Geçersiz JSON");
      return;
    }
    applyRecipePayload(payload);
    setJsonError(null);
    setEditView("form");
    setHasChanges(true);
  }

  function handleInstructionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setInstructions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
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
  if (error && !originalRecipe) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <header className="px-4 py-3 max-w-xl mx-auto w-full">
          <button onClick={() => router.back()} className="shrink-0 flex items-center justify-center w-8 h-8 bg-white rounded-lg border border-gray-200/60 active:scale-95 transition-all">
            <CaretLeft size={14} weight="bold" className="text-orange-500" />
          </button>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 max-w-xl mx-auto w-full">
          <p className="text-red-500">{error}</p>
        </main>
      </div>
    );
  }

  const viewTabClass = (active: boolean) =>
    `flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 max-w-xl mx-auto w-full">
          <button onClick={handleBack} className="shrink-0 flex items-center justify-center w-8 h-8 bg-white rounded-lg border border-gray-200/60 active:scale-95 transition-all">
            <CaretLeft size={14} weight="bold" className="text-orange-500" />
          </button>
          <h1 className="flex-1 min-w-0 text-sm font-black text-gray-900 text-center uppercase tracking-tight leading-tight">Tarifi Düzenle</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="shrink-0 flex items-center justify-center w-8 h-8 text-green-600 hover:bg-green-50 bg-white rounded-lg border border-gray-200/60 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            ) : (
              <Check size={16} weight="bold" />
            )}
          </button>
        </div>
      </header>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kaydedilmemiş değişiklikler</AlertDialogTitle>
            <AlertDialogDescription>
              Yaptığınız değişiklikler kaydedilmedi. Çıkmak istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.back()}
              className="bg-red-600 hover:bg-red-700"
            >
              Çık
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Banner */}
      {error && (
        <div className="px-4 mt-4 max-w-xl mx-auto w-full">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-4 py-4 pb-20 max-w-xl mx-auto w-full overflow-y-auto">
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 mb-4">
          <button type="button" onClick={() => switchEditView("form")} className={viewTabClass(editView === "form")}>
            Form
          </button>
          <button type="button" onClick={() => switchEditView("json")} className={viewTabClass(editView === "json")}>
            JSON
          </button>
        </div>

        {editView === "json" ? (
          <div>
            <RecipeJsonGuide />
            {jsonError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {jsonError}
              </div>
            )}
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setJsonError(null);
                setHasChanges(true);
              }}
              spellCheck={false}
              className="w-full min-h-[calc(100vh-220px)] p-4 bg-white border border-gray-200 rounded-xl font-mono text-xs leading-relaxed resize-y focus:outline-none focus:border-orange-500/40"
            />
          </div>
        ) : (
          <>
            {/* Title Input */}
            <div className="mb-5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tarif Adı</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="Tarif adını girin"
                className="w-full px-4 py-3 border border-gray-200/60 rounded-xl focus:outline-none focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/20 bg-white font-bold text-gray-800 text-base shadow-sm"
              />
            </div>

            {/* Category Selector */}
            <div className="mb-6">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Kategori</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(category === cat ? null : cat);
                      setHasChanges(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      category === cat
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200/60 hover:border-orange-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredients Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Malzemeler</label>
                <button
                  onClick={handleIngredientAdd}
                  className="flex items-center gap-1 text-orange-500 text-xs font-black uppercase hover:text-orange-600 tracking-wider active:scale-95 transition-all"
                >
                  <Plus size={16} weight="bold" />
                  Ekle
                </button>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleIngredientDragEnd}>
                <SortableContext items={ingredients.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  {ingredients.map((ingredient) => (
                    <SortableIngredientItem
                      key={ingredient.id}
                      item={ingredient}
                      onUpdate={handleIngredientUpdate}
                      onDelete={handleIngredientDelete}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {ingredients.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">Henüz malzeme eklenmedi</p>
              )}
            </div>

            {/* Instructions Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Yapılış</label>
                <button
                  onClick={handleInstructionAdd}
                  className="flex items-center gap-1 text-orange-500 text-xs font-black uppercase hover:text-orange-600 tracking-wider active:scale-95 transition-all"
                >
                  <Plus size={16} weight="bold" />
                  Ekle
                </button>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleInstructionDragEnd}>
                <SortableContext items={instructions.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  {instructions.map((instruction, index) => (
                    <SortableInstructionItem
                      key={instruction.id}
                      item={instruction}
                      index={index}
                      onUpdate={handleInstructionUpdate}
                      onDelete={handleInstructionDelete}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {instructions.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">Henüz yapılış adımı eklenmedi</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function EditRecipePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      }
    >
      <EditRecipeContent />
    </Suspense>
  );
}
