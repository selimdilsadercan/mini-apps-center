export interface Metric {
  key: string;
  label: string;
  unit: string;
  inputType: "money" | "number" | "text";
  placeholder: string;
}

export interface ChallengeItem {
  id: string;
  label: string;
  emoji: string;
  type: "saving" | "earning";
  description: string;
  primaryMetric: Metric;
  secondaryMetrics?: Metric[];
  postTemplate: string;
  shareTitle: string;
  unitValue?: number;
}

export interface Category {
  category: string;
  emoji: string;
  items: ChallengeItem[];
}

export const SAVING_CHALLENGES: Category[] = [
  {
    "category": "Ek Kazanç",
    "emoji": "💰",
    "items": [
      {
        "id": "extra_income_general",
        "label": "Ek kazanç elde ettim",
        "emoji": "💸",
        "type": "earning",
        "description": "Normal gelirim dışında bir işten veya satıştan ek gelir elde ettim.",
        "primaryMetric": {
          "key": "incomeSource",
          "label": "Nereden kazandın?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Freelance iş, satış, anket..."
        },
        "secondaryMetrics": [
          {
            "key": "amountEarned",
            "label": "Kazanılan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "500"
          }
        ],
        "postTemplate": "{incomeSource} yoluyla {amountEarned} TL ek kazanç elde ettim.",
        "shareTitle": "Ek kazanç elde ettim"
      }
    ]
  },
  {
    "category": "Yiyecek & İçecek",
    "emoji": "🍽️",
    "items": [
      {
        "id": "home_made_beverage",
        "label": "İçeceğimi kendim hazırladım",
        "emoji": "☕",
        "type": "saving",
        "description": "Dışarıdan almak yerine kahve veya çayımı kendim hazırladım.",
        "primaryMetric": {
          "key": "beverageName",
          "label": "Ne hazırladın?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Filtre kahve, soğuk çay..."
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "95"
          }
        ],
        "postTemplate": "Dışarıdan almak yerine {beverageName} hazırladım, {amountSaved} TL tasarruf ettim.",
        "shareTitle": "İçeceğimi kendim hazırladım"
      },
      {
        "id": "lunch_from_home",
        "label": "Evden yemek götürdüm",
        "emoji": "🍱",
        "type": "saving",
        "description": "Okula/ofise dışarıdan yemek almak yerine evden yemek götürdüm.",
        "unitValue": 180,
        "primaryMetric": {
          "key": "dayCount",
          "label": "Kaç gün?",
          "unit": "gün",
          "inputType": "number",
          "placeholder": "1"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "180"
          }
        ],
        "postTemplate": "{dayCount} gün evden yemek götürdüm, {amountSaved} TL cepte kaldı.",
        "shareTitle": "Evden yemek götürerek tasarruf ettim"
      },
      {
        "id": "water_bottle_refill",
        "label": "Mataramı yanıma aldım",
        "emoji": "💧",
        "type": "saving",
        "description": "Dışarıdan su almak yerine mataramı kullandım.",
        "unitValue": 15,
        "primaryMetric": {
          "key": "bottleCount",
          "label": "Kaç kez doldurdun?",
          "unit": "adet",
          "inputType": "number",
          "placeholder": "1"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "15"
          }
        ],
        "postTemplate": "Dışarıdan su almak yerine mataramı kullandım, {amountSaved} TL tasarruf ettim.",
        "shareTitle": "Mataramı kullandım"
      }
    ]
  },
  {
    "category": "Geri Kazanım",
    "emoji": "♻️",
    "items": [
      {
        "id": "bottle_return",
        "label": "Şişe/kutu iade ettim",
        "emoji": "♻️",
        "type": "earning",
        "description": "Biriktirdiğim şişe veya kutuları iade noktasına götürdüm.",
        "unitValue": 0.1,
        "primaryMetric": {
          "key": "itemCount",
          "label": "Kaç şişe/kutu?",
          "unit": "adet",
          "inputType": "number",
          "placeholder": "100"
        },
        "secondaryMetrics": [
          {
            "key": "amountEarned",
            "label": "Geri kazanılan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "10"
          }
        ],
        "postTemplate": "{itemCount} şişe/kutu iade ettim, {amountEarned} TL geri kazandım.",
        "shareTitle": "Atığı paraya çevirdim"
      },
      {
        "id": "scrap_sold",
        "label": "Hurda/geri dönüşüm sattım",
        "emoji": "🧱",
        "type": "earning",
        "description": "Evdeki metal, kağıt, plastik veya elektronik hurdaları sattım.",
        "unitValue": 25,
        "primaryMetric": {
          "key": "weight",
          "label": "Yaklaşık ağırlık",
          "unit": "kg",
          "inputType": "number",
          "placeholder": "1"
        },
        "secondaryMetrics": [
          {
            "key": "amountEarned",
            "label": "Kazanılan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "25"
          }
        ],
        "postTemplate": "{weight} kg geri dönüşüm malzemesi sattım, {amountEarned} TL kazandım.",
        "shareTitle": "Evdeki fazlalıklar paraya döndü"
      }
    ]
  },
  {
    "category": "Satış & İkinci El",
    "emoji": "📦",
    "items": [
      {
        "id": "unused_item_sold",
        "label": "Kullanmadığım eşyayı sattım",
        "emoji": "📦",
        "type": "earning",
        "description": "Evde duran ve kullanmadığım bir eşyayı sattım.",
        "primaryMetric": {
          "key": "itemName",
          "label": "Ne sattın?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Eski kulaklık"
        },
        "secondaryMetrics": [
          {
            "key": "amountEarned",
            "label": "Kazanılan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "650"
          },
          {
            "key": "itemCount",
            "label": "Kaç eşya sattın?",
            "unit": "adet",
            "inputType": "number",
            "placeholder": "1"
          }
        ],
        "postTemplate": "{itemName} sattım, {amountEarned} TL kazandım.",
        "shareTitle": "Kullanmadığım eşyayı paraya çevirdim"
      },
      {
        "id": "second_hand_bought",
        "label": "İkinci el aldım",
        "emoji": "🛍️",
        "type": "saving",
        "description": "Sıfır almak yerine ikinci el alarak daha az para harcadım.",
        "primaryMetric": {
          "key": "itemName",
          "label": "Ne aldın?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Klavye"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Sıfıra göre tasarruf",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "500"
          }
        ],
        "postTemplate": "{itemName} ürününü ikinci el aldım, {amountSaved} TL tasarruf ettim.",
        "shareTitle": "Sıfır almak yerine ikinci el aldım"
      },
      {
        "id": "discount_used",
        "label": "İndirim/kupon kullandım",
        "emoji": "🏷️",
        "type": "saving",
        "description": "Alacağım üründe indirim veya kupon kullanarak daha az ödedim.",
        "primaryMetric": {
          "key": "purchaseName",
          "label": "Ne aldın?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Market alışverişi"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "İndirimle kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "150"
          }
        ],
        "postTemplate": "{purchaseName} için kupon/indirim kullandım, {amountSaved} TL tasarruf ettim.",
        "shareTitle": "İndirim yakaladım"
      }
    ]
  },
  {
    "category": "Ulaşım",
    "emoji": "🚇",
    "items": [
      {
        "id": "taxi_skipped",
        "label": "Taksiye binmedim",
        "emoji": "🚕",
        "type": "saving",
        "description": "Taksi yerine toplu taşıma, yürüyüş veya başka bir seçenek kullandım.",
        "unitValue": 180,
        "primaryMetric": {
          "key": "tripCount",
          "label": "Kaç yolculuk?",
          "unit": "kez",
          "inputType": "number",
          "placeholder": "1"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "180"
          }
        ],
        "postTemplate": "{tripCount} kez taksiye binmedim, {amountSaved} TL cepte kaldı.",
        "shareTitle": "Taksi parasını cebimde tuttum"
      },
      {
        "id": "walked_instead",
        "label": "Yürüdüm",
        "emoji": "🚶",
        "type": "saving",
        "description": "Kısa mesafede araç veya taksi kullanmak yerine yürüdüm.",
        "unitValue": 30,
        "primaryMetric": {
          "key": "distance",
          "label": "Yaklaşık mesafe",
          "unit": "km",
          "inputType": "number",
          "placeholder": "2"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "60"
          }
        ],
        "postTemplate": "{distance} km yürüdüm, {amountSaved} TL cepte kaldı.",
        "shareTitle": "Kısa mesafeyi yürüdüm"
      },
      {
        "id": "public_transport_used",
        "label": "Toplu taşıma kullandım",
        "emoji": "🚌",
        "type": "saving",
        "description": "Araç/taksi yerine toplu taşıma kullandım.",
        "unitValue": 120,
        "primaryMetric": {
          "key": "tripCount",
          "label": "Kaç yolculuk?",
          "unit": "kez",
          "inputType": "number",
          "placeholder": "1"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "120"
          }
        ],
        "postTemplate": "{tripCount} yolculukta toplu taşıma kullandım, {amountSaved} TL tasarruf ettim.",
        "shareTitle": "Toplu taşımayla tasarruf ettim"
      },
      {
        "id": "carpool",
        "label": "Yol paylaştım",
        "emoji": "🚗",
        "type": "saving",
        "description": "Tek başıma gitmek yerine arkadaşlarla yol masrafını paylaştım.",
        "unitValue": 33.33,
        "primaryMetric": {
          "key": "peopleCount",
          "label": "Kaç kişiyle?",
          "unit": "kişi",
          "inputType": "number",
          "placeholder": "3"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "100"
          }
        ],
        "postTemplate": "{peopleCount} kişi yol paylaştık, {amountSaved} TL tasarruf ettim.",
        "shareTitle": "Yol masrafını azalttım"
      }
    ]
  },
  {
    "category": "Abonelik & Dijital",
    "emoji": "📱",
    "items": [
      {
        "id": "subscription_cancelled",
        "label": "Abonelik iptal ettim",
        "emoji": "✂️",
        "type": "saving",
        "description": "Kullanmadığım bir aboneliği iptal ettim.",
        "primaryMetric": {
          "key": "subscriptionName",
          "label": "Hangi abonelik?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Netflix"
        },
        "secondaryMetrics": [
          {
            "key": "monthlySaved",
            "label": "Aylık tasarruf",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "149"
          }
        ],
        "postTemplate": "{subscriptionName} aboneliğini iptal ettim, ayda {monthlySaved} TL cepte kalacak.",
        "shareTitle": "Kullanmadığım aboneliği kapattım"
      },
      {
        "id": "student_plan_used",
        "label": "Öğrenci/aile planına geçtim",
        "emoji": "🎓",
        "type": "saving",
        "description": "Normal plan yerine öğrenci, aile veya daha ucuz plana geçtim.",
        "primaryMetric": {
          "key": "serviceName",
          "label": "Hangi servis?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Spotify"
        },
        "secondaryMetrics": [
          {
            "key": "monthlySaved",
            "label": "Aylık tasarruf",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "80"
          }
        ],
        "postTemplate": "{serviceName} için daha ucuz plana geçtim, ayda {monthlySaved} TL tasarruf edeceğim.",
        "shareTitle": "Daha ucuz plana geçtim"
      }
    ]
  },
  {
    "category": "Seyahat",
    "emoji": "✈️",
    "items": [
      {
        "id": "accommodation_saving",
        "label": "Konaklamadan tasarruf ettim",
        "emoji": "🏨",
        "type": "saving",
        "description": "Otel yerine arkadaşta kaldım, kamp yaptım veya daha uygun bir seçenek buldum.",
        "primaryMetric": {
          "key": "stayType",
          "label": "Nerede kaldın?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Arkadaş evi, kamp, hostel..."
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "2000"
          }
        ],
        "postTemplate": "Otel yerine {stayType} tercih ettim, {amountSaved} TL tasarruf ettim.",
        "shareTitle": "Konaklamadan tasarruf ettim"
      }
    ]
  },
  {
    "category": "Market & Ev",
    "emoji": "🛒",
    "items": [
      {
        "id": "borrowed_item",
        "label": "Ödünç aldım",
        "emoji": "🤝",
        "type": "saving",
        "description": "Satın almak yerine bir arkadaştan veya komşudan ödünç aldım.",
        "primaryMetric": {
          "key": "itemName",
          "label": "Ne ödünç aldın?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Matkap"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "1500"
          }
        ],
        "postTemplate": "{itemName} satın almak yerine ödünç aldım, {amountSaved} TL tasarruf ettim.",
        "shareTitle": "Satın almak yerine ödünç aldım"
      },
      {
        "id": "home_grown_general",
        "label": "Kendim yetiştirdim",
        "emoji": "🌱",
        "type": "saving",
        "description": "Marketten almak yerine evde/bahçede kendi sebze veya meyvemi yetiştirdim.",
        "primaryMetric": {
          "key": "itemName",
          "label": "Ne yetiştirdin?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Domates, biber, nane..."
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "50"
          }
        ],
        "postTemplate": "Evde {itemName} yetiştirdim, {amountSaved} TL tasarruf ettim.",
        "shareTitle": "Kendi ürünümü yetiştiriyorum"
      },
      {
        "id": "home_produced",
        "label": "Kendim ürettim",
        "emoji": "🛠️",
        "type": "saving",
        "description": "Satın almak yerine ihtiyacım olan bir şeyi kendim ürettim veya yaptım.",
        "primaryMetric": {
          "key": "itemName",
          "label": "Ne ürettin/yaptın?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Puzzle çerçevesi, ekmek, sabun..."
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "200"
          }
        ],
        "postTemplate": "{itemName} satın almak yerine kendim ürettim, {amountSaved} TL tasarruf ettim.",
        "shareTitle": "Satın almadım, kendim ürettim"
      },
      {
        "id": "self_service",
        "label": "Hizmet almadım, kendim yaptım",
        "emoji": "🧹",
        "type": "saving",
        "description": "Dışarıdan hizmet almak yerine (boya, temizlik, bakım vb.) işi kendim hallettim.",
        "primaryMetric": {
          "key": "serviceName",
          "label": "Hangi işi kendin yaptın?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Ev boyama, temizlik, araç bakımı..."
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "2500"
          }
        ],
        "postTemplate": "{serviceName} işini dışarıdan hizmet almak yerine kendim yaptım, {amountSaved} TL tasarruf ettim.",
        "shareTitle": "Hizmet almadım, kendim yaptım"
      },
      {
        "id": "reusable_bag_used",
        "label": "Poşet almadım",
        "emoji": "🛍️",
        "type": "saving",
        "description": "Plastik poşet almak yerine evden bez çanta veya file götürdüm.",
        "unitValue": 2.5,
        "primaryMetric": {
          "key": "bagCount",
          "label": "Kaç poşet almadın?",
          "unit": "adet",
          "inputType": "number",
          "placeholder": "1"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "2.5"
          }
        ],
        "postTemplate": "{bagCount} adet plastik poşet almadım, bez çanta kullanarak {amountSaved} TL tasarruf ettim.",
        "shareTitle": "Bez çanta kullanarak doğayı ve cebimi korudum"
      },
      {
        "id": "bulk_buying",
        "label": "Toplu aldım",
        "emoji": "📦",
        "type": "saving",
        "description": "Tek tek almak yerine toplu alarak birim fiyatı düşürdüm.",
        "primaryMetric": {
          "key": "itemName",
          "label": "Ne aldın?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Poşet çay"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Tasarruf",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "75"
          }
        ],
        "postTemplate": "{itemName} ürününü toplu aldım, {amountSaved} TL tasarruf ettim.",
        "shareTitle": "Toplu alarak daha az ödedim"
      },
      {
        "id": "home_repair",
        "label": "Kendim tamir ettim",
        "emoji": "🛠️",
        "type": "saving",
        "description": "Basit bir tamiri servis çağırmadan kendim hallettim.",
        "primaryMetric": {
          "key": "repairName",
          "label": "Neyi tamir ettin?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Masa ayağı"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "300"
          }
        ],
        "postTemplate": "{repairName} tamirini kendim yaptım, {amountSaved} TL cepte kaldı.",
        "shareTitle": "Servis parası vermedim"
      },
      {
        "id": "leftovers_used",
        "label": "Artan yemeği değerlendirdim",
        "emoji": "🥘",
        "type": "saving",
        "description": "Artan yemeği çöpe atmak yerine yeni bir öğünde kullandım.",
        "unitValue": 100,
        "primaryMetric": {
          "key": "mealCount",
          "label": "Kaç öğün?",
          "unit": "öğün",
          "inputType": "number",
          "placeholder": "1"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "100"
          }
        ],
        "postTemplate": "Artan yemeği {mealCount} öğün değerlendirdim, {amountSaved} TL cepte kaldı.",
        "shareTitle": "Yemek israfını azalttım"
      }
    ]
  },
  {
    "category": "Diğer",
    "emoji": "✨",
    "items": [
      {
        "id": "custom_saving",
        "label": "Kendi tasarrufumu ekle",
        "emoji": "✍️",
        "type": "saving",
        "description": "Listede olmayan farklı bir tasarruf yöntemini buraya yazabilirsin.",
        "primaryMetric": {
          "key": "customTitle",
          "label": "Ne yaptın?",
          "unit": "",
          "inputType": "text",
          "placeholder": "Örn: Kendi saçımı kestim"
        },
        "secondaryMetrics": [
          {
            "key": "amountSaved",
            "label": "Cepte kalan para",
            "unit": "TL",
            "inputType": "money",
            "placeholder": "200"
          }
        ],
        "postTemplate": "{customTitle} yaptım, {amountSaved} TL tasarruf ettim.",
        "shareTitle": "Kendi tasarrufumu yaptım"
      }
    ]
  }
];
