"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CaretLeft,
  CaretRight,
  Plus,
  Check,
  Trash,
  GraduationCap,
  CalendarBlank,
  Gear,
  Minus,
  FileText,
  BookOpen,
  Exam,
  NotePencil,
  type Icon,
} from "@phosphor-icons/react";
import { Drawer } from "vaul";
import { toast } from "react-hot-toast";
import { getAppRootUrl } from "@/lib/apps";
import { createBrowserClient } from "@/lib/api";
import { study } from "@/lib/client";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { StudySettingsMenu, SubjectPickerPanel } from "./StudySettingsPanel";
import {
  type StudySubjectSettings,
  getActiveSubjects,
  getDefaultSettings,
  getSubjectEmoji,
  loadStudySubjectSettings,
  saveStudySubjectSettings,
} from "./studySubjectSettings";

const client = createBrowserClient();
const ACCENT = "#2563EB";

type MainTab = "plan" | "settings";
type SettingsView = "menu" | "subjects";
type PlanItemType = study.PlanItemType;

const DAY_LABELS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const ITEM_TYPES: { key: PlanItemType; label: string; icon: Icon; unit: string; placeholder: string }[] = [
  { key: "worksheet", label: "Ödev föyü", icon: FileText, unit: "adet", placeholder: "Örn: Sosyal ödev föyü" },
  { key: "reading", label: "Kitap", icon: BookOpen, unit: "sayfa", placeholder: "Örn: 50 sayfa kitap" },
  { key: "test", label: "Test", icon: Exam, unit: "test", placeholder: "Örn: Mozaik rasyonel" },
  { key: "free", label: "Serbest", icon: NotePencil, unit: "", placeholder: "Örn: Tekrar çalış" },
];

function pillTabClass(active: boolean) {
  return `inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] ${
    active
      ? "bg-white text-gray-900 shadow-sm"
      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
  }`;
}

