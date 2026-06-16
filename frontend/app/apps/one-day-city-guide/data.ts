export type WalkingLevel = "low" | "medium-low" | "medium" | "high";
export type StopWalkingLevel = "low" | "medium" | "high";
export type Priority = "must-see" | "high" | "medium" | "optional";
export type Pace = "relaxed" | "moderate" | "fast";

export type AccessMode =
  | "metro"
  | "ankaray"
  | "bus"
  | "taxi"
  | "walk"
  | "car"
  | "shuttle";

export interface City {
  id: string;
  nameTr: string;
  nameEn: string;
  countryTr: string;
  countryEn: string;
  regionTr?: string;
  regionEn?: string;
  descriptionTr: string;
  descriptionEn: string;
  bestForTr: string[];
  bestForEn: string[];
  estimatedTotalDurationHours: number;
  estimatedWalkingLevel: WalkingLevel;
  recommendedStartTime: string;
  recommendedEndTime?: string;
}

export interface FoodDrink {
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  descriptionEn: string;
  whereToTryTr: string[];
  whereToTryEn: string[];
}

export interface IconicPlace {
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  descriptionEn: string;
}

export interface LocalExperience {
  nameTr: string;
  nameEn: string;
  descriptionTr: string;
  descriptionEn: string;
}

export interface CulturalHighlights {
  localFoodsAndDrinks: FoodDrink[];
  iconicPlaces: IconicPlace[];
  localExperiences: LocalExperience[];
  thingsToKnowTr: string[];
  thingsToKnowEn: string[];
}

export interface NearestTransit {
  type: AccessMode;
  nameTr: string;
  nameEn: string;
  noteTr?: string;
  noteEn?: string;
}

export interface FromPopularArea {
  fromTr: string;
  fromEn: string;
  descriptionTr: string;
  descriptionEn: string;
}

export interface AccessInfo {
  summaryTr: string;
  summaryEn: string;
  recommendedModes: AccessMode[];
  nearestTransit?: NearestTransit[];
  fromPopularAreas?: FromPopularArea[];
  walkingRequired: StopWalkingLevel;
  notesTr?: string[];
  notesEn?: string[];
  verificationNeeded?: boolean;
}

export interface SkipEffect {
  timeSavedMinutes: number;
  suggestedNextStopId: string;
  messageTr: string;
  messageEn: string;
}

export interface Stop {
  order: number;
  id: string;
  titleTr: string;
  titleEn: string;
  areaTr: string;
  areaEn: string;
  category: string;
  priority: Priority;
  estimatedDurationMinutes: number;
  descriptionTr: string;
  descriptionEn: string;
  whatToDoTr: string[];
  whatToDoEn: string[];
  whatToTryTr?: string[];
  whatToTryEn?: string[];
  tipsTr: string[];
  tipsEn: string[];
  warningsTr?: string[];
  warningsEn?: string[];
  accessInfo: AccessInfo | null;
  skipEffect?: SkipEffect;
  flexible?: boolean;
}

export interface FallbackOption {
  conditionTr: string;
  conditionEn: string;
  actionTr: string;
  actionEn: string;
}

export interface RouteVariant {
  id: string;
  titleTr: string;
  titleEn: string;
  walkingLevel: "low" | "medium" | "high";
  descriptionTr: string;
  descriptionEn: string;
  icon?: string;
}

export interface Tour {
  id: string;
  variantId: string;
  titleTr: string;
  titleEn: string;
  descriptionTr: string;
  descriptionEn: string;
  theme: string[];
  pace: Pace;
  walkingLevel: WalkingLevel;
  recommendedForTr: string[];
  recommendedForEn: string[];
  startAreaTr: string;
  startAreaEn: string;
  endAreaTr: string;
  endAreaEn: string;
  estimatedDurationHours: number;
  routeNotesTr: string[];
  routeNotesEn: string[];
  stops: Stop[];
  fallbackOptions: FallbackOption[];
  generalWarningsTr: string[];
  generalWarningsEn: string[];
}

export interface CityGuide {
  city: City;
  culturalHighlights: CulturalHighlights;
  routeVariants: RouteVariant[];
  tours: Tour[];
}

export const ACCESS_MODE_LABELS: Record<AccessMode, { tr: string; en: string }> = {
  metro: { tr: "Metro", en: "Metro" },
  ankaray: { tr: "Ankaray", en: "Ankaray" },
  bus: { tr: "Otobüs", en: "Bus" },
  taxi: { tr: "Taksi", en: "Taxi" },
  walk: { tr: "Yürüyüş", en: "Walk" },
  car: { tr: "Araç", en: "Car" },
  shuttle: { tr: "Servis", en: "Shuttle" }
};

export const WALKING_LEVEL_LABELS: Record<StopWalkingLevel, { tr: string; en: string }> = {
  low: { tr: "Az yürüyüş", en: "Low walking" },
  medium: { tr: "Orta yürüyüş", en: "Medium walking" },
  high: { tr: "Yorucu yürüyüş", en: "High walking" }
};

