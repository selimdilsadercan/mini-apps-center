import {
  YoutubeLogo,
  GameController,
  ChefHat,
  Cards,
  Robot,
  ProjectorScreen,
  MaskHappy,
  VideoCamera,
  MapTrifold,
  CreditCard,
  ChartBar,
  IconProps,
  Basket,
  Trophy,
  Sparkle,
  Compass,
} from "@phosphor-icons/react";
import React from "react";

export type AppCategory =
  | "Utilities"
  | "Board Games & Fun"
  | "Entertainment"
  | "Simulations"
  | "Local Services"
  | "Lifestyle";

export interface MiniApp {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType<IconProps>;
  category: AppCategory;
  color: string;
  href: string;
  isImplemented?: boolean;
}

/**
 * Generates the correct URL for a mini app.
 */
export function getAppHref(app: MiniApp): string {
  return app.href;
}

export const MINI_APPS: MiniApp[] = [
  // Utilities
  {
    id: "subcenter",
    name: "Subscription Center",
    description: "Track all your subscriptions & spending",
    icon: CreditCard,
    category: "Utilities",
    color: "#339AF0",
    href: "/apps/subcenter",
    isImplemented: true,
  },

  // Games
  {
    id: "iskambil",
    name: "Card Game Codex",
    description: "Rules and detailed guides for classic card games",
    icon: Cards,
    category: "Board Games & Fun",
    color: "#e03131",
    href: "/apps/iskambil",
    isImplemented: true,    
  },
  {
    id: "catan-bot",
    name: "Catan Bot",
    description: "Helper for Catan board game",
    icon: Robot,
    category: "Board Games & Fun",
    color: "#845EF7",
    href: "/apps/catan-bot",
    isImplemented: true,
  },
  {
    id: "game-companion",
    name: "Eşlikçi",
    description: "Board game companion and score tracker",
    icon: GameController,
    category: "Board Games & Fun",
    color: "#228BE6",
    href: "/apps/game-companion",
    isImplemented: true,
  },
  {
    id: "tournament-manager",
    name: "Turnuva Merkezi",
    description: "Lig ve Eleme usulü turnuvalar oluştur ve yönet",
    icon: Trophy,
    category: "Board Games & Fun",
    color: "#FCC419",
    href: "/apps/tournament-editor",
    isImplemented: true,
  },

  // Entertainment
  {
    id: "youtube-series",
    name: "Youtube Discover",
    description: "Yeni seriler keşfet ve izleme listeni yönet",
    icon: YoutubeLogo,
    category: "Entertainment",
    color: "#FF0000",
    href: "/apps/youtube-discover",
    isImplemented: true,
  },
  {
    id: "film-graph",
    name: "Film Graph",
    description: "Explore connections between movies",
    icon: ProjectorScreen,
    category: "Entertainment",
    color: "#ef4444",
    href: "/apps/film-graph",
    isImplemented: true,
  },
  {
    id: "movies-this-year",
    name: "Movies This Year",
    description: "Bu yılın en popüler ve beklenen filmlerini keşfet",
    icon: VideoCamera,
    category: "Entertainment",
    color: "#E50914",
    href: "/apps/movies-this-year",
    isImplemented: true,
  },

  // Dev & Design
  {
    id: "meme-sorts",
    name: "Meme Sorts",
    description: "BogoSort, StalinSort, ThanosSort...",
    icon: ChartBar,
    category: "Simulations",
    color: "#748FFC",
    href: "/apps/meme-sorts",
    isImplemented: true,
  },
  {
    id: "itu-yemekhane",
    name: "İTÜ Yemekhane",
    description: "Günün menüsünü takip et ve bildirim al",
    icon: ChefHat,
    category: "Local Services",
    color: "#001A33",
    href: "/apps/itu-yemekhane",
    isImplemented: true,
  },
  {
    id: "kiler",
    name: "Kiler",
    description: "Evdeki stoklarını yönet ve bayatlamadan tüket",
    icon: Basket,
    category: "Lifestyle",
    color: "#40C057",
    href: "/apps/kiler",
    isImplemented: true,
  },
  {
    id: "sticker-editor",
    name: "Sticker Maker",
    description: "WhatsApp için kendi sticker paketlerini tasarla",
    icon: MaskHappy,
    category: "Lifestyle",
    color: "#25D366",
    href: "/apps/sticker-editor",
    isImplemented: true,
  },
  {
    id: "map-tracker",
    name: "Harita Takip",
    description: "Google Maps listelerini import et ve gitme durumunu takip et",
    icon: MapTrifold,
    category: "Lifestyle",
    color: "#4dabf7",
    href: "/apps/map-tracker",
    isImplemented: true,
  },
  {
    id: "chocolate-db",
    name: "ChocolateDB",
    description: "Çikolataların IMDB'si! Favori çikolatanı bul, puanla ve yorumla.",
    icon: Basket,
    category: "Lifestyle",
    color: "#7B3F00",
    href: "/apps/chocolate-db",
    isImplemented: true,
  },
  {
    id: "meal-planner",
    name: "Meal Planner",
    description: "Plan your weekly meals",
    icon: ChefHat,
    category: "Lifestyle",
    color: "#FCC419",
    href: "/apps/recipe",
    isImplemented: true,
  },
  {
    id: "do-this-instead",
    name: "Do This Instead",
    description: "Stop scrolling, start living. Get a quick suggestion on what to do today!",
    icon: Sparkle,
    category: "Lifestyle",
    color: "#FA5252",
    href: "/apps/stop-scroll",
    isImplemented: true,
  },
  {
    id: "hobby-center",
    name: "Hobby Center",
    description: "Yeni hobiler keşfet, yol haritalarını takip et ve kaynaklara eriş!",
    icon: Compass,
    category: "Lifestyle",
    color: "#D4AF37",
    href: "/apps/hobby-center",
    isImplemented: true,
  },
];
