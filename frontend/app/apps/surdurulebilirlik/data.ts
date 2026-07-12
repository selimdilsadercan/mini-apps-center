export type Category =
  | "Diğer"
  | "Mutfak & Gıda"
  | "Banyo & Kişisel Bakım"
  | "Kırtasiye & Ofis"
  | "Balkon & Bahçe"
  | "Atık Yönetimi"
  | "Topluluk & Doğa";

export interface Metric {
  key: string;
  label: string;
  unit?: string;
  inputType: "number" | "text" | "money";
  placeholder?: string;
}

export interface ChallengeItem {
  id: string;
  label: string;
  emoji: string;
  description: string;
  primaryMetric: Metric;
  secondaryMetrics?: Metric[];
  postTemplate: string;
  unitValue?: number;
}

export interface ChallengeCategory {
  category: Category;
  items: ChallengeItem[];
}

export const SUSTAINABILITY_CHALLENGES: ChallengeCategory[] = [
  {
    category: "Diğer",
    items: [
      {
        id: "custom_sustainability",
        label: "Kendi sürdürülebilir adımım",
        emoji: "✨",
        description:
          "Listede olmayan farklı bir sürdürülebilirlik adımını buraya yazabilirsin.",
        primaryMetric: {
          key: "action",
          label: "Ne yaptın?",
          inputType: "text",
          placeholder: "Plaj temizliğine katıldım"
        },
        secondaryMetrics: [
          {
            key: "impactPoints",
            label: "Etki Puanı",
            inputType: "number",
            placeholder: "30"
          }
        ],
        postTemplate:
          "{action} yaparak dünyamıza katkıda bulundum.",
        unitValue: 10
      }
    ]
  },
  {
    category: "Mutfak & Gıda",
    items: [
      {
        id: "peel_utilization",
        label: "Sebze Kabuklarını Değerlendirme",
        emoji: "🥘",
        description:
          "Sebze kabuklarını çöpe atmak yerine yemeklerde veya stok yapımında kullandım.",
        primaryMetric: {
          key: "usage",
          label: "Nasıl değerlendirdin?",
          inputType: "text",
          placeholder: "Sebze suyu yaptım"
        },
        secondaryMetrics: [
          {
            key: "impactPoints",
            label: "Etki Puanı",
            inputType: "number",
            placeholder: "30"
          }
        ],
        postTemplate:
          "Sebze kabuklarını {usage} şeklinde değerlendirerek israfı önledim.",
        unitValue: 30
      },
      {
        id: "refrigerator_org",
        label: "Buzdolabı Düzeni",
        emoji: "🧊",
        description:
          "Gıdaları uzun süre saklama yöntemlerini uyguladım.",
        primaryMetric: {
          key: "method",
          label: "Hangi yöntem?",
          inputType: "text",
          placeholder: "Yeşillikleri havluya sardım"
        },
        secondaryMetrics: [
          {
            key: "impactPoints",
            label: "Etki Puanı",
            inputType: "number",
            placeholder: "15"
          }
        ],
        postTemplate:
          "{method} yöntemiyle gıdalarımın ömrünü uzattım.",
        unitValue: 15
      },
      {
        id: "shopping_list",
        label: "Alışveriş Listesi Hazırlama",
        emoji: "📝",
        description:
          "İhtiyacım olmayan ürünleri almamak için alışverişe listeyle çıktım.",
        primaryMetric: {
          key: "avoidedItem",
          label: "Almaktan vazgeçtiğin bir ürün oldu mu?",
          inputType: "text",
          placeholder: "İhtiyacım olmayan atıştırmalıkları almadım"
        },
        secondaryMetrics: [
          {
            key: "savedMoney",
            label: "Yaklaşık tasarruf",
            unit: "₺",
            inputType: "money",
            placeholder: "100"
          }
        ],
        postTemplate:
          "Alışverişe listeyle çıkarak {avoidedItem}.",
        unitValue: 20
      },
      {
        id: "eat_first_shelf",
        label: "Önce Tüket Rafı Oluşturma",
        emoji: "🥫",
        description:
          "Son kullanma tarihi yaklaşan ürünleri buzdolabında görünür bir alana yerleştirdim.",
        primaryMetric: {
          key: "products",
          label: "Hangi ürünleri ayırdın?",
          inputType: "text",
          placeholder: "Yoğurt, peynir ve yeşillikler"
        },
        secondaryMetrics: [
          {
            key: "productCount",
            label: "Ürün sayısı",
            unit: "ürün",
            inputType: "number",
            placeholder: "4"
          }
        ],
        postTemplate:
          "Buzdolabımda önce tüketilecek ürünler için bir alan oluşturdum: {products}.",
        unitValue: 20
      }
    ]
  },
  {
    category: "Banyo & Kişisel Bakım",
    items: [
      {
        id: "solid_shampoo",
        label: "Katı Şampuan Denemesi",
        emoji: "🧼",
        description:
          "Plastik atığı azaltmak için katı şampuan kullanmaya başladım.",
        primaryMetric: {
          key: "brand",
          label: "Deneyim?",
          inputType: "text",
          placeholder: "Saçlarım daha yumuşak oldu"
        },
        secondaryMetrics: [
          {
            key: "impactPoints",
            label: "Etki Puanı",
            inputType: "number",
            placeholder: "40"
          }
        ],
        postTemplate:
          "Katı şampuan denememde şunu fark ettim: {brand}. Sıfır atığa bir adım daha!",
        unitValue: 40
      },
      {
        id: "packaging_upcycle",
        label: "Ambalaj Değerlendirme",
        emoji: "🧴",
        description:
          "Biten ürün ambalajlarını farklı amaçlarla yeniden kullandım.",
        primaryMetric: {
          key: "usage",
          label: "Yeni kullanım alanı?",
          inputType: "text",
          placeholder: "Kavanozu fırçalık yaptım"
        },
        secondaryMetrics: [
          {
            key: "impactPoints",
            label: "Etki Puanı",
            inputType: "number",
            placeholder: "25"
          }
        ],
        postTemplate:
          "Biten ürün ambalajını {usage} olarak değerlendirdim.",
        unitValue: 25
      },
      {
        id: "reusable_razor",
        label: "Uzun Ömürlü Tıraş Ürünü",
        emoji: "🪒",
        description:
          "Tek kullanımlık yerine uzun süre kullanılabilen bir tıraş ürünü tercih ettim.",
        primaryMetric: {
          key: "product",
          label: "Hangi ürün?",
          inputType: "text",
          placeholder: "Değiştirilebilir başlıklı tıraş bıçağı"
        },
        secondaryMetrics: [
          {
            key: "avoidedItems",
            label: "Önlenen tek kullanımlık ürün",
            unit: "adet",
            inputType: "number",
            placeholder: "1"
          }
        ],
        postTemplate:
          "Tek kullanımlık ürün yerine {product} tercih ettim.",
        unitValue: 30
      },
      {
        id: "reusable_cotton_pad",
        label: "Yıkanabilir Bakım Ürünü",
        emoji: "♻️",
        description:
          "Tek kullanımlık pamuk veya mendil yerine yıkanabilir bir alternatif kullandım.",
        primaryMetric: {
          key: "product",
          label: "Ne kullandın?",
          inputType: "text",
          placeholder: "Yıkanabilir makyaj temizleme pedi"
        },
        secondaryMetrics: [
          {
            key: "avoidedItems",
            label: "Önlenen tek kullanımlık ürün",
            unit: "adet",
            inputType: "number",
            placeholder: "2"
          }
        ],
        postTemplate:
          "Bugün tek kullanımlık ürün yerine {product} kullandım.",
        unitValue: 25
      }
    ]
  },
  {
    category: "Kırtasiye & Ofis",
    items: [
      {
        id: "refillable_products",
        label: "Yeniden Doldurulabilir Ürün",
        emoji: "🖋️",
        description:
          "Yeniden doldurulabilir kalem veya mürekkep tercih ettim.",
        primaryMetric: {
          key: "item",
          label: "Hangi ürün?",
          inputType: "text",
          placeholder: "Dolma kalem"
        },
        secondaryMetrics: [
          {
            key: "impactPoints",
            label: "Etki Puanı",
            inputType: "number",
            placeholder: "35"
          }
        ],
        postTemplate:
          "Tek kullanımlık yerine {item} tercih ederek atık miktarını azalttım.",
        unitValue: 35
      },
      {
        id: "digital_notes",
        label: "Dijital Not Kullanma",
        emoji: "💻",
        description:
          "Gereksiz çıktı almak yerine notlarımı dijital ortamda tuttum.",
        primaryMetric: {
          key: "subject",
          label: "Neyi dijital tuttun?",
          inputType: "text",
          placeholder: "Toplantı notlarımı"
        },
        secondaryMetrics: [
          {
            key: "savedPages",
            label: "Önlenen çıktı",
            unit: "sayfa",
            inputType: "number",
            placeholder: "4"
          }
        ],
        postTemplate:
          "{subject} dijital ortamda tutarak gereksiz kağıt kullanımını önledim.",
        unitValue: 15
      },
      {
        id: "borrow_book",
        label: "Kitap veya Kaynak Ödünç Alma",
        emoji: "📚",
        description:
          "Yeni satın almak yerine bir kitabı veya kaynağı ödünç aldım.",
        primaryMetric: {
          key: "item",
          label: "Neyi ödünç aldın?",
          inputType: "text",
          placeholder: "Ders kitabı"
        },
        secondaryMetrics: [
          {
            key: "savedMoney",
            label: "Yaklaşık tasarruf",
            unit: "₺",
            inputType: "money",
            placeholder: "300"
          }
        ],
        postTemplate:
          "{item} satın almak yerine ödünç alarak kaynak tüketimini azalttım.",
        unitValue: 30
      }
    ]
  },
  {
    category: "Balkon & Bahçe",
    items: [
      {
        id: "balcony_garden",
        label: "Balkonda Yetiştiricilik",
        emoji: "🌱",
        description:
          "Balkonumda sebze veya bitki yetiştirmeye başladım.",
        primaryMetric: {
          key: "plant",
          label: "Ne yetiştiriyorsun?",
          inputType: "text",
          placeholder: "Fesleğen ve domates"
        },
        secondaryMetrics: [
          {
            key: "impactPoints",
            label: "Etki Puanı",
            inputType: "number",
            placeholder: "30"
          }
        ],
        postTemplate:
          "Balkon bahçemde bugün {plant} ile ilgilendim.",
        unitValue: 30
      },
      {
        id: "replanting_scraps",
        label: "Atıklardan Yeniden Üretim",
        emoji: "🥬",
        description:
          "Mutfak artıklarından (marul kökü, soğan vb.) yeniden sebze yetiştirdim.",
        primaryMetric: {
          key: "plant",
          label: "Hangi sebze?",
          inputType: "text",
          placeholder: "Taze soğan"
        },
        secondaryMetrics: [
          {
            key: "impactPoints",
            label: "Etki Puanı",
            inputType: "number",
            placeholder: "45"
          }
        ],
        postTemplate:
          "Mutfak artığı olan {plant} parçasından yeni bir bitki var ettim!",
        unitValue: 45
      },
      {
        id: "reuse_watering_water",
        label: "Biriktirilen Suyla Bitki Sulama",
        emoji: "💧",
        description:
          "Sebze yıkama veya içme suyundan kalan temiz suyu bitkilerimde kullandım.",
        primaryMetric: {
          key: "source",
          label: "Hangi suyu kullandın?",
          inputType: "text",
          placeholder: "Sebzeleri yıkadığım suyu"
        },
        secondaryMetrics: [
          {
            key: "liters",
            label: "Yaklaşık su miktarı",
            unit: "L",
            inputType: "number",
            placeholder: "2"
          }
        ],
        postTemplate:
          "{source} bitkilerimi sulamak için yeniden kullandım.",
        unitValue: 25
      },
      {
        id: "compost_home",
        label: "Evde Kompost Denemesi",
        emoji: "🌿",
        description:
          "Uygun organik atıkları çöpe atmak yerine kompost için ayırdım.",
        primaryMetric: {
          key: "waste",
          label: "Neleri ayırdın?",
          inputType: "text",
          placeholder: "Kahve telvesi ve meyve kabukları"
        },
        secondaryMetrics: [
          {
            key: "amount",
            label: "Yaklaşık miktar",
            unit: "g",
            inputType: "number",
            placeholder: "300"
          }
        ],
        postTemplate:
          "Bugün kompost için {waste} ayırdım.",
        unitValue: 40
      },
      {
        id: "reuse_container_pot",
        label: "Eski Kabı Saksıya Dönüştürme",
        emoji: "🪴",
        description:
          "Kullanılmayan bir kabı çöpe atmak yerine saksı olarak değerlendirdim.",
        primaryMetric: {
          key: "container",
          label: "Neyi dönüştürdün?",
          inputType: "text",
          placeholder: "Yoğurt kovasını"
        },
        secondaryMetrics: [
          {
            key: "containerCount",
            label: "Dönüştürülen kap",
            unit: "adet",
            inputType: "number",
            placeholder: "1"
          }
        ],
        postTemplate:
          "{container} çöpe atmak yerine saksı olarak değerlendirdim.",
        unitValue: 30
      }
    ]
  },
  {
    category: "Atık Yönetimi",
    items: [
      {
        id: "separate_recyclables",
        label: "Geri Dönüşüm Atıklarını Ayırma",
        emoji: "♻️",
        description:
          "Kağıt, plastik, metal ve cam atıkları evsel çöpten ayrı topladım.",
        primaryMetric: {
          key: "materials",
          label: "Neleri ayırdın?",
          inputType: "text",
          placeholder: "Plastik şişe, karton ve cam"
        },
        secondaryMetrics: [
          {
            key: "itemCount",
            label: "Atık sayısı",
            unit: "adet",
            inputType: "number",
            placeholder: "8"
          }
        ],
        postTemplate:
          "Bugün geri dönüşüm için {materials} atıklarını ayrı topladım.",
        unitValue: 30
      },
      {
        id: "recycle_glass",
        label: "Cam Atıkları Geri Dönüşüme Verme",
        emoji: "🍾",
        description:
          "Cam şişe ve kavanozları çöpe atmak yerine cam geri dönüşüm noktasına götürdüm.",
        primaryMetric: {
          key: "itemCount",
          label: "Kaç cam ürün?",
          unit: "adet",
          inputType: "number",
          placeholder: "5"
        },
        secondaryMetrics: [
          {
            key: "location",
            label: "Nereye bıraktın?",
            inputType: "text",
            placeholder: "Mahalledeki cam kumbarasına"
          }
        ],
        postTemplate:
          "{itemCount} cam ürününü {location} bırakarak geri dönüşüme kazandırdım.",
        unitValue: 30
      },
      {
        id: "recycle_batteries",
        label: "Atık Pilleri Ayrı Toplama",
        emoji: "🔋",
        description:
          "Kullanılmış pilleri evsel çöpe atmayıp atık pil kutusuna götürdüm.",
        primaryMetric: {
          key: "batteryCount",
          label: "Kaç pil?",
          unit: "pil",
          inputType: "number",
          placeholder: "6"
        },
        secondaryMetrics: [
          {
            key: "location",
            label: "Nereye bıraktın?",
            inputType: "text",
            placeholder: "Marketin atık pil kutusuna"
          }
        ],
        postTemplate:
          "{batteryCount} atık pili {location} bırakarak doğru şekilde değerlendirdim.",
        unitValue: 40
      },
      {
        id: "recycle_electronics",
        label: "Elektronik Atığı Teslim Etme",
        emoji: "📱",
        description:
          "Bozuk veya kullanılmayan elektronik ürünü evsel çöpe atmak yerine uygun toplama noktasına teslim ettim.",
        primaryMetric: {
          key: "device",
          label: "Hangi cihaz?",
          inputType: "text",
          placeholder: "Eski telefon şarj cihazı"
        },
        secondaryMetrics: [
          {
            key: "deviceCount",
            label: "Cihaz sayısı",
            unit: "adet",
            inputType: "number",
            placeholder: "1"
          }
        ],
        postTemplate:
          "{device} elektronik atığını uygun toplama noktasına teslim ettim.",
        unitValue: 45
      },
      {
        id: "dispose_used_oil",
        label: "Atık Yağı Ayrı Toplama",
        emoji: "🛢️",
        description:
          "Kullanılmış kızartma yağını lavaboya dökmek yerine bir şişede biriktirdim.",
        primaryMetric: {
          key: "liters",
          label: "Ne kadar yağ?",
          unit: "L",
          inputType: "number",
          placeholder: "1"
        },
        secondaryMetrics: [
          {
            key: "location",
            label: "Nereye teslim edeceksin?",
            inputType: "text",
            placeholder: "Belediyenin atık yağ noktasına"
          }
        ],
        postTemplate:
          "{liters} litre atık yağı lavaboya dökmeyip ayrı biriktirdim.",
        unitValue: 45
      },
      {
        id: "declutter_recycle",
        label: "Evde Atık Ayrıştırma Turu",
        emoji: "🏠",
        description:
          "Evde bir alanı kontrol ederek geri dönüştürülebilecek atıkları ayırdım.",
        primaryMetric: {
          key: "area",
          label: "Hangi alanı düzenledin?",
          inputType: "text",
          placeholder: "Çalışma masası ve çekmeceler"
        },
        secondaryMetrics: [
          {
            key: "itemCount",
            label: "Ayrılan atık",
            unit: "adet",
            inputType: "number",
            placeholder: "10"
          }
        ],
        postTemplate:
          "{area} alanını düzenleyerek geri dönüştürülebilecek atıkları ayırdım.",
        unitValue: 25
      },
      {
        id: "reuse_shipping_box",
        label: "Kargo Kutusunu Yeniden Kullanma",
        emoji: "📦",
        description:
          "Gelen bir kargo kutusunu depolama, gönderim veya farklı bir amaç için yeniden kullandım.",
        primaryMetric: {
          key: "usage",
          label: "Nasıl kullandın?",
          inputType: "text",
          placeholder: "Dolap düzenleyici yaptım"
        },
        secondaryMetrics: [
          {
            key: "boxCount",
            label: "Kutu sayısı",
            unit: "adet",
            inputType: "number",
            placeholder: "2"
          }
        ],
        postTemplate:
          "Kargo kutusunu çöpe atmak yerine {usage} olarak yeniden kullandım.",
        unitValue: 25
      }
    ]
  },
  {
    category: "Topluluk & Doğa",
    items: [
      {
        id: "pick_up_litter",
        label: "Çevredeki Çöpleri Toplama",
        emoji: "🧤",
        description:
          "Yürüyüş yaptığım alanda gördüğüm çöpleri toplayıp uygun çöp kutusuna attım.",
        primaryMetric: {
          key: "location",
          label: "Nerede topladın?",
          inputType: "text",
          placeholder: "Mahalle parkında"
        },
        secondaryMetrics: [
          {
            key: "itemCount",
            label: "Toplanan atık",
            unit: "adet",
            inputType: "number",
            placeholder: "12"
          }
        ],
        postTemplate:
          "{location} çevresinde gördüğüm çöpleri toplayarak alanı temizledim.",
        unitValue: 40
      },
      {
        id: "join_cleanup",
        label: "Temizlik Etkinliğine Katılma",
        emoji: "🌊",
        description:
          "Sahil, park, orman veya mahalle temizliği etkinliğine katıldım.",
        primaryMetric: {
          key: "event",
          label: "Hangi etkinlik?",
          inputType: "text",
          placeholder: "Sahil temizliği"
        },
        secondaryMetrics: [
          {
            key: "hours",
            label: "Katılım süresi",
            unit: "saat",
            inputType: "number",
            placeholder: "2"
          }
        ],
        postTemplate:
          "{event} etkinliğine katılarak çevremizin temiz kalmasına katkı sağladım.",
        unitValue: 50
      },
      {
        id: "share_unused_food",
        label: "İhtiyaç Fazlasını Paylaşma",
        emoji: "🤲",
        description:
          "Kullanabileceğimden fazla olan gıda veya ürünü çöpe atmak yerine paylaştım.",
        primaryMetric: {
          key: "item",
          label: "Ne paylaştın?",
          inputType: "text",
          placeholder: "Fazla aldığım paketli gıdaları"
        },
        secondaryMetrics: [
          {
            key: "itemCount",
            label: "Paylaşılan ürün",
            unit: "adet",
            inputType: "number",
            placeholder: "4"
          }
        ],
        postTemplate:
          "İhtiyaç fazlası {item} ürünlerini paylaşarak israfı önledim.",
        unitValue: 35
      },
      {
        id: "teach_sustainable_tip",
        label: "Bir İpucu Paylaşma",
        emoji: "💬",
        description:
          "İşe yarayan bir sürdürülebilirlik yöntemini çevremdeki biriyle paylaştım.",
        primaryMetric: {
          key: "tip",
          label: "Hangi ipucu?",
          inputType: "text",
          placeholder: "Sebze yıkama suyunu bitkilerde kullanmayı"
        },
        secondaryMetrics: [
          {
            key: "people",
            label: "Kaç kişiyle paylaştın?",
            unit: "kişi",
            inputType: "number",
            placeholder: "2"
          }
        ],
        postTemplate:
          "Bugün {tip} sürdürülebilirlik önerisini çevremle paylaştım.",
        unitValue: 20
      },
      {
        id: "support_local_producer",
        label: "Yerel Üreticiyi Destekleme",
        emoji: "🧺",
        description:
          "Alışverişimde yerel bir üretici veya küçük işletmeden ürün tercih ettim.",
        primaryMetric: {
          key: "product",
          label: "Ne aldın?",
          inputType: "text",
          placeholder: "Yerel üreticiden meyve"
        },
        secondaryMetrics: [
          {
            key: "amount",
            label: "Harcama",
            unit: "₺",
            inputType: "money",
            placeholder: "250"
          }
        ],
        postTemplate:
          "Bugünkü alışverişimde {product} alarak yerel üreticiyi destekledim.",
        unitValue: 30
      },
      {
        id: "report_environmental_issue",
        label: "Çevre Sorununu Bildirme",
        emoji: "📣",
        description:
          "Kaçak döküm, su kaçağı veya çevre kirliliği gibi bir sorunu ilgili kuruma bildirdim.",
        primaryMetric: {
          key: "issue",
          label: "Neyi bildirdin?",
          inputType: "text",
          placeholder: "Sokaktaki su kaçağını"
        },
        secondaryMetrics: [
          {
            key: "channel",
            label: "Nereye bildirdin?",
            inputType: "text",
            placeholder: "Belediyeye"
          }
        ],
        postTemplate:
          "{issue} sorununu {channel} bildirerek çözülmesine katkı sağladım.",
        unitValue: 40
      },
      {
        id: "plant_seed",
        label: "Tohum veya Fidan Dikme",
        emoji: "🌳",
        description:
          "Uygun ve izin verilen bir alanda tohum, çiçek veya fidan diktim.",
        primaryMetric: {
          key: "plant",
          label: "Ne diktin?",
          inputType: "text",
          placeholder: "Bir fesleğen fidesi"
        },
        secondaryMetrics: [
          {
            key: "plantCount",
            label: "Dikilen bitki",
            unit: "adet",
            inputType: "number",
            placeholder: "1"
          }
        ],
        postTemplate:
          "Bugün {plant} dikerek yaşadığım alana yeni bir bitki kazandırdım.",
        unitValue: 40
      }
    ]
  }
];
