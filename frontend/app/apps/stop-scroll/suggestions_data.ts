import activities from "../kim-gelir/activities.json";

export interface CuratedSuggestion {
  id: string;
  category: string;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  icon: string;
  link?: string;
  linkLabelTr?: string;
  linkLabelEn?: string;
}

// Helper descriptions and links for specific activities to make them more engaging and connected to other apps
const ACTIVITY_CONFIG: Record<string, { tr: string, en: string, link?: string, linkLabelTr?: string, linkLabelEn?: string }> = {
  movie: { 
    tr: "Vizyondaki yeni filmlere göz at ve bir bilet al.", 
    en: "Check out new movies and buy a ticket.",
    link: '/apps/movies-this-year',
    linkLabelTr: 'Vizyondakileri Gör',
    linkLabelEn: 'See Now Playing'
  },
  series: { tr: "Evde mısırını patlat ve izlemek istediğin o diziyi aç.", en: "Pop some popcorn and watch that series you've been wanting to see." },
  game: { tr: "Favori oyununu aç ve biraz vakit geçir.", en: "Open your favorite game and spend some time." },
  board_game: { 
    tr: "Tek başına oynanabilen veya online kutu oyunlarını dene.", 
    en: "Try solo-playable or online board games.",
    link: '/apps/game-companion',
    linkLabelTr: 'Eşlikçi\'yi Aç',
    linkLabelEn: 'Open Companion'
  },
  card_game: { 
    tr: "İskambil desteni al ve yeni bir oyun öğren.", 
    en: "Grab your deck of cards and learn a new game.",
    link: '/apps/iskambil',
    linkLabelTr: 'Oyun Kuralları',
    linkLabelEn: 'Game Rules'
  },
  concert: { 
    tr: "Şehrindeki canlı müzik etkinliklerini kontrol et.", 
    en: "Check out live music events in your city.",
    link: '/apps/concert-list',
    linkLabelTr: 'Konser Listem',
    linkLabelEn: 'Concert List'
  },
  museum: { tr: "Şehrindeki bir müzeyi veya sanat galerisini gez.", en: "Visit a museum or art gallery in your city." },
  theater: { tr: "Yerel bir tiyatro oyununa bilet al.", en: "Get a ticket for a local theater play." },
  study: { 
    tr: "Verimli çalışmak için kendine güzel bir mekan seç.", 
    en: "Choose a nice place for a productive study session.",
    link: '/apps/workplaces',
    linkLabelTr: 'Çalışma Mekanları',
    linkLabelEn: 'Study Places'
  },
  library: { 
    tr: "Sessiz bir ortamda kitapların arasında çalış.", 
    en: "Work among books in a quiet environment.",
    link: '/apps/workplaces',
    linkLabelTr: 'Kütüphaneleri Bul',
    linkLabelEn: 'Find Libraries'
  },
  coworking: { 
    tr: "Diğer çalışanlarla birlikte motivasyonunu artır.", 
    en: "Boost your motivation by working with others.",
    link: '/apps/workplaces',
    linkLabelTr: 'Mekan Keşfet',
    linkLabelEn: 'Explore Places'
  },
  coffee: { 
    tr: "Güzel bir kahve dükkanına git veya evde kendine özel bir kahve yap.", 
    en: "Go to a nice coffee shop or make a special coffee at home.",
    link: '/apps/workplaces',
    linkLabelTr: 'Kahve Mekanları',
    linkLabelEn: 'Coffee Shops'
  },
  walk: { tr: "En az 20 dakika açık havada yürü.", en: "Walk outdoors for at least 20 minutes." },
  reading: { tr: "En az 15 dakika kitap oku.", en: "Read a book for at least 15 minutes." },
  city_walk: { tr: "Daha önce gitmediğin bir mahalleyi gez.", en: "Visit a neighborhood you haven't been to before." },
  seaside: { tr: "Deniz havası al ve dalgaları izle.", en: "Get some sea air and watch the waves." },
  sunset: { tr: "Günün en güzel anını yakala.", en: "Catch the most beautiful moment of the day." },
  home_chill: { tr: "Hiçbir şey yapmadan sadece dinlenmenin tadını çıkar.", en: "Enjoy just relaxing without doing anything." },
  market: { 
    tr: "Eksikleri tamamlamak için markete uğra.", 
    en: "Stop by the market to pick up what's missing.",
    link: '/apps/kiler',
    linkLabelTr: 'Kilerim',
    linkLabelEn: 'My Pantry'
  },
};

export const CURATED_SUGGESTIONS: CuratedSuggestion[] = activities.flatMap(cat => 
  cat.items.map(item => {
    const config = ACTIVITY_CONFIG[item.id];
    return {
      id: item.id,
      category: cat.category,
      titleTr: item.label,
      titleEn: item.label,
      descTr: config?.tr || `${item.label} yaparak gününü değerlendir.`,
      descEn: config?.en || `Spend your day by doing ${item.label.toLowerCase()}.`,
      icon: item.icon,
      link: config?.link,
      linkLabelTr: config?.linkLabelTr,
      linkLabelEn: config?.linkLabelEn,
    };
  })
);

