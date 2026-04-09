export type Category = 
  | "talk-show" 
  | "macera" 
  | "korku" 
  | "egitim" 
  | "eglence" 
  | "oyun" 
  | "bilim" 
  | "muzik" 
  | "komedi" 
  | "teknoloji";

export type SeriesStatus = "devam-ediyor" | "tamamlandi";

export interface Episode {
  id: string;
  title: string;
  episodeNumber: number;
  duration: string;
  youtubeId: string;
  thumbnail?: string;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  creator: string;
  youtubeId: string;
  category: Category;
  status: SeriesStatus;
  year: number;
  episodeCount: number;
  avgRating: number;
  ratingCount: number;
  gradient?: string;
  emoji?: string;
  tags?: string[];
  episodes?: Episode[];
}

export const CATEGORY_LABELS: Record<Category, string> = {
  "talk-show": "Talk Show",
  macera: "Macera",
  korku: "Korku",
  egitim: "Eğitim",
  eglence: "Eğlence",
  oyun: "Oyun",
  bilim: "Bilim",
  muzik: "Müzik",
  komedi: "Komedi",
  teknoloji: "Teknoloji",
};