function subjectChipClass(active: boolean) {
  return `inline-flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black border transition-all active:scale-[0.98] ${
    active ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200"
  }`;
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDayHeader(weekStart: Date, dayIndex: number) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

function formatWeekRange(weekStart: Date) {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const startStr = weekStart.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  const endStr = end.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  return `${startStr} – ${endStr}`;
}

function itemTypeLabel(type: PlanItemType) {
  return ITEM_TYPES.find((t) => t.key === type)?.label ?? type;
}

function formatItemMeta(item: study.PlanItem) {
  if (item.itemType === "test" && item.targetValue != null) {
    return `${item.completedValue}/${item.targetValue} test`;
  }
  if (item.targetValue != null && item.targetUnit) {
    return `${item.targetValue} ${item.targetUnit}`;
  }
  return null;
}

export default function StudyPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const queryClient = useQueryClient();
  const { confirm } = useConfirmDialog();

  const [mainTab, setMainTab] = useState<MainTab>("plan");
  const [settingsView, setSettingsView] = useState<SettingsView>("menu");
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [weeklyNotesDraft, setWeeklyNotesDraft] = useState("");
  const [subjectSettings, setSubjectSettings] = useState<StudySubjectSettings>(() => getDefaultSettings());
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [itemDrawerOpen, setItemDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<study.PlanItem | null>(null);
  const [addDay, setAddDay] = useState(1);
  const [addSubject, setAddSubject] = useState("");
  const [addType, setAddType] = useState<PlanItemType>("worksheet");
  const [addTitle, setAddTitle] = useState("");
  const [addTarget, setAddTarget] = useState("");
  const [savingItem, setSavingItem] = useState(false);

  const weekStartIso = formatIsoDate(weekStart);

  useEffect(() => {
    if (!user?.id) {
      setSettingsLoaded(false);
      return;
    }
    setSubjectSettings(loadStudySubjectSettings(user.id));
    setSettingsLoaded(true);
  }, [user?.id]);

  const activeSubjects = useMemo(
    () => getActiveSubjects(subjectSettings),
    [subjectSettings]
  );

  const drawerSubjects = useMemo(() => {
    const list = [...activeSubjects];
    if (editingItem && editingItem.subject !== "Genel") {
      const exists = list.some((s) => s.name === editingItem.subject);
      if (!exists) {
        list.unshift({ name: editingItem.subject, emoji: "📚" });
      }
    }
    return list;
  }, [activeSubjects, editingItem]);

  const persistSubjectSettings = useCallback(
    (next: StudySubjectSettings) => {
      setSubjectSettings(next);
      if (user?.id) saveStudySubjectSettings(user.id, next);
    },
    [user?.id]
  );

  const planQuery = useQuery({
    queryKey: ["study", "plan", user?.id, weekStartIso],
    queryFn: () =>
      client.study.getWeeklyPlan(user!.id, {
        weekStart: weekStartIso,
      }),
    enabled: isUserLoaded && !!user?.id,
  });

  const plan = planQuery.data?.plan;

  useEffect(() => {
    setWeeklyNotesDraft("");
  }, [weekStartIso]);

  useEffect(() => {
    if (plan) {
      setWeeklyNotesDraft(plan.weeklyNotes ?? "");
    }
  }, [plan?.planId, plan?.weeklyNotes]);

  const itemsByDay = useMemo(() => {
    const map = new Map<number, study.PlanItem[]>();
    for (let i = 1; i <= 7; i++) map.set(i, []);
    for (const item of plan?.items ?? []) {
      map.get(item.dayOfWeek)?.push(item);
    }
    for (const [, items] of map) {
      items.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [plan?.items]);

  const invalidatePlan = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["study", "plan", user?.id, weekStartIso],
    });
  }, [queryClient, user?.id, weekStartIso]);

  async function saveWeeklyNotes() {
    if (!user) return;
    try {
      await client.study.setWeeklyNotes({
        userId: user.id,
        weekStart: weekStartIso,
        notes: weeklyNotesDraft,
      });
      toast.success("Haftalık not kaydedildi");
      invalidatePlan();
    } catch {
      toast.error("Not kaydedilemedi");
    }
  }

  async function handleToggleItem(item: study.PlanItem) {
    if (!user) return;
    const newDone = !item.isDone;
    try {
      await client.study.updatePlanItem({
        userId: user.id,
        itemId: item.id,
        isDone: newDone,
        completedValue: newDone && item.targetValue != null ? item.targetValue : item.completedValue,
      });
      invalidatePlan();
    } catch {
      toast.error("Güncellenemedi");
    }
  }

  async function handleAdjustTestCount(item: study.PlanItem, delta: number) {
    if (!user || item.itemType !== "test") return;
    const max = item.targetValue ?? 999;
    const next = Math.max(0, Math.min(max, item.completedValue + delta));
    try {
      await client.study.updatePlanItem({
        userId: user.id,
        itemId: item.id,
        completedValue: next,
        isDone: item.targetValue != null && next >= item.targetValue,
      });
      invalidatePlan();
    } catch {
      toast.error("Güncellenemedi");
    }
  }

  async function handleDeleteItem(item: study.PlanItem) {
    if (!user) return;
    const ok = await confirm({
      title: "Madde silinsin mi?",
      description: `"${item.title}" kaldırılacak.`,
      confirmText: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await client.study.deletePlanItem(item.id, { userId: user.id });
      closeItemDrawer();
      invalidatePlan();
    } catch {
      toast.error("Silinemedi");
    }
  }

  function closeItemDrawer() {
    setItemDrawerOpen(false);
    setEditingItem(null);
  }

  function openAddDrawer(dayOfWeek: number) {
    setEditingItem(null);
    setAddDay(dayOfWeek);
    setAddSubject(activeSubjects[0]?.name ?? "");
    setAddType("worksheet");
    setAddTitle("");
    setAddTarget("");
    setItemDrawerOpen(true);
  }

  function openEditDrawer(item: study.PlanItem) {
    setEditingItem(item);
    setAddDay(item.dayOfWeek);
    setAddSubject(item.subject !== "Genel" ? item.subject : activeSubjects[0]?.name ?? "");
    setAddType(item.itemType);
    setAddTitle(item.title);
    setAddTarget(item.targetValue != null ? String(item.targetValue) : "");
    setItemDrawerOpen(true);
  }

  async function handleSaveItem() {
    if (!user || savingItem) return;
    const title = addTitle.trim();
    if (!title) return;
    const typeMeta = ITEM_TYPES.find((t) => t.key === addType)!;
    const subject = addSubject.trim() || activeSubjects[0]?.name || "Genel";
    const targetValue = addType !== "free" && addTarget ? Number(addTarget) : undefined;
    const targetUnit = addType !== "free" ? typeMeta.unit || undefined : undefined;

    setSavingItem(true);
    try {
      if (editingItem) {
        const nextTarget = addType !== "free" ? targetValue : undefined;
        const nextCompleted =
          addType === "test" && nextTarget != null
            ? Math.min(editingItem.completedValue, nextTarget)
            : editingItem.completedValue;
        await client.study.updatePlanItem({
          userId: user.id,
          itemId: editingItem.id,
          subject,
          itemType: addType,
          title,
          targetValue: nextTarget,
          targetUnit: addType !== "free" ? targetUnit : undefined,
          completedValue: nextCompleted,
          isDone: addType === "test" && nextTarget != null ? nextCompleted >= nextTarget : editingItem.isDone,
        });
        closeItemDrawer();
        invalidatePlan();
        toast.success("Güncellendi");
      } else {
        await client.study.addPlanItem({
          userId: user.id,
          weekStart: weekStartIso,
          dayOfWeek: addDay,
          subject,
          itemType: addType,
          title,
          targetValue,
          targetUnit,
        });
        closeItemDrawer();
        invalidatePlan();
        toast.success("Eklendi");
      }
    } catch {
      toast.error(editingItem ? "Güncellenemedi" : "Eklenemedi");
    } finally {
      setSavingItem(false);
    }
  }

  function shiftWeek(delta: number) {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta * 7);
      return next;
    });
  }

  function openSubjectSettings() {
    setMainTab("settings");
    setSettingsView("subjects");
  }

  const loading = !isUserLoaded || (user && (planQuery.isLoading || !settingsLoaded));

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900">
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            >
              <CaretLeft size={14} weight="bold" style={{ color: ACCENT }} />
            </button>
            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
              <GraduationCap size={18} weight="fill" style={{ color: ACCENT }} className="shrink-0" />
              <span className="truncate">
                Haftalık <span style={{ color: ACCENT }}>Plan</span>
              </span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100 mt-2.5">
            <button type="button" onClick={() => { setMainTab("plan"); setSettingsView("menu"); }} className={pillTabClass(mainTab === "plan")}>
              <CalendarBlank size={14} weight={mainTab === "plan" ? "fill" : "duotone"} />
              Plan
            </button>
            <button type="button" onClick={() => { setMainTab("settings"); setSettingsView("menu"); }} className={pillTabClass(mainTab === "settings")}>
              <Gear size={14} weight={mainTab === "settings" ? "fill" : "duotone"} />
              Ayarlar
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">
        {!user ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm font-bold text-gray-500">Plan oluşturmak için giriş yap.</p>
          </div>
        ) : loading ? (
          <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            Yükleniyor...
          </div>
        ) : mainTab === "settings" ? (
          settingsView === "subjects" ? (
            <SubjectPickerPanel
              settings={subjectSettings}
              onChange={persistSubjectSettings}
              onBack={() => setSettingsView("menu")}
            />
          ) : (
            <StudySettingsMenu
              settings={subjectSettings}
              onOpenSubjectPicker={() => setSettingsView("subjects")}
            />
          )
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => shiftWeek(-1)} className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-500">
                  <CaretLeft size={14} weight="bold" />
                </button>
                <div className="text-center flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Haftalık Program</p>
                  <p className="text-xs font-black text-gray-900 truncate">{formatWeekRange(weekStart)}</p>
                </div>
                <button type="button" onClick={() => shiftWeek(1)} className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-500">
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>
              {formatIsoDate(weekStart) !== formatIsoDate(getMonday(new Date())) && (
                <button
                  type="button"
                  onClick={() => setWeekStart(getMonday(new Date()))}
                  className="w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 active:scale-[0.98]"
                >
                  Bu hafta
                </button>
              )}
            </div>

            {activeSubjects.length === 0 && (
              <button
                type="button"
                onClick={openSubjectSettings}
                className="w-full py-3 rounded-2xl bg-amber-50 border border-amber-100 text-xs font-black uppercase text-amber-700 active:scale-[0.98]"
              >
                Önce Ayarlar&apos;dan derslerini seç
              </button>
            )}

            <div className="space-y-3">
              {DAY_LABELS.map((label, index) => {
                const dayOfWeek = index + 1;
                const items = itemsByDay.get(dayOfWeek) ?? [];

                return (
                  <section key={dayOfWeek} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/40">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
                        <p className="text-xs font-bold text-gray-700">{formatDayHeader(weekStart, index)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openAddDrawer(dayOfWeek)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white active:scale-95"
                        style={{ backgroundColor: ACCENT }}
                      >
                        <Plus size={16} weight="bold" />
                      </button>
                    </div>

                    <div className="p-3 space-y-2 min-h-[48px]">
                      {items.length === 0 ? (
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider text-center py-2">
                          Madde yok
                        </p>
                      ) : (
                        items.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-start gap-2 p-2 rounded-xl border ${
                              item.isDone ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-gray-100"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => void handleToggleItem(item)}
                              className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                                item.isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-200"
                              }`}
                            >
                              {item.isDone && <Check size={14} weight="bold" />}
                            </button>
                            <span
                              className={`mt-0.5 w-9 h-9 rounded-xl border flex items-center justify-center text-lg shrink-0 ${
                                item.isDone ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-gray-100 shadow-sm"
                              }`}
                              aria-hidden
                            >
                              {getSubjectEmoji(item.subject, subjectSettings)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => openEditDrawer(item)}
                                className="w-full text-left"
                              >
                                <p className={`text-xs font-black ${item.isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                  {item.subject !== "Genel" && <span className="text-blue-600">{item.subject} · </span>}
                                  {item.title}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400">
                                  {itemTypeLabel(item.itemType)}
                                  {formatItemMeta(item) ? ` · ${formatItemMeta(item)}` : ""}
                                </p>
                              </button>
                              {item.itemType === "test" && item.targetValue != null && !item.isDone && (
                                <div className="flex items-center gap-2 mt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => void handleAdjustTestCount(item, -1)}
                                    className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500"
                                  >
                                    <Minus size={12} weight="bold" />
                                  </button>
                                  <span className="text-[10px] font-black tabular-nums">
                                    {item.completedValue}/{item.targetValue}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => void handleAdjustTestCount(item, 1)}
                                    className="w-6 h-6 rounded-md border border-gray-200 flex items-center justify-center text-gray-500"
                                  >
                                    <Plus size={12} weight="bold" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Haftalık notlar</p>
              <textarea
                value={weeklyNotesDraft}
                onChange={(e) => setWeeklyNotesDraft(e.target.value)}
                onBlur={() => void saveWeeklyNotes()}
                rows={3}
                placeholder="Haftalık hedefler, hatırlatmalar..."
                className="w-full text-sm font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 outline-none focus:border-blue-200 resize-none"
              />
            </div>
          </div>
        )}
      </main>

      <Drawer.Root open={itemDrawerOpen} onOpenChange={(open) => !open && closeItemDrawer()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-xl flex-col rounded-t-3xl border-t border-gray-200/60 bg-white shadow-2xl outline-none">
            <div className="mx-auto w-10 h-1 rounded-full bg-gray-200 mt-2 mb-1 shrink-0" />
            <Drawer.Title className="px-4 text-lg font-black text-gray-900 uppercase tracking-tight">
              {editingItem ? "Madde Düzenle" : "Madde Ekle"} · {DAY_LABELS[addDay - 1]}
            </Drawer.Title>
            <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3 space-y-3">
              {drawerSubjects.length === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    closeItemDrawer();
                    openSubjectSettings();
                  }}
                  className="w-full py-3 rounded-xl bg-amber-50 border border-amber-100 text-xs font-black uppercase text-amber-700"
                >
                  Ayarlar&apos;dan ders seç
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ders</p>
                  <div className="flex flex-wrap gap-2">
                    {drawerSubjects.map((subject) => (
                      <button
                        key={subject.name}
                        type="button"
                        onClick={() => setAddSubject(subject.name)}
                        className={subjectChipClass(addSubject === subject.name)}
                      >
                        <span>{subject.emoji}</span>
                        {subject.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {ITEM_TYPES.map((type) => {
                  const TypeIcon = type.icon;
                  const active = addType === type.key;
                  return (
                    <button
                      key={type.key}
                      type="button"
                      onClick={() => setAddType(type.key)}
                      className={subjectChipClass(active)}
                    >
                      <TypeIcon size={14} weight={active ? "fill" : "bold"} />
                      {type.label}
                    </button>
                  );
                })}
              </div>
              <input
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder={ITEM_TYPES.find((t) => t.key === addType)?.placeholder}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
              />
              {addType !== "free" && (
                <input
                  value={addTarget}
                  onChange={(e) => setAddTarget(e.target.value)}
                  placeholder={`Hedef (${ITEM_TYPES.find((t) => t.key === addType)?.unit})`}
                  type="number"
                  min={1}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              )}
              <button
                type="button"
                disabled={savingItem || !addTitle.trim() || drawerSubjects.length === 0}
                onClick={() => void handleSaveItem()}
                className="w-full py-3.5 rounded-xl text-white text-xs font-black uppercase tracking-wider disabled:opacity-40"
                style={{ backgroundColor: ACCENT }}
              >
                {editingItem ? "Kaydet" : "Ekle"}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => void handleDeleteItem(editingItem)}
                  className="w-full py-3.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Trash size={16} weight="bold" />
                  Sil
                </button>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
