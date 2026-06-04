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
  MusicNotes,
  Palette,
  ListChecks,
  Coffee,
  FilePdf,
  Timer,
  GraduationCap,
  Users,
} from "@phosphor-icons/react";
import React from "react";

export type AppCategory =
  | "Utilities"
  | "Developer Tools"
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
  subdomain?: string;
  isLocal?: boolean;
}

/**
 * Generates the correct URL for a mini app, considering subdomains.
 */
export function getAppHref(app: MiniApp): string {
  if (typeof window === "undefined") return app.href;
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost");

  if (app.subdomain && !isLocal) {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
    return `${protocol}//${app.subdomain}.${rootDomain}`;
  }

  if (isLocal) {
    const primary = port ? `localhost:${port}` : "localhost";
    return `${protocol}//${primary}${app.href}`;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
  return `${protocol}//${rootDomain}${app.href}`;
}

/**
 * Returns the root home URL.
 */
export function getRootHomeUrl(): string {
  if (typeof window === "undefined") return "/home";
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost");

  if (isLocal) {
    const primary = port ? `localhost:${port}` : "localhost";
    return `${protocol}//${primary}/home`;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
  return `${protocol}//${rootDomain}/home`;
}

/**
 * Returns the app root URL on the 'my' subdomain.
 */
export function getAppRootUrl(): string {
  if (typeof window === "undefined") return "/";
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost");

  if (isLocal) {
    const primary = port ? `my.localhost:${port}` : "my.localhost";
    return `${protocol}//${primary}/`;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
  return `${protocol}//my.${rootDomain}/`;
}

export const MINI_APPS: MiniApp[] = [
  // Utilities
  {
    id: "icon-set-guide",
    name: "Icon Set Guide",
    description: "Compare open-source icon sets in real UI previews",
    icon: Palette,
    category: "Developer Tools",
    color: "#4C6EF5",
    href: "/apps/icon-set-guide",
    isImplemented: true,
    subdomain: "iconguide",
  },
  {
    id: "subcenter",
    name: "Subcenter",
    description: "Track all your subscriptions & spending",
    icon: CreditCard,
    category: "Utilities",
    color: "#339AF0",
    href: "/apps/subcenter",
    isImplemented: true,
    subdomain: "subcenter",
  },
  {
    id: "tutor-crm",
    name: "Tutor Place",
    description: "Private tutors management: students, lessons, and payments",
    icon: GraduationCap,
    category: "Utilities",
    color: "#228BE6",
    href: "/apps/tutor-crm",
    isImplemented: true,
    subdomain: "tutorplace",
  },
  {
    id: "pdf-tools",
    name: "Pdf Tools",
    description: "PDF sayfalarını düzenle, yeniden sırala ve sil. Tamamen cihazında çalışır.",
    icon: FilePdf,
    category: "Utilities",
    color: "#E03131",
    href: "/apps/pdf-tools",
    isImplemented: true,
    subdomain: "pdf",
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
    subdomain: "cardgames",
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
    subdomain: "catan",
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
    subdomain: "gamecompanion",
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
    subdomain: "tournaments",
  },
  {
    id: "board-game-clubs",
    name: "Board Game Clubs",
    description: "Oyun kulüplerinin ve kafelerinin kütüphanelerini keşfet ve yönet",
    icon: GameController,
    category: "Board Games & Fun",
    color: "#D4A830",
    href: "/apps/board-game-clubs",
    isImplemented: true,
    subdomain: "bgc",
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
    subdomain: "ytdb",
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
    subdomain: "filmgraph",
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
    subdomain: "movies",
  },
  {
    id: "memedex",
    name: "Memedex",
    description: "Trend meme'ler, doğru kullanım bağlamları ve hazır Giphy template'leri!",
    icon: MaskHappy,
    category: "Entertainment",
    color: "#d946ef",
    href: "/apps/memedex",
    isImplemented: true,
    subdomain: "memedex",
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
    subdomain: "itumeals",
    isLocal: true,
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
    subdomain: "kiler",
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
    subdomain: "sticker",
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
    subdomain: "maptracker",
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
    subdomain: "chocolatedb",
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
    subdomain: "recipe",
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
    subdomain: "instead",
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
    subdomain: "hobby",
  },
  {
    id: "concert-list",
    name: "My Concert List",
    description: "Gittiğin konserleri tarihleri ve notlarınla takip et",
    icon: MusicNotes,
    category: "Lifestyle",
    color: "#FF1493",
    href: "/apps/concert-list",
    isImplemented: true,
    subdomain: "concerts",
  },
  {
    id: "tasket",
    name: "Tasket",
    description: "Notlarını ve görevlerini sepetinde topla, listelerle organize et",
    icon: ListChecks,
    category: "Utilities",
    color: "#20c997",
    href: "/apps/tasket",
    isImplemented: true,
    subdomain: "tasket",
  },
  {
    id: "workplaces",
    name: "Workplaces",
    description: "Çalışmaya uygun kütüphane ve kafeleri keşfet, yenilerini öner",
    icon: Coffee,
    category: "Lifestyle",
    color: "#6F4E37",
    href: "/apps/workplaces",
    isImplemented: true,
    subdomain: "workplaces",
  },
  {
    id: "pomodoro",
    name: "Melt & Work",
    description: "Buz erimesi animasyonlu odaklanma sayacı",
    icon: Timer,
    category: "Utilities",
    color: "#4dabf7",
    href: "/apps/pomodoro",
    isImplemented: true,
    isLocal: true,
    subdomain: "melt",
  },
  {
    id: "kim-gelir",
    name: "Ne Yapsak?",
    description: "Hızlıca aktivite daveti veya anket oluştur, arkadaşlarını davet et ve ortak kararı gör!",
    icon: Users,
    category: "Lifestyle",
    color: "#FF6B6B",
    href: "/apps/kim-gelir",
    isImplemented: true,
    subdomain: "kimgelir",
  },
];
