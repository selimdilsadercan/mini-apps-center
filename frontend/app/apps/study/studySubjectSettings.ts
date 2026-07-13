import SUBJECT_CATALOG from "./subject_catalog.json";

export type EducationLevel = "ilkokul" | "ortaokul" | "lise" | "universite";

export interface CatalogSubject {
  slug: string;
  name: string;
  emoji: string;
}

export interface ActiveSubject {
  name: string;
  emoji: string;
}

export interface StudySubjectSettings {
  educationLevel: EducationLevel;
  selectedSlugs: string[];
  customSubjects: string[];
}

const STORAGE_PREFIX = "study_subject_settings_";
const CUSTOM_SUBJECT_EMOJI = "✨";

export const EDUCATION_LEVELS = SUBJECT_CATALOG.levels.map((level) => ({
  id: level.id as EducationLevel,
  label: level.label,
  emoji: level.emoji ?? "📚",
}));

export function getCatalogSubjects(level: EducationLevel): CatalogSubject[] {
  const entry = SUBJECT_CATALOG.levels.find((l) => l.id === level);
  return (entry?.subjects ?? []) as CatalogSubject[];
}

export function getDefaultSettings(level: EducationLevel = "lise"): StudySubjectSettings {
  const subjects = getCatalogSubjects(level);
  return {
    educationLevel: level,
    selectedSlugs: subjects.map((s) => s.slug),
    customSubjects: [],
  };
}

export function loadStudySubjectSettings(userId: string): StudySubjectSettings {
  if (typeof window === "undefined") return getDefaultSettings();

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return getDefaultSettings();

    const parsed = JSON.parse(raw) as StudySubjectSettings;
    if (!parsed.educationLevel || !Array.isArray(parsed.selectedSlugs)) {
      return getDefaultSettings();
    }

    return {
      educationLevel: parsed.educationLevel,
      selectedSlugs: parsed.selectedSlugs,
      customSubjects: Array.isArray(parsed.customSubjects) ? parsed.customSubjects : [],
    };
  } catch {
    return getDefaultSettings();
  }
}

export function saveStudySubjectSettings(userId: string, settings: StudySubjectSettings) {
  localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(settings));
}

export function getActiveSubjects(settings: StudySubjectSettings): ActiveSubject[] {
  const catalog = getCatalogSubjects(settings.educationLevel);
  const fromCatalog = catalog
    .filter((s) => settings.selectedSlugs.includes(s.slug))
    .map((s) => ({ name: s.name, emoji: s.emoji }));

  const custom = settings.customSubjects
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name, emoji: CUSTOM_SUBJECT_EMOJI }));

  return [...fromCatalog, ...custom];
}

export function getActiveSubjectNames(settings: StudySubjectSettings): string[] {
  return getActiveSubjects(settings).map((s) => s.name);
}

export function getEducationLevelLabel(level: EducationLevel): string {
  return EDUCATION_LEVELS.find((l) => l.id === level)?.label ?? level;
}

export function getSubjectEmoji(subjectName: string, settings?: StudySubjectSettings): string {
  if (!subjectName || subjectName === "Genel") return "📚";
  if (settings?.customSubjects.includes(subjectName)) return CUSTOM_SUBJECT_EMOJI;

  for (const level of SUBJECT_CATALOG.levels) {
    const found = level.subjects.find((s) => s.name === subjectName);
    if (found) return found.emoji;
  }

  return "📚";
}
