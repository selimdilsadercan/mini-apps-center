export interface SectionProgress {
  completions: number;
  lastCompletedAt?: string;
}

export interface BookProgress {
  sections: Record<string, SectionProgress>;
}

export type AllProgress = Record<string, BookProgress>;

const STORAGE_KEY = (userId: string) => `tus_kitap_progress_${userId}`;

export function loadProgress(userId: string): AllProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProgress(userId: string, progress: AllProgress): void {
  localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(progress));
}

export function getSectionProgress(
  progress: AllProgress,
  bookId: string,
  sectionId: string
): SectionProgress {
  return progress[bookId]?.sections[sectionId] ?? { completions: 0 };
}

export function incrementSection(
  progress: AllProgress,
  bookId: string,
  sectionId: string
): AllProgress {
  const current = getSectionProgress(progress, bookId, sectionId);
  const updated: AllProgress = {
    ...progress,
    [bookId]: {
      sections: {
        ...(progress[bookId]?.sections ?? {}),
        [sectionId]: {
          completions: current.completions + 1,
          lastCompletedAt: new Date().toISOString(),
        },
      },
    },
  };
  return updated;
}

export function decrementSection(
  progress: AllProgress,
  bookId: string,
  sectionId: string
): AllProgress {
  const current = getSectionProgress(progress, bookId, sectionId);
  if (current.completions <= 0) return progress;

  const updated: AllProgress = {
    ...progress,
    [bookId]: {
      sections: {
        ...(progress[bookId]?.sections ?? {}),
        [sectionId]: {
          ...current,
          completions: current.completions - 1,
        },
      },
    },
  };
  return updated;
}

export function getBookCompletionStats(
  progress: AllProgress,
  bookId: string,
  sectionCount: number
): { completedSections: number; totalCompletions: number; percent: number } {
  const bookProgress = progress[bookId]?.sections ?? {};
  const values = Object.values(bookProgress);
  const completedSections = values.filter((s) => s.completions > 0).length;
  const totalCompletions = values.reduce((sum, s) => sum + s.completions, 0);
  const percent = sectionCount > 0 ? Math.round((completedSections / sectionCount) * 100) : 0;
  return { completedSections, totalCompletions, percent };
}
