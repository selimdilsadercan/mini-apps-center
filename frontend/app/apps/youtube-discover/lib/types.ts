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

export type Context = "yemek" | "calisma" | "yuruyus";

export type AttentionLevel = "background" | "light" | "focus";

export type SeriesStatus = "devam-ediyor" | "tamamlandi";

export interface Episode {
  id: string;
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  duration: string;
  youtubeId: string;
  thumbnail?: string;
  publishedAt?: string;
}

export type SourceType = "video" | "playlist" | "channel" | "manual";

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
  contexts?: Context[];
  attentionLevel?: AttentionLevel;
  episodes?: Episode[];
  isRaw?: boolean;
  seasoning?: "manual" | "monthly";
  sourceType?: SourceType;
  sourceUrl?: string;
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

export const CONTEXT_LABELS: Record<Context, string> = {
  yemek: "Yemek Yerken",
  calisma: "Çalışırken",
  yuruyus: "Yürürken",
};

export const CONTEXT_DESCRIPTIONS: Record<Context, string> = {
  yemek: "Eğlenceli sohbetler, komedi ve hafif içerikler",
  calisma: "Dikkat dağıtmayan, arka planda izlenebilir",
  yuruyus: "Hikâye anlatımı ve uzun format podcastler",
};