export const CITY_GUIDES: Record<string, CityGuide> = {
  ankara: {
    city: {
      id: "ankara",
      nameTr: "Ankara",
      nameEn: "Ankara",
      countryTr: "Türkiye",
      countryEn: "Turkey",
      regionTr: "İç Anadolu",
      regionEn: "Central Anatolia",
      descriptionTr: "Ankara için bir günde gezilebilecek, kültür, şehir hayatı ve akşam sosyalleşmesini birleştiren şehir rotası.",
      descriptionEn: "A one-day city route for Ankara that combines culture, city life, and evening socialization.",
      bestForTr: ["ilk kez gelenler", "tarih görmek isteyenler", "az yürümek isteyenler", "akşam Tunalı tarafında vakit geçirmek isteyenler"],
      bestForEn: ["first-time visitors", "history enthusiasts", "low walking preference", "evening socializers in Tunalı"],
      estimatedTotalDurationHours: 10,
      estimatedWalkingLevel: "medium-low",
      recommendedStartTime: "10:00",
      recommendedEndTime: "22:30"
    },
    culturalHighlights: {
      localFoodsAndDrinks: [
        {
          nameTr: "Muzlu süt / atom",
          nameEn: "Banana Milk / Atom",
          descriptionTr: "Ankara'da Adana tarzı büfe içeceği arayanlar için kısa ve keyifli bir mola seçeneği.",
          descriptionEn: "A quick and pleasant break option for those looking for Adana-style buffet drinks in Ankara.",
          whereToTryTr: ["Ye-İç Büfe / Akköprü"],
          whereToTryEn: ["Ye-İç Buffet / Akköprü"]
        },
        {
          nameTr: "Aspava",
          nameEn: "Aspava",
          descriptionTr: "Ankara'nın geç saat yemeği kültüründe öne çıkan dürüm, ikram ve hızlı servis deneyimi.",
          descriptionEn: "A prominent late-night dining experience in Ankara featuring wraps, treats, and fast service.",
          whereToTryTr: ["Kızılay", "Bahçelievler", "Tunalı çevresi"],
          whereToTryEn: ["Kızılay", "Bahçelievler", "Tunalı area"]
        },
        {
          nameTr: "AOÇ dondurması",
          nameEn: "AOÇ Ice Cream",
          descriptionTr: "Atatürk Orman Çiftliği ile özdeşleşen klasik Ankara lezzetlerinden biri.",
          descriptionEn: "One of the classic Ankara flavors identified with Atatürk Forest Farm.",
          whereToTryTr: ["AOÇ çevresi", "bazı Ankara restoranları"],
          whereToTryEn: ["AOÇ area", "some Ankara restaurants"]
        }
      ],
      iconicPlaces: [
        {
          nameTr: "Anıtkabir",
          nameEn: "Anıtkabir",
          descriptionTr: "Ankara'nın en güçlü sembolü ve şehirde ilk kez gelenler için ana durak.",
          descriptionEn: "Ankara's most powerful symbol and the main stop for first-time visitors."
        },
        {
          nameTr: "Ulus",
          nameEn: "Ulus",
          descriptionTr: "Cumhuriyet dönemi Ankara'sını ve eski şehir merkezini hissettiren bölge.",
          descriptionEn: "The area that makes you feel the Republican era Ankara and the old city center."
        },
        {
          nameTr: "Ankara Kalesi çevresi",
          nameEn: "Ankara Castle Area",
          descriptionTr: "Tarihî sokaklar, müzeler ve şehir manzarasıyla bilinen bölge.",
          descriptionEn: "Area known for its historical streets, museums, and city views."
        },
        {
          nameTr: "Tunalı Hilmi Caddesi",
          nameEn: "Tunalı Hilmi Street",
          descriptionTr: "Kafe, yürüyüş ve akşam sosyalleşmesi için Ankara'nın en bilinen hatlarından biri.",
          descriptionEn: "One of Ankara's best-known lines for cafes, walking, and evening socialization."
        },
        {
          nameTr: "Kuğulu Park",
          nameEn: "Kuğulu Park",
          descriptionTr: "Tunalı çevresinde kısa mola vermek ve akşam rotasına başlamak için klasik nokta.",
          descriptionEn: "A classic spot for a short break around Tunalı and starting the evening route."
        }
      ],
      localExperiences: [
        {
          nameTr: "Karanfil Sokak'ta kafe molası",
          nameEn: "Coffee break at Karanfil Street",
          descriptionTr: "Kızılay çevresinde kısa oturma, kahve içme ve şehir kalabalığını görme molası.",
          descriptionEn: "A break to sit briefly, drink coffee, and observe the city crowd around Kızılay."
        },
        {
          nameTr: "Tunalı'da akşam yürüyüşü",
          nameEn: "Evening walk in Tunalı",
          descriptionTr: "Kuğulu Park'tan başlayıp Tunalı çevresinde kafe, bar veya yemekle günü kapatma deneyimi.",
          descriptionEn: "The experience of starting from Kuğulu Park and ending the day with a cafe, bar, or dinner around Tunalı."
        }
      ],
      thingsToKnowTr: [
        "Kale çevresi yokuşlu olduğu için enerjiniz düşükse taksi kullanmak daha mantıklı olabilir.",
        "Kızılay genelde ana gezi durağından çok aktarma, buluşma ve kısa mola noktası gibi düşünülmelidir.",
        "Tunalı ve Kuğulu Park çevresi akşam saatlerinde daha keyifli olur.",
        "Müze, servis ve giriş saatleri değişebileceği için gitmeden önce güncel bilgi kontrol edilmelidir."
      ],
      thingsToKnowEn: [
        "Since the area around the Castle is hilly, it may be more logical to use a taxi if your energy is low.",
        "Kızılay should generally be considered a transfer, meeting, and short break point rather than a main sightseeing stop.",
        "Tunalı and Kuğulu Park areas are more pleasant in the evening hours.",
        "Since museum, service, and entrance hours may change, current information should be checked before going."
      ]
    },
    routeVariants: [
      {
        id: "comfort",
        titleTr: "Rahat Tempo",
        titleEn: "Relaxed Pace",
        walkingLevel: "low",
        descriptionTr: "Az yürüyüş, bol mola ve konfor odaklı 1 günlük Ankara rotası.",
        descriptionEn: "A comfort-oriented one-day Ankara route with minimal walking and plenty of breaks.",
        icon: "☕"
      },
      {
        id: "full",
        titleTr: "Dolu Dolu Gezi",
        titleEn: "Full Tour",
        walkingLevel: "high",
        descriptionTr: "Ankara'nın tarih, müze ve akşam tarafını aynı güne sığdıran yoğun rota.",
        descriptionEn: "An intensive route packing Ankara's history, museums, and nightlife into a single day.",
        icon: "🏛️"
      },
      {
        id: "food-focused",
        titleTr: "Yeme İçme Odaklı",
        titleEn: "Food Focused",
        walkingLevel: "low",
        descriptionTr: "Şehir gezisini kısa tutup Ankara'da mola ve lezzet duraklarını öne çıkaran rota.",
        descriptionEn: "A route that keeps city sightseeing short and highlights break and taste stops in Ankara.",
        icon: "🥤"
      }
    ],
    tours: [
      {
        id: "ankara-comfort",
        variantId: "comfort",
        titleTr: "Ankara Rahat Rota",
        titleEn: "Ankara Relaxed Route",
        descriptionTr: "Çok yorulmadan Anıtkabir, kısa şehir molası ve Tunalı akşamını birleştiren rota.",
        descriptionEn: "A route that combines Anıtkabir, a short city break, and Tunalı evening without getting too tired.",
        theme: ["comfort", "culture", "evening"],
        pace: "relaxed",
        walkingLevel: "medium-low",
        recommendedForTr: ["Ankara'ya ilk kez gelenler", "Az yürümek isteyenler", "Günü Tunalı tarafında bitirmek isteyenler"],
        recommendedForEn: ["First-time visitors to Ankara", "Those who want to walk less", "Those who want to end the day in Tunalı"],
        startAreaTr: "Akköprü / Kızılay",
        startAreaEn: "Akköprü / Kızılay",
        endAreaTr: "Tunalı / Kuğulu Park",
        endAreaEn: "Tunalı / Kuğulu Park",
        estimatedDurationHours: 8,
        routeNotesTr: ["Bu rota Kale çevresindeki uzun yokuşları azaltır.", "Anıtkabir ana durak olarak tutulur.", "Günün sonunda Tunalı tarafına geçmek daha keyifli olur."],
        routeNotesEn: ["This route reduces long slopes around the Castle.", "Anıtkabir is kept as the main stop.", "It is more pleasant to move to the Tunalı side at the end of the day."],
        stops: [
          {
            order: 1,
            id: "ankamall-ye-ic-bufe",
            titleTr: "ANKAmall / Ye-İç Büfe",
            titleEn: "ANKAmall / Ye-İç Buffet",
            areaTr: "Akköprü",
            areaEn: "Akköprü",
            category: "local_food_drink",
            priority: "optional",
            estimatedDurationMinutes: 30,
            descriptionTr: "Güne muzlu süt veya atom içerek başlanabilecek kısa lezzet durağı.",
            descriptionEn: "A short taste stop where you can start the day by drinking banana milk or atom.",
            whatToDoTr: ["Muzlu süt veya atom iç", "Çok oyalanmadan merkeze geç"],
            whatToDoEn: ["Drink banana milk or atom", "Move to the center without lingering too much"],
            whatToTryTr: ["Muzlu süt", "Atom"],
            whatToTryEn: ["Banana milk", "Atom"],
            tipsTr: ["Bu durak rotaya keyif katar ama zaman azsa atlanabilir.", "Akköprü metro bağlantısı sayesinde merkeze geçmek kolaydır."],
            tipsEn: ["This stop adds pleasure to the route but can be skipped if time is short.", "It is easy to move to the center thanks to the Akköprü metro connection."],
            accessInfo: {
              summaryTr: "Akköprü metro durağı ve ANKAmall çevresinden ulaşım kolaydır.",
              summaryEn: "Transport is easy from Akköprü metro station and around ANKAmall.",
              recommendedModes: ["metro", "bus", "taxi"],
              nearestTransit: [{ type: "metro", nameTr: "Akköprü", nameEn: "Akköprü", noteTr: "ANKAmall çevresine yürüyerek geçilebilir.", noteEn: "Can be reached by walking around ANKAmall." }],
              fromPopularAreas: [{ fromTr: "Kızılay", fromEn: "Kızılay", descriptionTr: "Metro ile Akköprü yönüne geçilebilir.", descriptionEn: "Can be reached by metro in the direction of Akköprü." }],
              walkingRequired: "low",
              notesTr: ["AVM çevresinde yön bulmak kolaydır."],
              notesEn: ["It is easy to find your way around the mall."]
            },
            flexible: true
          },
          {
            order: 2,
            id: "kizilay-karanfil",
            titleTr: "Kızılay / Karanfil Sokak",
            titleEn: "Kızılay / Karanfil Street",
            areaTr: "Kızılay",
            areaEn: "Kızılay",
            category: "city_life",
            priority: "medium",
            estimatedDurationMinutes: 45,
            descriptionTr: "Merkezde kısa kahve molası, dinlenme ve aktarma için pratik durak.",
            descriptionEn: "A practical stop for a short coffee break, rest, and transfer in the center.",
            whatToDoTr: ["Karanfil Sokak'ta kısa mola ver", "Kahve iç", "Dinlen"],
            whatToDoEn: ["Take a short break at Karanfil Street", "Drink coffee", "Rest"],
            tipsTr: ["Kızılay'ı mola noktası gibi kullanmak daha mantıklı.", "Kalabalık saatlerde dikkatli olun."],
            tipsEn: ["It makes more sense to use Kızılay as a break point.", "Be careful during crowded hours."],
            accessInfo: {
              summaryTr: "Kızılay, Ankara'nın en merkezi toplu taşıma noktasıdır.",
              summaryEn: "Kızılay is the most central public transport point in Ankara.",
              recommendedModes: ["metro", "ankaray", "bus", "taxi"],
              nearestTransit: [{ type: "metro", nameTr: "Kızılay", nameEn: "Kızılay", noteTr: "Metro ve Ankaray aktarması yapılabilir.", noteEn: "Metro and Ankaray transfers can be made." }],
              fromPopularAreas: [{ fromTr: "Akköprü", fromEn: "Akköprü", descriptionTr: "Metro ile Kızılay'a geçilebilir.", descriptionEn: "Can be reached by metro to Kızılay." }],
              walkingRequired: "low"
            },
            flexible: true
          },
          {
            order: 3,
            id: "anitkabir",
            titleTr: "Anıtkabir",
            titleEn: "Anıtkabir",
            areaTr: "Tandoğan / Anıttepe",
            areaEn: "Tandoğan / Anıttepe",
            category: "historic_landmark",
            priority: "must-see",
            estimatedDurationMinutes: 90,
            descriptionTr: "Ankara'nın en önemli ve sembolik durağı.",
            descriptionEn: "Ankara's most important and symbolic stop.",
            whatToDoTr: ["Aslanlı Yol'dan yürü", "Mozoleyi ziyaret et", "Müzeye göz at"],
            whatToDoEn: ["Walk from the Lions Road", "Visit the mausoleum", "Check out the museum"],
            tipsTr: ["Günün ana durağı burası.", "Giriş kontrolü için zaman bırakın.", "Rahat ayakkabı giyin."],
            tipsEn: ["This is the main stop of the day.", "Leave time for the security check.", "Wear comfortable shoes."],
            warningsTr: ["Sıcak havalarda su alın.", "İçeride yürüyüş olabilir."],
            warningsEn: ["Take water in hot weather.", "There may be walking inside."],
            accessInfo: {
              summaryTr: "Kızılay'dan Ankaray ile Anadolu/Tandoğan tarafına geçilebilir.",
              summaryEn: "Can be reached by Ankaray from Kızılay to Anadolu/Tandoğan side.",
              recommendedModes: ["ankaray", "taxi", "car"],
              nearestTransit: [{ type: "ankaray", nameTr: "Anadolu / Tandoğan", nameEn: "Anadolu / Tandoğan", noteTr: "İstasyondan sonra girişe yürünür.", noteEn: "Walk to the entrance after the station." }],
              fromPopularAreas: [{ fromTr: "Kızılay", fromEn: "Kızılay", descriptionTr: "Ankaray ile Anadolu/Tandoğan yönüne geçilebilir.", descriptionEn: "Can be reached by Ankaray in the direction of Anadolu/Tandoğan." }],
              walkingRequired: "medium"
            },
            flexible: true
          },
          {
            order: 4,
            id: "anatolian-civilizations-museum",
            titleTr: "Anadolu Medeniyetleri Müzesi",
            titleEn: "Museum of Anatolian Civilizations",
            areaTr: "Kale çevresi",
            areaEn: "Castle area",
            category: "museum",
            priority: "high",
            estimatedDurationMinutes: 75,
            descriptionTr: "Ankara'da kısa sürede güçlü bir kültür deneyimi veren müze durağı.",
            descriptionEn: "A museum stop that gives a strong cultural experience in Ankara in a short time.",
            whatToDoTr: ["Müzeyi seçici gez", "Ana sergi akışına odaklan"],
            whatToDoEn: ["Tour the museum selectively", "Focus on the main exhibition flow"],
            tipsTr: ["Tek müze seçilecekse burası iyi bir tercih.", "Kale çevresiyle aynı gün planlanabilir."],
            tipsEn: ["If only one museum is to be chosen, this is a good choice.", "Can be planned on the same day as the Castle area."],
            accessInfo: {
              summaryTr: "Müze, Ankara Kalesi çevresindedir.",
              summaryEn: "The museum is around Ankara Castle.",
              recommendedModes: ["taxi", "walk", "bus"],
              nearestTransit: [{ type: "metro", nameTr: "Ulus", nameEn: "Ulus", noteTr: "Ulus'tan yürünebilir ama yokuşludur.", noteEn: "Can be walked from Ulus but it is hilly." }],
              fromPopularAreas: [{ fromTr: "Ulus", fromEn: "Ulus", descriptionTr: "Yokuş nedeniyle taksi daha rahat olabilir.", descriptionEn: "A taxi may be more comfortable due to the slope." }],
              walkingRequired: "medium"
            },
            skipEffect: {
              timeSavedMinutes: 75,
              suggestedNextStopId: "tunali-kugulu-park",
              messageTr: "Müzeyi atlarsan Tunalı tarafına daha erken geçebilirsin.",
              messageEn: "If you skip the museum, you can move to the Tunalı side earlier."
            },
            flexible: true
          },
          {
            order: 5,
            id: "tunali-kugulu-park",
            titleTr: "Tunalı / Kuğulu Park",
            titleEn: "Tunalı / Kuğulu Park",
            areaTr: "Tunalı Hilmi",
            areaEn: "Tunalı Hilmi",
            category: "evening_walk",
            priority: "high",
            estimatedDurationMinutes: 60,
            descriptionTr: "Akşamüstü kısa yürüyüş, park molası ve Tunalı atmosferi.",
            descriptionEn: "A short evening walk, park break, and Tunalı atmosphere.",
            whatToDoTr: ["Kuğulu Park'ta tur at", "Tunalı'da yürüyüş yap", "Kafe veya bar molası ver"],
            whatToDoEn: ["Tour Kuğulu Park", "Walk in Tunalı", "Take a cafe or bar break"],
            tipsTr: ["Akşam saatlerinde Tunalı çevresi daha canlı olur.", "Kuğuları beslemeyin."],
            tipsEn: ["The Tunalı area is more lively in the evening.", "Do not feed the swans."],
            accessInfo: {
              summaryTr: "Tunalı'ya Kızılay'dan otobüs veya taksiyle kolayca geçilebilir.",
              summaryEn: "Tunalı can be easily reached from Kızılay by bus or taxi.",
              recommendedModes: ["bus", "taxi", "car"],
              fromPopularAreas: [{ fromTr: "Kızılay", fromEn: "Kızılay", descriptionTr: "Otobüs veya taksiyle kolay geçilir.", descriptionEn: "Easily reached by bus or taxi." }],
              walkingRequired: "low"
            },
            flexible: true
          },
          {
            order: 6,
            id: "if-sokak",
            titleTr: "IF Sokak",
            titleEn: "IF Street",
            areaTr: "Tunalı çevresi",
            areaEn: "Tunalı area",
            category: "nightlife",
            priority: "optional",
            estimatedDurationMinutes: 120,
            descriptionTr: "Günü bira, yemek veya arkadaşlarla oturarak kapatmak için akşam durağı.",
            descriptionEn: "An evening stop to end the day with beer, food, or sitting with friends.",
            whatToDoTr: ["Bir şeyler iç", "Yemek veya atıştırmalık molası ver", "Günü burada kapat"],
            whatToDoEn: ["Drink something", "Take a food or snack break", "End the day here"],
            tipsTr: ["Yoğun saatlerde yer bulmak zor olabilir.", "Tunalı sonrası yürüyerek geçilebilir."],
            tipsEn: ["It may be difficult to find a place during busy hours.", "Can be reached by walking after Tunalı."],
            accessInfo: {
              summaryTr: "Tunalı çevresindedir; Kuğulu Park'tan yürüyerek ulaşılabilir.",
              summaryEn: "It is around Tunalı; can be reached by walking from Kuğulu Park.",
              recommendedModes: ["walk", "taxi"],
              walkingRequired: "low"
            },
            flexible: true
          }
        ],
        fallbackOptions: [
          { conditionTr: "Enerji düşükse", conditionEn: "If energy is low", actionTr: "Müzeyi opsiyonel yap; direkt Tunalı'ya geç.", actionEn: "Make the museum optional; move directly to Tunalı." }
        ],
        generalWarningsTr: ["Müze saatlerini kontrol edin.", "Kale çevresi yokuşludur."],
        generalWarningsEn: ["Check museum hours.", "The area around the Castle is hilly."]
      },
      {
        id: "ankara-full",
        variantId: "full",
        titleTr: "Ankara Tam Tur",
        titleEn: "Ankara Full Tour",
        descriptionTr: "Muzlu süt molasından başlayıp Anıtkabir, Ulus, Kale çevresi, müzeler ve Tunalı akşamını birleştiren yoğun rota.",
        descriptionEn: "An intensive route starting from a banana milk break and combining Anıtkabir, Ulus, Castle area, museums, and Tunalı evening.",
        theme: ["history", "culture", "city-life", "evening"],
        pace: "moderate",
        walkingLevel: "high",
        recommendedForTr: ["Enerjisi yüksek olanlar", "Ankara'yı bir günde dolu dolu görmek isteyenler"],
        recommendedForEn: ["Those with high energy", "Those who want to see Ankara to the fullest in one day"],
        startAreaTr: "Akköprü",
        startAreaEn: "Akköprü",
        endAreaTr: "Tunalı / IF Sokak",
        endAreaEn: "Tunalı / IF Street",
        estimatedDurationHours: 12,
        routeNotesTr: ["Bu rota yokuş ve müze yürüyüşü içerir.", "Kale çevresi yorarsa bazı duraklar atlanabilir."],
        routeNotesEn: ["This route includes slopes and museum walks.", "Some stops can be skipped if the Castle area is tiring."],
        stops: [
          {
            order: 1,
            id: "ankamall-ye-ic-bufe",
            titleTr: "ANKAmall / Ye-İç Büfe",
            titleEn: "ANKAmall / Ye-İç Buffet",
            areaTr: "Akköprü",
            areaEn: "Akköprü",
            category: "local_food_drink",
            priority: "optional",
            estimatedDurationMinutes: 25,
            descriptionTr: "Muzlu süt veya atomla kısa başlangıç molası.",
            descriptionEn: "A quick start break with banana milk or atom.",
            whatToDoTr: ["Muzlu süt veya atom iç"],
            whatToDoEn: ["Drink banana milk or atom"],
            tipsTr: ["Bu durak kısa tutulmalı."],
            tipsEn: ["This stop should be kept short."],
            accessInfo: {
              summaryTr: "Akköprü metro durağına yakındır.",
              summaryEn: "Close to Akköprü metro station.",
              recommendedModes: ["metro", "bus", "taxi"],
              walkingRequired: "low"
            },
            flexible: true
          },
          {
            order: 2,
            id: "kizilay-karanfil",
            titleTr: "Kızılay / Karanfil Sokak",
            titleEn: "Kızılay / Karanfil Street",
            areaTr: "Kızılay",
            areaEn: "Kızılay",
            category: "city_life",
            priority: "medium",
            estimatedDurationMinutes: 40,
            descriptionTr: "Şehir merkezinde kısa kafe ve dinlenme molası.",
            descriptionEn: "A short cafe and rest break in the city center.",
            whatToDoTr: ["Kahve iç", "Kısa otur"],
            whatToDoEn: ["Drink coffee", "Sit briefly"],
            tipsTr: ["Bu durağı uzatırsan müze kısmı sıkışabilir."],
            tipsEn: ["If you extend this stop, the museum part may be tight."],
            accessInfo: {
              summaryTr: "Kızılay merkezi aktarma noktasıdır.",
              summaryEn: "Kızılay is a central transfer point.",
              recommendedModes: ["metro", "ankaray", "bus", "taxi"],
              walkingRequired: "low"
            },
            flexible: true
          },
          {
            order: 3,
            id: "anitkabir",
            titleTr: "Anıtkabir",
            titleEn: "Anıtkabir",
            areaTr: "Tandoğan / Anıttepe",
            areaEn: "Tandoğan / Anıttepe",
            category: "historic_landmark",
            priority: "must-see",
            estimatedDurationMinutes: 90,
            descriptionTr: "Ankara'nın en önemli ve sembolik durağı.",
            descriptionEn: "Ankara's most important and symbolic stop.",
            whatToDoTr: ["Aslanlı Yol'dan yürü", "Mozoleyi ziyaret et"],
            whatToDoEn: ["Walk from the Lions Road", "Visit the mausoleum"],
            tipsTr: ["Giriş kontrolü için zaman bırakın."],
            tipsEn: ["Leave time for the security check."],
            accessInfo: {
              summaryTr: "Kızılay'dan Ankaray ile ulaşılabilir.",
              summaryEn: "Can be reached by Ankaray from Kızılay.",
              recommendedModes: ["ankaray", "taxi"],
              walkingRequired: "medium"
            },
            flexible: true
          },
          {
            order: 4,
            id: "saracoglu-coffee",
            titleTr: "Saraçoğlu Mahallesi / Kahve Molası",
            titleEn: "Saraçoğlu Neighborhood / Coffee Break",
            areaTr: "Kızılay / Saraçoğlu",
            areaEn: "Kızılay / Saraçoğlu",
            category: "city_life",
            priority: "medium",
            estimatedDurationMinutes: 45,
            descriptionTr: "Türkiye'nin ilk toplu konut projesi olan tarihi Saraçoğlu Mahallesi'nde, restore edilmiş evlerin arasında huzurlu bir kahve molası.",
            descriptionEn: "A peaceful coffee break among restored houses in the historic Saraçoğlu Neighborhood, Turkey's first social housing project.",
            whatToDoTr: ["Restore edilmiş sokaklarda yürü", "Tarihi evleri incele", "Butik bir kafede kahve iç"],
            whatToDoEn: ["Walk through restored streets", "Examine historic houses", "Drink coffee in a boutique cafe"],
            tipsTr: ["Mahallenin mimarisi fotoğraf çekmek için harikadır.", "Kızılay'a yürüme mesafesindedir."],
            tipsEn: ["The neighborhood's architecture is great for photography.", "Within walking distance to Kızılay."],
            accessInfo: {
              summaryTr: "Kızılay merkezinden kısa bir yürüyüşle ulaşılabilir.",
              summaryEn: "Accessible by a short walk from Kızılay center.",
              recommendedModes: ["walk", "taxi"],
              walkingRequired: "low"
            },
            flexible: true
          },
          {
            order: 5,
            id: "genclik-parki",
            titleTr: "Gençlik Parkı",
            titleEn: "Gençlik Park",
            areaTr: "Ulus",
            areaEn: "Ulus",
            category: "park",
            priority: "high",
            estimatedDurationMinutes: 60,
            descriptionTr: "Cumhuriyet döneminin simge parklarından biri; büyük havuzu, lunaparkı ve yeşil alanlarıyla Ankara'nın kalbinde bir vaha.",
            descriptionEn: "One of the iconic parks of the Republican era; an oasis in the heart of Ankara with its large pool, amusement park, and green areas.",
            whatToDoTr: ["Havuz kenarında yürü", "Lunaparkta vakit geçir", "Sandalla gezinti yap"],
            whatToDoEn: ["Walk by the pool", "Spend time at the amusement park", "Take a boat ride"],
            tipsTr: ["Akşam saatlerinde ışıklandırmalar çok güzeldir.", "Ulus metrosuna çok yakındır."],
            tipsEn: ["The lighting is very beautiful in the evening.", "Very close to Ulus metro."],
            accessInfo: {
              summaryTr: "Ulus metro durağının hemen yanındadır.",
              summaryEn: "Right next to the Ulus metro station.",
              recommendedModes: ["metro", "walk", "taxi"],
              walkingRequired: "low"
            },
            flexible: true
          },
          {
            order: 6,
            id: "ulus-historic",
            titleTr: "Ulus / İlk TBMM / Ankara Palas",
            titleEn: "Ulus / First Parliament / Ankara Palace",
            areaTr: "Ulus",
            areaEn: "Ulus",
            category: "historic_area",
            priority: "high",
            estimatedDurationMinutes: 50,
            descriptionTr: "Cumhuriyet dönemi Ankara'sını hissettiren tarihî merkez.",
            descriptionEn: "Historical center that makes you feel the Republican era Ankara.",
            whatToDoTr: ["İlk TBMM çevresini gör", "Ankara Palas'ı gör"],
            whatToDoEn: ["See around the First Parliament", "See Ankara Palace"],
            tipsTr: ["Ulus kısmını kısa tutun."],
            tipsEn: ["Keep the Ulus part short."],
            accessInfo: {
              summaryTr: "Ulus, metro ve otobüsle kolay ulaşılır.",
              summaryEn: "Ulus is easily reached by metro and bus.",
              recommendedModes: ["metro", "bus", "taxi"],
              walkingRequired: "low"
            },
            flexible: true
          },
          {
            order: 7,
            id: "ankara-castle",
            titleTr: "Ankara Kalesi",
            titleEn: "Ankara Castle",
            areaTr: "Kale",
            areaEn: "Castle",
            category: "historic_landmark",
            priority: "high",
            estimatedDurationMinutes: 60,
            descriptionTr: "Şehri tepeden görmek için Kale durağı.",
            descriptionEn: "Castle stop to see the city from above.",
            whatToDoTr: ["Kale çevresinde tur at", "Manzaraya bak"],
            whatToDoEn: ["Tour around the Castle", "Look at the view"],
            tipsTr: ["Taş sokaklar için rahat ayakkabı giyin."],
            tipsEn: ["Wear comfortable shoes for stone streets."],
            accessInfo: {
              summaryTr: "Ulus'tan yürüyerek çıkış yokuşludur.",
              summaryEn: "The walk up from Ulus is hilly.",
              recommendedModes: ["taxi", "walk"],
              walkingRequired: "high"
            },
            skipEffect: {
              timeSavedMinutes: 60,
              suggestedNextStopId: "anatolian-civilizations-museum",
              messageTr: "Kale yürüyüşünü atlarsan müzeye daha rahat zaman kalır.",
              messageEn: "If you skip the Castle walk, there will be more comfortable time for the museum."
            },
            flexible: true
          },
          {
            order: 8,
            id: "anatolian-civilizations-museum",
            titleTr: "Anadolu Medeniyetleri Müzesi",
            titleEn: "Museum of Anatolian Civilizations",
            areaTr: "Kale çevresi",
            areaEn: "Castle area",
            category: "museum",
            priority: "must-see",
            estimatedDurationMinutes: 75,
            descriptionTr: "Ankara'da en güçlü kültür deneyimi veren müzelerden biri.",
            descriptionEn: "One of the museums in Ankara that gives the strongest cultural experience.",
            whatToDoTr: ["Müzeyi seçici gez"],
            whatToDoEn: ["Tour the museum selectively"],
            tipsTr: ["Kapanış saatine dikkat edin."],
            tipsEn: ["Pay attention to the closing time."],
            accessInfo: {
              summaryTr: "Müze, Ankara Kalesi çevresindedir.",
              summaryEn: "The museum is around Ankara Castle.",
              recommendedModes: ["taxi", "walk"],
              walkingRequired: "medium"
            },
            flexible: true
          },
          {
            order: 9,
            id: "rahmi-m-koc-museum-ankara",
            titleTr: "Rahmi M. Koç Müzesi Ankara",
            titleEn: "Rahmi M. Koç Museum Ankara",
            areaTr: "Kale çevresi",
            areaEn: "Castle area",
            category: "museum",
            priority: "optional",
            estimatedDurationMinutes: 60,
            descriptionTr: "Ulaşım, endüstri ve teknoloji üzerine nostaljik bir müze.",
            descriptionEn: "A nostalgic museum on transportation, industry, and technology.",
            whatToDoTr: ["Müzeyi hızlıca gez"],
            whatToDoEn: ["Tour the museum quickly"],
            tipsTr: ["Enerji kalırsa eklenmeli."],
            tipsEn: ["Should be added if energy remains."],
            accessInfo: {
              summaryTr: "Kale bölgesinden ulaşılabilir.",
              summaryEn: "Can be reached from the Castle area.",
              recommendedModes: ["walk", "taxi"],
              walkingRequired: "medium"
            },
            skipEffect: {
              timeSavedMinutes: 60,
              suggestedNextStopId: "tunali-kugulu-park",
              messageTr: "Bu durağı atlarsan Tunalı akşamına daha rahat yetişirsin.",
              messageEn: "If you skip this stop, you can catch the Tunalı evening more comfortably."
            },
            flexible: true
          },
          {
            order: 10,
            id: "tunali-kugulu-park",
            titleTr: "Tunalı / Kuğulu Park",
            titleEn: "Tunalı / Kuğulu Park",
            areaTr: "Tunalı Hilmi",
            areaEn: "Tunalı Hilmi",
            category: "evening_walk",
            priority: "high",
            estimatedDurationMinutes: 60,
            descriptionTr: "Günün yorgunluğunu atmak için akşamüstü park durağı.",
            descriptionEn: "An evening park stop to relieve the day's fatigue.",
            whatToDoTr: ["Kuğulu Park'ta tur at", "Tunalı'da yürü"],
            whatToDoEn: ["Tour Kuğulu Park", "Walk in Tunalı"],
            tipsTr: ["Akşam saatlerinde Tunalı daha canlı olur."],
            tipsEn: ["Tunalı is more lively in the evening."],
            accessInfo: {
              summaryTr: "Kızılay'dan otobüs veya taksiyle geçilebilir.",
              summaryEn: "Can be reached by bus or taxi from Kızılay.",
              recommendedModes: ["bus", "taxi"],
              walkingRequired: "low"
            },
            flexible: true
          },
          {
            order: 11,
            id: "if-sokak",
            titleTr: "IF Sokak",
            titleEn: "IF Street",
            areaTr: "Tunalı çevresi",
            areaEn: "Tunalı area",
            category: "nightlife",
            priority: "high",
            estimatedDurationMinutes: 120,
            descriptionTr: "Günü bira, yemek veya arkadaşlarla oturarak kapatmak için akşam durağı.",
            descriptionEn: "An evening stop to end the day with beer, food, or sitting with friends.",
            whatToDoTr: ["Bir şeyler iç", "Yemek molası ver"],
            whatToDoEn: ["Drink something", "Take a food break"],
            tipsTr: ["Dönüş ulaşımını önceden düşünün."],
            tipsEn: ["Think about return transport in advance."],
            accessInfo: {
              summaryTr: "Tunalı çevresindedir; Kuğulu Park'tan yürünür.",
              summaryEn: "It is around Tunalı; walk from Kuğulu Park.",
              recommendedModes: ["walk", "taxi"],
              walkingRequired: "low"
            },
            flexible: true
          }
        ],
        fallbackOptions: [
          { conditionTr: "Enerji düşükse", conditionEn: "If energy is low", actionTr: "Kale ve Rahmi Koç'u çıkar.", actionEn: "Remove Castle and Rahmi Koç." }
        ],
        generalWarningsTr: ["Müze saatlerini kontrol edin."],
        generalWarningsEn: ["Check museum hours."]
      },
      {
        id: "ankara-food-focused",
        variantId: "food-focused",
        titleTr: "Ankara Yeme İçme Rotası",
        titleEn: "Ankara Food Focused Route",
        descriptionTr: "Gezilecek yerleri kısa tutup lezzet duraklarını öne çıkaran rota.",
        descriptionEn: "A route that keeps sightseeing short and highlights taste stops.",
        theme: ["local food", "comfort", "evening"],
        pace: "relaxed",
        walkingLevel: "low",
        recommendedForTr: ["Yemek/içecek molası sevenler", "Az yürüyüş isteyenler"],
        recommendedForEn: ["Food/drink break lovers", "Those who want minimal walking"],
        startAreaTr: "Akköprü",
        startAreaEn: "Akköprü",
        endAreaTr: "Tunalı / IF Sokak",
        endAreaEn: "Tunalı / IF Street",
        estimatedDurationHours: 7,
        routeNotesTr: ["Anıtkabir ana kültür durağıdır.", "Akşam Tunalı tarafında vakit bırakır."],
        routeNotesEn: ["Anıtkabir is the main cultural stop.", "Leaves time for the Tunalı side in the evening."],
        stops: [
          {
            order: 1,
            id: "ankamall-ye-ic-bufe",
            titleTr: "ANKAmall / Ye-İç Büfe",
            titleEn: "ANKAmall / Ye-İç Buffet",
            areaTr: "Akköprü",
            areaEn: "Akköprü",
            category: "local_food_drink",
            priority: "high",
            estimatedDurationMinutes: 30,
            descriptionTr: "Muzlu süt veya atom için kısa lezzet durağı.",
            descriptionEn: "A short taste stop for banana milk or atom.",
            whatToDoTr: ["Muzlu süt veya atom iç"],
            whatToDoEn: ["Drink banana milk or atom"],
            tipsTr: ["Hızlıca merkeze geçin."],
            tipsEn: ["Move to the center quickly."],
            accessInfo: {
              summaryTr: "Akköprü metro durağına yakındır.",
              summaryEn: "Close to Akköprü metro station.",
              recommendedModes: ["metro"],
              walkingRequired: "low"
            },
            flexible: true
          },
          {
            order: 2,
            id: "kizilay-karanfil",
            titleTr: "Kızılay / Karanfil Sokak",
            titleEn: "Kızılay / Karanfil Street",
            areaTr: "Kızılay",
            areaEn: "Kızılay",
            category: "break",
            priority: "medium",
            estimatedDurationMinutes: 45,
            descriptionTr: "Kısa kafe molası ve merkez atmosferi.",
            descriptionEn: "A short cafe break and center atmosphere.",
            whatToDoTr: ["Kahve iç", "Kısa otur"],
            whatToDoEn: ["Drink coffee", "Sit briefly"],
            tipsTr: ["Kızılay mola noktasıdır."],
            tipsEn: ["Kızılay is a break point."],
            accessInfo: {
              summaryTr: "Kızılay merkezi aktarma noktasıdır.",
              summaryEn: "Kızılay is a central transfer point.",
              recommendedModes: ["metro", "ankaray"],
              walkingRequired: "low"
            },
            flexible: true
          },
          {
            order: 3,
            id: "anitkabir",
            titleTr: "Anıtkabir",
            titleEn: "Anıtkabir",
            areaTr: "Tandoğan / Anıttepe",
            areaEn: "Tandoğan / Anıttepe",
            category: "historic_landmark",
            priority: "must-see",
            estimatedDurationMinutes: 90,
            descriptionTr: "Rotanın ana kültür durağı.",
            descriptionEn: "The main cultural stop of the route.",
            whatToDoTr: ["Ziyaret et", "Aslanlı Yol'dan yürü"],
            whatToDoEn: ["Visit", "Walk from the Lions Road"],
            tipsTr: ["Giriş kontrolü için zaman bırakın."],
            tipsEn: ["Leave time for the security check."],
            accessInfo: {
              summaryTr: "Kızılay'dan Ankaray ile Anadolu/Tandoğan tarafına geçilebilir.",
              summaryEn: "Can be reached by Ankaray from Kızılay to Anadolu/Tandoğan side.",
              recommendedModes: ["ankaray", "taxi"],
              walkingRequired: "medium"
            },
            flexible: true
          },
          {
            order: 4,
            id: "tunali-kugulu-park",
            titleTr: "Tunalı / Kuğulu Park",
            titleEn: "Tunalı / Kuğulu Park",
            areaTr: "Tunalı Hilmi",
            areaEn: "Tunalı Hilmi",
            category: "evening_walk",
            priority: "high",
            estimatedDurationMinutes: 60,
            descriptionTr: "Akşamüstü park, yürüyüş ve kafe/bar hattı.",
            descriptionEn: "Evening park, walk, and cafe/bar line.",
            whatToDoTr: ["Kuğulu Park'ta tur at", "Tunalı'da yürü"],
            whatToDoEn: ["Tour Kuğulu Park", "Walk in Tunalı"],
            tipsTr: ["Akşam saatlerinde Tunalı daha canlı olur."],
            tipsEn: ["Tunalı is more lively in the evening."],
            accessInfo: {
              summaryTr: "Kızılay'dan otobüs veya taksiyle geçilebilir.",
              summaryEn: "Can be reached by bus or taxi from Kızılay.",
              recommendedModes: ["bus", "taxi"],
              walkingRequired: "low"
            },
            flexible: true
          },
          {
            order: 5,
            id: "if-sokak",
            titleTr: "IF Sokak",
            titleEn: "IF Street",
            areaTr: "Tunalı çevresi",
            areaEn: "Tunalı area",
            category: "nightlife",
            priority: "optional",
            estimatedDurationMinutes: 120,
            descriptionTr: "Akşamı oturarak kapatmak için rota finali.",
            descriptionEn: "Route finale to end the evening sitting down.",
            whatToDoTr: ["Bir şeyler iç", "Yemek molası ver"],
            whatToDoEn: ["Drink something", "Take a food break"],
            tipsTr: ["Dönüş ulaşımını düşünün."],
            tipsEn: ["Think about return transport."],
            accessInfo: {
              summaryTr: "Tunalı çevresindedir; Kuğulu Park'tan yürünür.",
              summaryEn: "It is around Tunalı; walk from Kuğulu Park.",
              recommendedModes: ["walk", "taxi"],
              walkingRequired: "low"
            },
            flexible: true
          }
        ],
        fallbackOptions: [
          { conditionTr: "Zaman azsa", conditionEn: "If time is short", actionTr: "Kızılay molasını çıkar.", actionEn: "Remove Kızılay break." }
        ],
        generalWarningsTr: ["Muzlu süt molası kısa tutulmalıdır."],
        generalWarningsEn: ["Banana milk break should be kept short."]
      }
    ]
  },
  istanbul: {
    city: {
      id: "istanbul",
      nameTr: "İstanbul",
      nameEn: "Istanbul",
      countryTr: "Türkiye",
      countryEn: "Turkey",
      regionTr: "Marmara",
      regionEn: "Marmara",
      descriptionTr: "Dünyanın başkenti İstanbul'da tarihi yarımada ve boğaz hattını birleştiren eşsiz bir rota.",
      descriptionEn: "A unique route combining the historical peninsula and the Bosphorus line in Istanbul, the capital of the world.",
      bestForTr: ["tarih tutkunları", "manzara sevenler", "gastronomi meraklıları"],
      bestForEn: ["history buffs", "view lovers", "gastronomy enthusiasts"],
      estimatedTotalDurationHours: 12,
      estimatedWalkingLevel: "high",
      recommendedStartTime: "09:00",
      recommendedEndTime: "23:00"
    },
    culturalHighlights: {
      localFoodsAndDrinks: [],
      iconicPlaces: [],
      localExperiences: [],
      thingsToKnowTr: [],
      thingsToKnowEn: []
    },
    routeVariants: [
      {
        id: "classic",
        titleTr: "Klasik İstanbul",
        titleEn: "Classic Istanbul",
        walkingLevel: "high",
        descriptionTr: "Sultanahmet'ten başlayıp Karaköy'de biten klasik bir gün.",
        descriptionEn: "A classic day starting from Sultanahmet and ending in Karaköy.",
        icon: "🕌"
      }
    ],
    tours: [
      {
        id: "istanbul-classic",
        variantId: "classic",
        titleTr: "İstanbul Klasik Tur",
        titleEn: "Istanbul Classic Tour",
        descriptionTr: "Eski şehrin kalbinde bir yolculuk.",
        descriptionEn: "A journey in the heart of the old city.",
        theme: ["history", "culture"],
        pace: "moderate",
        walkingLevel: "high",
        recommendedForTr: ["Herkes"],
        recommendedForEn: ["Everyone"],
        startAreaTr: "Sultanahmet",
        startAreaEn: "Sultanahmet",
        endAreaTr: "Karaköy",
        endAreaEn: "Karaköy",
        estimatedDurationHours: 10,
        routeNotesTr: [],
        routeNotesEn: [],
        stops: [
          {
            order: 1,
            id: "hagia-sophia",
            titleTr: "Ayasofya-i Kebir Cami-i Şerifi",
            titleEn: "Hagia Sophia Mosque",
            areaTr: "Sultanahmet",
            areaEn: "Sultanahmet",
            category: "historic_landmark",
            priority: "must-see",
            estimatedDurationMinutes: 60,
            descriptionTr: "Dünya mimarlık tarihinin en önemli yapılarından biri.",
            descriptionEn: "One of the most important structures in the history of world architecture.",
            whatToDoTr: ["İçeriyi gez", "Mimariyi incele"],
            whatToDoEn: ["Tour the interior", "Examine the architecture"],
            tipsTr: ["Kıyafet kuralına dikkat edin."],
            tipsEn: ["Pay attention to the dress code."],
            accessInfo: {
              summaryTr: "Tramvay ile ulaşım kolaydır.",
              summaryEn: "Easy access by tram.",
              recommendedModes: ["metro"],
              walkingRequired: "low"
            },
            flexible: false
          }
        ],
        fallbackOptions: [],
        generalWarningsTr: [],
        generalWarningsEn: []
      }
    ]
  },
  izmir: {
    city: {
      id: "izmir",
      nameTr: "İzmir",
      nameEn: "Izmir",
      countryTr: "Türkiye",
      countryEn: "Turkey",
      regionTr: "Ege",
      regionEn: "Aegean",
      descriptionTr: "Ege'nin incisi İzmir'de kordon boyu ve tarihi Kemeraltı çarşısını keşfedin.",
      descriptionEn: "Explore the promenade and the historical Kemeraltı bazaar in Izmir, the pearl of the Aegean.",
      bestForTr: ["deniz havası sevenler", "alışveriş meraklıları", "rahat tempo"],
      bestForEn: ["sea breeze lovers", "shopping enthusiasts", "relaxed pace"],
      estimatedTotalDurationHours: 8,
      estimatedWalkingLevel: "medium",
      recommendedStartTime: "10:00",
      recommendedEndTime: "21:00"
    },
    culturalHighlights: {
      localFoodsAndDrinks: [],
      iconicPlaces: [],
      localExperiences: [],
      thingsToKnowTr: [],
      thingsToKnowEn: []
    },
    routeVariants: [
      {
        id: "relaxed",
        titleTr: "Ege Esintisi",
        titleEn: "Aegean Breeze",
        walkingLevel: "medium",
        descriptionTr: "Kemeraltı'ndan Kordon'a uzanan keyifli bir gün.",
        descriptionEn: "A pleasant day stretching from Kemeraltı to Kordon.",
        icon: "🌊"
      }
    ],
    tours: [
      {
        id: "izmir-relaxed",
        variantId: "relaxed",
        titleTr: "İzmir Keyif Turu",
        titleEn: "Izmir Pleasure Tour",
        descriptionTr: "Şehrin tadını çıkarın.",
        descriptionEn: "Enjoy the city.",
        theme: ["lifestyle", "shopping"],
        pace: "relaxed",
        walkingLevel: "medium",
        recommendedForTr: ["Herkes"],
        recommendedForEn: ["Everyone"],
        startAreaTr: "Konak",
        startAreaEn: "Konak",
        endAreaTr: "Alsancak",
        endAreaEn: "Alsancak",
        estimatedDurationHours: 8,
        routeNotesTr: [],
        routeNotesEn: [],
        stops: [
          {
            order: 1,
            id: "clock-tower",
            titleTr: "Saat Kulesi",
            titleEn: "Clock Tower",
            areaTr: "Konak",
            areaEn: "Konak",
            category: "historic_landmark",
            priority: "must-see",
            estimatedDurationMinutes: 20,
            descriptionTr: "İzmir'in sembolü.",
            descriptionEn: "The symbol of Izmir.",
            whatToDoTr: ["Fotoğraf çek", "Meydanı gez"],
            whatToDoEn: ["Take photos", "Tour the square"],
            tipsTr: ["Güvercinleri besleyebilirsiniz."],
            tipsEn: ["You can feed the pigeons."],
            accessInfo: {
              summaryTr: "Vapur veya metro ile ulaşım çok kolaydır.",
              summaryEn: "Access is very easy by ferry or metro.",
              recommendedModes: ["metro", "shuttle"],
              walkingRequired: "low"
            },
            flexible: true
          }
        ],
        fallbackOptions: [],
        generalWarningsTr: [],
        generalWarningsEn: []
      }
    ]
  },
  london: {
    city: {
      id: "london",
      nameTr: "Londra",
      nameEn: "London",
      countryTr: "İngiltere",
      countryEn: "United Kingdom",
      regionTr: "Londra",
      regionEn: "London",
      descriptionTr: "Tarih ve modernizmin buluştuğu, Thames nehri kıyısında unutulmaz bir Londra günü.",
      descriptionEn: "An unforgettable day in London on the banks of the River Thames, where history and modernism meet.",
      bestForTr: ["müze severler", "yürüyüş", "ikonik yapılar"],
      bestForEn: ["museum lovers", "walking", "iconic structures"],
      estimatedTotalDurationHours: 10,
      estimatedWalkingLevel: "high",
      recommendedStartTime: "09:30",
      recommendedEndTime: "22:00"
    },
    culturalHighlights: {
      localFoodsAndDrinks: [],
      iconicPlaces: [],
      localExperiences: [],
      thingsToKnowTr: [],
      thingsToKnowEn: []
    },
    routeVariants: [
      {
        id: "tourist-classic",
        titleTr: "Turistik Klasik",
        titleEn: "Tourist Classic",
        walkingLevel: "high",
        descriptionTr: "Big Ben'den London Eye'a en popüler noktalar.",
        descriptionEn: "The most popular spots from Big Ben to the London Eye.",
        icon: "🎡"
      }
    ],
    tours: [
      {
        id: "london-classic",
        variantId: "tourist-classic",
        titleTr: "Londra İkonları Turu",
        titleEn: "London Icons Tour",
        descriptionTr: "Şehrin en bilinen noktalarını keşfedin.",
        descriptionEn: "Explore the most famous spots of the city.",
        theme: ["sightseeing", "history"],
        pace: "moderate",
        walkingLevel: "high",
        recommendedForTr: ["İlk kez gelenler"],
        recommendedForEn: ["First-time visitors"],
        startAreaTr: "Westminster",
        startAreaEn: "Westminster",
        endAreaTr: "South Bank",
        endAreaEn: "South Bank",
        estimatedDurationHours: 9,
        routeNotesTr: [],
        routeNotesEn: [],
        stops: [
          {
            order: 1,
            id: "big-ben",
            titleTr: "Big Ben & Parlamento Binası",
            titleEn: "Big Ben & Houses of Parliament",
            areaTr: "Westminster",
            areaEn: "Westminster",
            category: "historic_landmark",
            priority: "must-see",
            estimatedDurationMinutes: 45,
            descriptionTr: "Londra'nın dünyaca ünlü saat kulesi.",
            descriptionEn: "London's world-famous clock tower.",
            whatToDoTr: ["Fotoğraf çek", "Köprüden geç"],
            whatToDoEn: ["Take photos", "Cross the bridge"],
            tipsTr: ["En iyi kareler Westminster Köprüsü'nden çekilir."],
            tipsEn: ["The best shots are taken from Westminster Bridge."],
            accessInfo: {
              summaryTr: "Westminster metro durağına çok yakın.",
              summaryEn: "Very close to Westminster tube station.",
              recommendedModes: ["metro"],
              walkingRequired: "low"
            },
            flexible: true
          }
        ],
        fallbackOptions: [],
        generalWarningsTr: [],
        generalWarningsEn: []
      }
    ]
  },
  paris: {
    city: {
      id: "paris",
      nameTr: "Paris",
      nameEn: "Paris",
      countryTr: "Fransa",
      countryEn: "France",
      regionTr: "Île-de-France",
      regionEn: "Île-de-France",
      descriptionTr: "Aşkın ve sanatın şehri Paris'te Eyfel Kulesi'nden Louvre'a uzanan bir rota.",
      descriptionEn: "A route from the Eiffel Tower to the Louvre in Paris, the city of love and art.",
      bestForTr: ["romantizm", "sanat", "gastronomi"],
      bestForEn: ["romance", "art", "gastronomy"],
      estimatedTotalDurationHours: 11,
      estimatedWalkingLevel: "high",
      recommendedStartTime: "09:00",
      recommendedEndTime: "23:30"
    },
    culturalHighlights: {
      localFoodsAndDrinks: [],
      iconicPlaces: [],
      localExperiences: [],
      thingsToKnowTr: [],
      thingsToKnowEn: []
    },
    routeVariants: [
      {
        id: "romantic",
        titleTr: "Romantik Paris",
        titleEn: "Romantic Paris",
        walkingLevel: "medium",
        descriptionTr: "Nehir kenarı yürüyüşleri ve şık kafeler.",
        descriptionEn: "Riverside walks and chic cafes.",
        icon: "🥐"
      }
    ],
    tours: [
      {
        id: "paris-romantic",
        variantId: "romantic",
        titleTr: "Paris Aşk Turu",
        titleEn: "Paris Love Tour",
        descriptionTr: "Paris'in ruhunu hissedin.",
        descriptionEn: "Feel the soul of Paris.",
        theme: ["romance", "culture"],
        pace: "moderate",
        walkingLevel: "medium",
        recommendedForTr: ["Çiftler"],
        recommendedForEn: ["Couples"],
        startAreaTr: "Trocadéro",
        startAreaEn: "Trocadéro",
        endAreaTr: "Montmartre",
        endAreaEn: "Montmartre",
        estimatedDurationHours: 10,
        routeNotesTr: [],
        routeNotesEn: [],
        stops: [
          {
            order: 1,
            id: "eiffel-tower",
            titleTr: "Eyfel Kulesi",
            titleEn: "Eiffel Tower",
            areaTr: "Champ de Mars",
            areaEn: "Champ de Mars",
            category: "historic_landmark",
            priority: "must-see",
            estimatedDurationMinutes: 90,
            descriptionTr: "Dünyanın en ikonik yapısı.",
            descriptionEn: "The most iconic structure in the world.",
            whatToDoTr: ["Kuleye çık", "Bahçede piknik yap"],
            whatToDoEn: ["Go up the tower", "Have a picnic in the garden"],
            tipsTr: ["Biletleri önceden online alın."],
            tipsEn: ["Buy tickets online in advance."],
            accessInfo: {
              summaryTr: "Trocadéro durağından harika bir manzara ile yürünebilir.",
              summaryEn: "Can be walked from Trocadéro station with a great view.",
              recommendedModes: ["metro"],
              walkingRequired: "medium"
            },
            flexible: false
          }
        ],
        fallbackOptions: [],
        generalWarningsTr: [],
        generalWarningsEn: []
      }
    ]
  }
};
