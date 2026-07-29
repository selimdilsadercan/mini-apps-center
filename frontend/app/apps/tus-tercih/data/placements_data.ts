import fullDataset from "./tus_placements.json";

export interface TUSPeriodHistory {
  period: string;
  score: number | null;
  quota: number | null;
  rank?: number | null;
}

export interface TUSSpecialty {
  slug: string;
  name: string;
  educationYears: number;
  institutionCount: number;
  minScore: number | null;
  maxScore: number | null;
  totalQuota: number | null;
  placed: number | null;
}

export interface TUSPlacement {
  id: string;
  specialtySlug: string;
  specialtyName: string;
  educationYears: number;
  institutionName: string;
  institutionType: string;
  history: TUSPeriodHistory[];
}

export interface TUSDataset {
  scrapedAt: string;
  source: string;
  specialties: TUSSpecialty[];
  placements: TUSPlacement[];
}

const dataset = fullDataset as TUSDataset;

export const TUS_SPECIALTIES: TUSSpecialty[] = dataset.specialties;
export const TUS_PLACEMENTS: TUSPlacement[] = dataset.placements;
