"use client";

import { useMemo, useState } from "react";
import { CaretLeft, CaretRight, Check, Plus, Books, X } from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import {
  EDUCATION_LEVELS,
  type EducationLevel,
  type StudySubjectSettings,
  getActiveSubjects,
  getCatalogSubjects,
  getEducationLevelLabel,
} from "./studySubjectSettings";

const ACCENT = "#2563EB";

interface StudySettingsPanelProps {
  settings: StudySubjectSettings;
  onOpenSubjectPicker?: () => void;
}

export function StudySettingsMenu({ settings, onOpenSubjectPicker }: StudySettingsPanelProps) {
  const activeCount = getActiveSubjects(settings).length;
  const levelLabel = getEducationLevelLabel(settings.educationLevel);
  const levelEmoji = EDUCATION_LEVELS.find((l) => l.id === settings.educationLevel)?.emoji ?? "📚";

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Genel</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        <button
          type="button"
          onClick={onOpenSubjectPicker}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors"
        >
          <span className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg shrink-0">
            📚
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900">Derslerim</p>
            <p className="text-[11px] font-bold text-gray-400 mt-0.5">
              {levelEmoji} {levelLabel} · {activeCount} ders seçili
            </p>
          </div>
          <CaretRight size={16} weight="bold" className="text-gray-300 shrink-0" />
        </button>
      </div>
    </div>
  );
}

interface SubjectPickerPanelProps {
  settings: StudySubjectSettings;
  onChange: (next: StudySubjectSettings) => void;
  onBack: () => void;
}

export function SubjectPickerPanel({ settings, onChange, onBack }: SubjectPickerPanelProps) {
  const [customDraft, setCustomDraft] = useState("");

  const catalogSubjects = useMemo(
    () => getCatalogSubjects(settings.educationLevel),
    [settings.educationLevel]
  );

  const selectedCount = settings.selectedSlugs.length;
  const totalCount = catalogSubjects.length;

  function handleLevelChange(level: EducationLevel) {
    const subjects = getCatalogSubjects(level);
    onChange({
      educationLevel: level,
      selectedSlugs: subjects.map((s) => s.slug),
      customSubjects: settings.customSubjects,
    });
  }

  function toggleSubject(slug: string) {
    const selected = new Set(settings.selectedSlugs);
    if (selected.has(slug)) selected.delete(slug);
    else selected.add(slug);
    onChange({ ...settings, selectedSlugs: Array.from(selected) });
  }

  function selectAll() {
    onChange({
      ...settings,
      selectedSlugs: catalogSubjects.map((s) => s.slug),
    });
  }

  function clearAll() {
    onChange({ ...settings, selectedSlugs: [] });
  }

  function addCustomSubject() {
    const name = customDraft.trim();
    if (!name) return;

    const active = getActiveSubjects(settings);
    if (active.some((s) => s.name.toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR"))) {
      toast.error("Bu ders zaten listede");
      return;
    }

    onChange({
      ...settings,
      customSubjects: [...settings.customSubjects, name],
    });
    setCustomDraft("");
    toast.success("Ders eklendi");
  }

  function removeCustomSubject(name: string) {
    onChange({
      ...settings,
      customSubjects: settings.customSubjects.filter((s) => s !== name),
    });
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-gray-500 active:scale-[0.98]"
      >
        <CaretLeft size={14} weight="bold" style={{ color: ACCENT }} />
        Ayarlara dön
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Eğitim seviyesi</p>
          <p className="text-[11px] font-medium text-gray-500 mt-1">Seviyene göre ders listesi güncellenir.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {EDUCATION_LEVELS.map((level) => {
            const active = settings.educationLevel === level.id;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => handleLevelChange(level.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
                  active
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200"
                    : "bg-gray-50 border-gray-100 text-gray-700"
                }`}
              >
                <span className="text-lg leading-none">{level.emoji}</span>
                <span className="text-[11px] font-black uppercase">{level.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ders listesi</p>
            <p className="text-xs font-black text-gray-900 mt-0.5">
              {selectedCount}/{totalCount} seçili
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={selectAll}
              className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100"
            >
              Tümü
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase bg-gray-50 text-gray-500 border border-gray-100"
            >
              Temizle
            </button>
          </div>
        </div>

        <ul className="divide-y divide-gray-50">
          {catalogSubjects.map((subject) => {
            const selected = settings.selectedSlugs.includes(subject.slug);
            return (
              <li key={subject.slug}>
                <button
                  type="button"
                  onClick={() => toggleSubject(subject.slug)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-gray-50 ${
                    selected ? "bg-blue-50/30" : ""
                  }`}
                >
                  <span
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                      selected ? "bg-white border-blue-100 shadow-sm" : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    {subject.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black truncate ${selected ? "text-gray-900" : "text-gray-400"}`}>
                      {subject.name}
                    </p>
                  </div>
                  <span
                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                      selected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 bg-white"
                    }`}
                  >
                    {selected && <Check size={14} weight="bold" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Özel dersler</p>
          <p className="text-[11px] font-medium text-gray-500 mt-1">Listede olmayan dersleri buraya ekle.</p>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">✨</span>
              <input
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                placeholder="Deneme sınavı, Koçluk..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:border-blue-300"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSubject();
                  }
                }}
              />
            </div>
            <button
              type="button"
              disabled={!customDraft.trim()}
              onClick={addCustomSubject}
              className="shrink-0 w-11 h-11 rounded-xl text-white flex items-center justify-center disabled:opacity-40 active:scale-95"
              style={{ backgroundColor: ACCENT }}
            >
              <Plus size={18} weight="bold" />
            </button>
          </div>

          {settings.customSubjects.length > 0 ? (
            <ul className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
              {settings.customSubjects.map((name) => (
                <li key={name} className="flex items-center gap-3 px-3 py-3 bg-blue-50/20">
                  <span className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-lg">
                    ✨
                  </span>
                  <p className="flex-1 text-sm font-black text-gray-900 truncate">{name}</p>
                  <button
                    type="button"
                    onClick={() => removeCustomSubject(name)}
                    className="w-8 h-8 rounded-lg border border-red-100 bg-red-50 text-red-500 flex items-center justify-center"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-3 py-4 px-2 text-gray-400">
              <Books size={20} weight="duotone" />
              <p className="text-xs font-bold">Henüz özel ders eklenmedi.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
