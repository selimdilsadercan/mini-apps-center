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
  CloudSun,
  FilePdf,
  Timer,
  GraduationCap,
  Users,
  PiggyBank,
  Warning,
  PaperPlaneTilt,
  Buildings,
  Megaphone,
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
  isBeta?: boolean;
  isCancelled?: boolean;
}

/** Capacitor APK/WebView (build flag veya çalışma anı). */
export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  return !!cap?.isNativePlatform?.();
}

/**
 * Generates the correct URL for a mini app, considering subdomains.
 */
export function getAppHref(app: MiniApp): string {
  if (typeof window === "undefined") return app.href;

  // Capacitor / localhost WebView: subdomain yok, iç path kullan.
  if (
    process.env.NEXT_PUBLIC_CAPACITOR === "true" ||
    isCapacitorNative()
  ) {
    return app.href;
  }

  const hostname = window.location.hostname;
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost");

  const port = window.location.port;
  const protocol = window.location.protocol;

  if (isLocal) {
    return app.href;
  }

  if (app.subdomain) {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
    return `${protocol}//${app.subdomain}.${rootDomain}`;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
  return `${protocol}//${rootDomain}${app.href}`;
}

/**
 * Mini app açma — telefonda aynı origin ise router.push, değilse tam URL.
 */
export function navigateToMiniApp(
  app: MiniApp,
  router: { push: (href: string) => void },
): void {
  const href = getAppHref(app);
  if (!href.startsWith("http")) {
    router.push(href);
    return;
  }
  try {
    const url = new URL(href);
    if (typeof window !== "undefined" && url.origin === window.location.origin) {
      router.push(`${url.pathname}${url.search}${url.hash}`);
      return;
    }
  } catch {
    /* external */
  }
  window.location.href = href;
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
    isBeta: true,
    isCancelled: true,
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
    id: "daily-weather",
    name: "Daily Weather",
    description: "Her sabah İstanbul hava durumu bildirimi al",
    icon: CloudSun,
    category: "Utilities",
    color: "#38BDF8",
    href: "/apps/daily-weather",
    isImplemented: true,
    subdomain: "weather",
    isBeta: true,
  },
  {
    id: "suggest",
    name: "Suggest",
    description: "Arkadaşlarına film, dizi, oyun veya mekan tavsiye et. Durumlarını takip et!",
    icon: PaperPlaneTilt,
    category: "Lifestyle",
    color: "#6366f1",
    href: "/apps/suggest",
    isImplemented: true,
    subdomain: "suggest",
    isBeta: true,
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
    isBeta: true,
    isCancelled: true,
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
    isBeta: true,
    isCancelled: true,
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
    isBeta: true,
    isCancelled: true,
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
    isBeta: true,
    isCancelled: true,
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
    isBeta: true,
    isCancelled: true,
  },

  // Entertainment
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
    isBeta: true,
  },
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
    isBeta: true,
    isCancelled: true,
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
    isBeta: true,
    isCancelled: true,
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
    isBeta: true,
    isCancelled: true,
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
    isBeta: true,
    isCancelled: true,
  },
  {
    id: "itu-yemekhane",
    name: "Campus Meals",
    description: "Günün menüsünü takip et ve bildirim al",
    icon: ChefHat,
    category: "Local Services",
    color: "#001A33",
    href: "/apps/itu-yemekhane",
    isImplemented: true,
    subdomain: "itumeals",
    isLocal: true,
    isBeta: true,
  },
  {
    id: "sticker-editor",
    name: "Sticker Maker",
    description: "WhatsApp için kendi sticker paketlerini tasarla",
    icon: MaskHappy,
    category: "Utilities",
    color: "#25D366",
    href: "/apps/sticker-editor",
    isImplemented: true,
    subdomain: "sticker",
    isBeta: true,
    isCancelled: true,
  },
  {
    id: "kim-gelir",
    name: "Ne Yapsak?",
    description: "Hızlıca aktivite daveti veya anket oluştur, arkadaşlarını davet et ve ortak kararı gör!",
    icon: Users,
    category: "Lifestyle",
    color: "#FF5252",
    href: "/apps/kim-gelir",
    isImplemented: true,
    subdomain: "kimgelir",
    isBeta: true,
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
    isBeta: true,
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
    isBeta: true,
    isCancelled: true,
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
    isBeta: true,
    isCancelled: true,
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
    isBeta: true,
    isCancelled: true,
  },
  {
    id: "ne-yapsam",
    name: "Ne Yapsam?",
    description: "Bugün ne yapsam? Tek başına yapabileceğin aktiviteleri keşfet.",
    icon: Sparkle,
    category: "Lifestyle",
    color: "#FA5252",
    href: "/apps/stop-scroll",
    isImplemented: true,
    subdomain: "neyapsam",
    isBeta: true,
    isCancelled: true,
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
    isBeta: true,
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
    id: "campus-concerts",
    name: "Campus Concerts",
    description: "Kampüslerdeki konserleri takip et, katılımını işaretle ve yeni konserler ekle",
    icon: MusicNotes,
    category: "Lifestyle",
    color: "#845EF7",
    href: "/apps/campus-concerts",
    isImplemented: true,
    subdomain: "kampus",
    isBeta: true,
  },
  {
    id: "one-day-city-guide",
    name: "One Day City Guide",
    description: "Seçtiğin şehirde bir günde ne yapılır? En iyi rotalar ve yerel tavsiyeler.",
    icon: Compass,
    category: "Lifestyle",
    color: "#0F766E",
    href: "/apps/one-day-city-guide",
    isImplemented: true,
    subdomain: "oneday",
    isBeta: true,
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
    isBeta: true,
    isCancelled: true,
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
    isBeta: true,
    subdomain: "melt",
    isCancelled: true,
  },
  {
    id: "birikim",
    name: "Birikim",
    description: "Birikim hedefleri koy, hesaplarını yönet ve tasarruflarını takip et!",
    icon: PiggyBank,
    category: "Lifestyle",
    color: "#6366F1",
    href: "/apps/birikim",
    isImplemented: true,
    subdomain: "birikim",
    isBeta: true,
    isCancelled: true,
  },
  {
    id: "tasarruf-challenges",
    name: "Tasarruf",
    description: "Tasarruf önerilerini takip et, harcamalarını azalt ve hedeflerine ulaş!",
    icon: PiggyBank,
    category: "Lifestyle",
    color: "#40C057",
    href: "/apps/tasarruf-challenges",
    isImplemented: true,
    subdomain: "tasarruf",
    isBeta: true,
  },
  {
    id: "penalty-jar",
    name: "Penalty Jar",
    description: "Arkadaşlarınla belirlediğin kuralları kimlerin çiğnediğini ve ceza kavanozunu takip et!",
    icon: Warning,
    category: "Board Games & Fun",
    color: "#E03131",
    href: "/apps/penalty-jar",
    isImplemented: true,
    subdomain: "kavanoz",
    isBeta: true,
    isCancelled: true,
  },
  {
    id: "budget",
    name: "Budget",
    description: "Bireysel ve ortak bütçe takibi, arkadaşlarınla kolay borç bölüşümü!",
    icon: CreditCard,
    category: "Lifestyle",
    color: "#EC4899",
    href: "/apps/budget",
    isImplemented: true,
    subdomain: "budget",
    isBeta: true,
  },
  {
    id: "stamp-card",
    name: "Stamp Card",
    description: "Anlaşmalı işletmelerden kaşe topla, ücretsiz hediye kazan!",
    icon: Cards,
    category: "Lifestyle",
    color: "#F59E0B",
    href: "/apps/stamp-card",
    isImplemented: true,
    subdomain: "stampcard",
    isBeta: true,
  },
  {
    id: "campus-events",
    name: "Campus Events",
    description: "Üniversite topluluk etkinliklerini keşfet ve katıl",
    icon: Megaphone,
    category: "Lifestyle",
    color: "#3B82F6",
    href: "/apps/campus-events",
    isImplemented: true,
    subdomain: "campusevents",
    isBeta: true,
  },
  {
    id: "esles",
    name: "Eşleş",
    description: "Online oyun arkadaşı bul! İlan oluştur, oyuncu ara ve hemen takıma katıl.",
    icon: GameController,
    category: "Board Games & Fun",
    color: "#7C3AED",
    href: "/apps/esles",
    isImplemented: true,
    subdomain: "esles",
    isBeta: true,
    isCancelled: true,
  },
  {
    id: "apply-tracker",
    name: "Başvuru Takip",
    description: "İş başvurularını, ilan linklerini ve süreç durumlarını takip et.",
    icon: Buildings,
    category: "Utilities",
    color: "#6366f1",
    href: "/apps/apply-tracker",
    isImplemented: true,
    subdomain: "basvuru",
    isBeta: true,
    isCancelled: true,
  },
  {
    id: "series-track",
    name: "SeriesTrack",
    description: "İzlediğin dizileri takip et, bölümleri işaretle ve ilerlemeni gör.",
    icon: VideoCamera,
    category: "Entertainment",
    color: "#E50914",
    href: "/apps/series-track",
    isImplemented: true,
    subdomain: "seriestrack",
    isBeta: true,
  },
  {
    id: "digital-menu",
    name: "Dijital Menü",
    description: "Kafelerin QR menülerini görüntüle, siparişini planla ve masadan garson çağır!",
    icon: ChefHat,
    category: "Local Services",
    color: "#EF4444",
    href: "/apps/digital-menu",
    isImplemented: true,
    subdomain: "menu",
    isBeta: true,
  },
];
