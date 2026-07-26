export interface HobbyResource {
  labelTr: string;
  labelEn: string;
  url: string;
}

export interface Hobby {
  id: string;
  titleTr: string;
  titleEn: string;
  categoryTr: string;
  categoryEn: string;
  descriptionTr: string;
  descriptionEn: string;
  difficulty: "easy" | "medium" | "hard";
  cost: "low" | "medium" | "high";
  setupTimeTr: string;
  setupTimeEn: string;
  toolsTr: string[];
  toolsEn: string[];
  stepsTr: string[];
  stepsEn: string[];
  resources: HobbyResource[];
}

export const HOBBIES_DATA: Hobby[] = [
  {
    id: "geoguessr",
    titleTr: "GeoGuessr / Harita Keşif",
    titleEn: "GeoGuessr / Map Discovery",
    categoryTr: "Zihin Oyunları",
    categoryEn: "Mind Games",
    descriptionTr: "Google Street View kullanarak dünyadaki konumunuzu tahmin etmeye çalıştığınız popüler coğrafya oyunu.",
    descriptionEn: "A popular geography game where you guess your location in the world using Google Street View.",
    difficulty: "medium",
    cost: "low",
    setupTimeTr: "5 Dakika",
    setupTimeEn: "5 Minutes",
    toolsTr: ["İnternet Bağlantısı", "Bilgisayar veya Akıllı Telefon"],
    toolsEn: ["Internet Connection", "Computer or Smartphone"],
    stepsTr: [
      "Coğrafi ipuçlarını (yol çizgileri, tabelalar, toprak rengi) öğrenin.",
      "OpenGuessr üzerinde ücretsiz pratik yapmaya başlayın.",
      "GeoHints sitesini ziyaret ederek ülkelerin telefon direkleri, plakaları gibi detaylı ipuçlarını inceleyin.",
      "Plonkit kılavuzları ile profesyonel taktikleri ve meta-bilgileri öğrenin."
    ],
    stepsEn: [
      "Learn geographical clues (road markings, signs, soil color).",
      "Start practicing for free on OpenGuessr.",
      "Visit GeoHints to study country-specific clues like telephone poles and license plates.",
      "Read Plonkit guides to master professional tactics and meta-clues."
    ],
    resources: [
      { labelTr: "OpenGuessr - Ücretsiz Coğrafya Oyunu", labelEn: "OpenGuessr - Free Geography Game", url: "https://openguessr.com/" },
      { labelTr: "GeoHints - Coğrafi İpuçları Kütüphanesi", labelEn: "GeoHints - Geographic Clues Library", url: "https://geohints.com/" },
      { labelTr: "Plonkit Rehberi - Profesyonel GeoGuessr Kılavuzu", labelEn: "Plonkit Guide - Professional GeoGuessr Guide", url: "https://www.plonkit.net/guide" }
    ]
  },
  {
    id: "wood-carving",
    titleTr: "Ahşap Oyma",
    titleEn: "Wood Carving",
    categoryTr: "El Sanatları",
    categoryEn: "Creative Arts",
    descriptionTr: "Ahşap blokları bıçak ve keski yardımıyla yontarak sanatsal figürler veya mutfak gereçleri üretme sanatı.",
    descriptionEn: "The art of shaping wood into figures or utensils using knives and chisels.",
    difficulty: "hard",
    cost: "medium",
    setupTimeTr: "2-3 Gün (Malzeme Temini)",
    setupTimeEn: "2-3 Days (Sourcing Materials)",
    toolsTr: ["Oyma Bıçağı", "Ihlamur Ağacı Bloğu", "Kesilmeye Dayanıklı Eldiven", "Bileme Kayışı"],
    toolsEn: ["Carving Knife", "Basswood Block", "Cut-resistant Gloves", "Strop and Compound"],
    stepsTr: [
      "Temel güvenlik kurallarını ve kesilmez eldiven kullanımını öğrenin.",
      "Ihlamur ağacı gibi yumuşak bir ahşap ve başlangıç oyma bıçağı edinin.",
      "İlk olarak basit bir ahşap kaşık veya küçük bir figür (örneğin kuş) oymayı deneyin.",
      "Bıçağınızı her çalışmadan önce bileyerek keskin tutmayı öğrenin."
    ],
    stepsEn: [
      "Learn essential safety rules and the use of cut-resistant gloves.",
      "Acquire a soft wood block (like basswood) and a beginner carving knife.",
      "Start by carving a simple wooden spoon or a small figure (like a bird).",
      "Learn to keep your knife razor-sharp by stropping it regularly."
    ],
    resources: [
      { labelTr: "Başlangıç İçin Ahşap Oyma Eğitimi", labelEn: "Wood Carving for Beginners Video", url: "https://youtu.be/Kjn1lQC4tm4?si=5-Z2HiorL8jAWtFe" },
      { labelTr: "Kolay Ahşap Oyma Projeleri", labelEn: "Easy Wood Carving Projects Tutorial", url: "https://youtu.be/y4cR6p078HA?si=8I59-_kIMM32p0vn" },
      { labelTr: "Nadav Art & Wood Kanalı", labelEn: "Nadav Art & Wood Channel", url: "https://youtube.com/@nadavartandwood?si=AQd_P0J6pDs9W1UA" },
      { labelTr: "Detaylı Figür Oyma Teknikleri", labelEn: "Detailed Figure Carving Techniques", url: "https://youtu.be/hdpgm0IkpXo?si=W730gAiw6gzAvdji" }
    ]
  },
  {
    id: "origami",
    titleTr: "Origami / Kağıt Katlama",
    titleEn: "Origami / Paper Folding",
    categoryTr: "El Sanatları",
    categoryEn: "Creative Arts",
    descriptionTr: "Makas ve yapıştırıcı kullanmadan, kare kağıtları katlayarak çeşitli hayvan, çiçek ve geometrik şekiller oluşturma sanatı.",
    descriptionEn: "The traditional Japanese art of folding square paper into shapes of animals, flowers, or geometric designs without cutting or gluing.",
    difficulty: "easy",
    cost: "low",
    setupTimeTr: "1 Dakika",
    setupTimeEn: "1 Minute",
    toolsTr: ["Kare Origami Kağıdı"],
    toolsEn: ["Square Origami Paper"],
    stepsTr: [
      "Temel katlama tekniklerini (vadi katlaması, dağ katlaması) öğrenin.",
      "İlk olarak klasik Turna Kuşu (Crane) modelini katlamayı deneyin.",
      "Origami.me üzerindeki şemaları takip ederek adım adım ilerleyin.",
      "Daha karmaşık modüler veya 3D origami modellerine geçiş yapın."
    ],
    stepsEn: [
      "Learn basic folding techniques (valley fold, mountain fold).",
      "Fold your first classic Origami Crane model.",
      "Follow step-by-step diagrams and instructions on Origami.me.",
      "Advance to complex modular or 3D origami designs."
    ],
    resources: [
      { labelTr: "Turna Kuşu Katlama Rehberi (Video)", labelEn: "Folding Origami Crane (Video Guide)", url: "https://youtu.be/PWylGb8EyQw?si=hVVrhV6J-1jJzaaG" },
      { labelTr: "Origami.me - Başlangıç Rehberi ve Modeller", labelEn: "Origami.me - Beginner Guide & Models", url: "https://origami.me/" }
    ]
  },
  {
    id: "yoyo",
    titleTr: "YoYo",
    titleEn: "YoYo Tricks",
    categoryTr: "Performans ve Oyun",
    categoryEn: "Active & Performance",
    descriptionTr: "Modern rulmanlı yoyolar kullanarak ip üzerinde akrobatik hareketler ve kombinasyonlar yapma sanatı.",
    descriptionEn: "The art of performing acrobatic tricks and combos on a string using modern ball-bearing yoyos.",
    difficulty: "medium",
    cost: "low",
    setupTimeTr: "5 Dakika",
    setupTimeEn: "5 Minutes",
    toolsTr: ["Rulmanlı Başlangıç Yo-Yo'su", "Yedek Yo-Yo İpleri"],
    toolsEn: ["Responsive or Unresponsive Ball-bearing Yoyo", "Spare Yoyo Strings"],
    stepsTr: [
      "Yo-Yo ipini parmağınıza nasıl doğru bağlayacağınızı öğrenin.",
      "Temel fırlatma (Sleeper) hareketini stabil hale getirin.",
      "Yotricks kanalındaki ilk 50 kolay hareketi sırayla çalışın.",
      "Unresponsive (geri dönmeyen) yoyolarla 'Bind' hareketini öğrenip ileri düzey numaralara geçin."
    ],
    stepsEn: [
      "Learn to correctly tie the string to your finger and yoyo.",
      "Master the basic throw and get a stable 'Sleeper'.",
      "Follow YoTricks' first 50 beginner trick list step-by-step.",
      "Learn the 'Bind' return trick on unresponsive yoyos to unlock advanced styles."
    ],
    resources: [
      { labelTr: "YoTricks - Başlangıç Seviyesi YoYo Dersleri", labelEn: "YoTricks - Beginner Yoyo Tutorials", url: "https://youtube.com/@yotricks?si=1TOMx7j_ZbrnUN_7" }
    ]
  },
  {
    id: "zentangle",
    titleTr: "Zentangle",
    titleEn: "Zentangle",
    categoryTr: "El Sanatları",
    categoryEn: "Creative Arts",
    descriptionTr: "Yapılandırılmış desenler çizerek zihni rahatlatmayı ve odaklanmayı amaçlayan, meditatif bir çizim yöntemi.",
    descriptionEn: "An easy-to-learn, relaxing, and fun way to create beautiful images by drawing structured patterns.",
    difficulty: "easy",
    cost: "low",
    setupTimeTr: "2 Dakika",
    setupTimeEn: "2 Minutes",
    toolsTr: ["Mürekkep Kalem (Fine liner)", "Kare Zentangle Kağıdı (Tile)", "Kurşun Kalem ve Dağıtıcı"],
    toolsEn: ["Fine Liner Ink Pen", "Square Zentangle Tile/Paper", "Graphite Pencil & Tortillon"],
    stepsTr: [
      "Kare kağıdın köşelerine 4 nokta koyup sınır çizgilerini kurşun kalemle çizin.",
      "Kağıdı bölümlere ayıran serbest çizgiler (String) çizin.",
      "Her bölümü farklı zentangle desenleriyle (Tangle) doldurun.",
      "Kurşun kalemle gölgelendirmeler yaparak çiziminize derinlik katın."
    ],
    stepsEn: [
      "Draw 4 light pencil dots at the corners of your tile and connect them with border lines.",
      "Draw a light pencil line (String) to divide the tile into sections.",
      "Fill each section with different structured patterns (Tangles).",
      "Add shading using a graphite pencil to give the artwork depth and dimension."
    ],
    resources: [
      { labelTr: "Zentangle Resmi Web Sitesi", labelEn: "Zentangle Official Website", url: "https://zentangle.com/" },
      { labelTr: "Yeni Başlayanlar İçin Zentangle Çizim Dersi", labelEn: "Zentangle Drawing Lesson for Beginners", url: "https://youtu.be/vWhQuIumEiE?si=vkf1CM9weYyH52tA" }
    ]
  },
  {
    id: "mandala",
    titleTr: "Mandala",
    titleEn: "Mandala Painting",
    categoryTr: "El Sanatları",
    categoryEn: "Creative Arts",
    descriptionTr: "Daire merkezli, geometrik veya çiçeksi desenlerin simetrik şekilde çizilip boyanmasıyla yapılan meditatif sanat.",
    descriptionEn: "A meditative art form created by drawing and painting symmetrical geometric patterns originating from a central point.",
    difficulty: "easy",
    cost: "low",
    setupTimeTr: "5 Dakika",
    setupTimeEn: "5 Minutes",
    toolsTr: ["Pergel ve Cetvel", "Çizim Kağıdı veya Mandala Boyama Defteri", "Renkli Kalemler veya Boya Seti"],
    toolsEn: ["Compass and Ruler", "Drawing Paper or Mandala Coloring Book", "Fineliners or Paint Markers"],
    stepsTr: [
      "Pergel kullanarak iç içe geçen yardımcı daireler çizin.",
      "Açıölçer veya cetvelle daireyi eşit açılı dilimlere bölün.",
      "Merkezden dışa doğru simetrik desenler eklemeye başlayın.",
      "İstediğiniz renk paletini seçerek mandala desenini boyayın."
    ],
    stepsEn: [
      "Draw concentric guidelines using a drafting compass.",
      "Divide the circles into equal pie slices using a protractor and ruler.",
      "Start drawing symmetrical patterns from the center outwards.",
      "Color your mandala using your favorite color palette."
    ],
    resources: [
      { labelTr: "The Mandala Project - Sanat ve Felsefe", labelEn: "The Mandala Project - Art & Philosophy", url: "https://www.mandalaproject.org/" }
    ]
  },
  {
    id: "bullet-journal",
    titleTr: "Bullet Journal (Planlama)",
    titleEn: "Bullet Journaling",
    categoryTr: "Yaşam Tarzı",
    categoryEn: "Lifestyle",
    descriptionTr: "Boş bir noktalı defter kullanarak kendi ajandanızı, yapılacaklar listenizi ve alışkanlık takipçinizi tasarlama yöntemi.",
    descriptionEn: "A mindful planning methodology using a blank dotted notebook to organize your tasks, events, and trackers.",
    difficulty: "easy",
    cost: "low",
    setupTimeTr: "10 Dakika",
    setupTimeEn: "10 Minutes",
    toolsTr: ["Noktalı Defter", "İnce Uçlu Kalem", "Cetvel"],
    toolsEn: ["Dotted Notebook", "Fine Liner Pen", "Ruler"],
    stepsTr: [
      "Defterinizin ilk sayfalarında bir Dizin (Index) ve Gelecek Planlayıcı (Future Log) oluşturun.",
      "Hızlı kayıt için sembollerinizi (Nokta: Görev, Çember: Etkinlik vb.) belirleyin.",
      "Aylık ve Haftalık sayfalar hazırlayarak hedeflerinizi listeleyin.",
      "Her gün ajandanızı güncelleyerek alışkanlıklarınızı ve ruh halinizi takip edin."
    ],
    stepsEn: [
      "Create an Index and a Future Log on the first pages of your notebook.",
      "Define your rapid logging symbols (Dot for task, Circle for event, etc.).",
      "Set up Monthly and Weekly spreads to list targets and events.",
      "Review and update your journal daily to track habits and mood."
    ],
    resources: [
      { labelTr: "Bullet Journal Resmi YouTube Kanalı", labelEn: "Bullet Journal Official YouTube Channel", url: "https://youtube.com/@bulletjournal?si=Wlkw450Qjj0qrRjT" }
    ]
  },
  {
    id: "card-illusion",
    titleTr: "Kart İllüzyonları",
    titleEn: "Card Illusions",
    categoryTr: "Performans ve Oyun",
    categoryEn: "Active & Performance",
    descriptionTr: "Standart iskambil desteleriyle el çabukluğu, dikkat dağıtma ve sunum teknikleri kullanarak şaşırtıcı sihirbazlık numaraları sergileme sanatı.",
    descriptionEn: "The art of performing astonishing magic tricks using standard playing cards, sleight of hand, misdirection, and storytelling.",
    difficulty: "medium",
    cost: "low",
    setupTimeTr: "5 Dakika",
    setupTimeEn: "5 Minutes",
    toolsTr: ["Bicycle Standart İskambil Destesi"],
    toolsEn: ["Standard Bicycle Playing Cards"],
    stepsTr: [
      "Temel kart tutuşlarını (Biddle Grip, Mechanics Grip) öğrenin.",
      "Double Lift (Çift Kart Kaldırma) tekniğinde ustalaşın.",
      "Seyircinin seçtiği kartı destenin üstünde veya altında kontrol etme yöntemlerini çalışın.",
      "Basit ama etkili başlangıç numaralarını ayna karşısında çalışarak sunumunuzu geliştirin."
    ],
    stepsEn: [
      "Learn essential card grips (Biddle Grip, Mechanics Grip).",
      "Master the Double Lift technique, which is the basis of many tricks.",
      "Learn to control a selected card to the top or bottom of the deck.",
      "Practice self-working or basic sleight tricks in front of a mirror to improve presentation."
    ],
    resources: [
      { labelTr: "İskambil Rehberi Uygulamamız", labelEn: "Our İskambil Guide App", url: "/apps/iskambil" }
    ]
  },
  {
    id: "cardistry",
    titleTr: "Cardistry",
    titleEn: "Cardistry",
    categoryTr: "Performans ve Oyun",
    categoryEn: "Active & Performance",
    descriptionTr: "Oyun kartlarını kullanarak yapılan, tamamen el becerisine ve estetiğe dayalı görsel kart manipülasyonu sanatı.",
    descriptionEn: "The performance art of manipulating playing cards in an aesthetically pleasing and visually stunning manner using pure dexterity.",
    difficulty: "hard",
    cost: "low",
    setupTimeTr: "5 Dakika",
    setupTimeEn: "5 Minutes",
    toolsTr: ["Kaliteli İskambil Destesi (Bicycle/Tally-Ho)"],
    toolsEn: ["High-quality Playing Cards (Bicycle/Tally-Ho)"],
    stepsTr: [
      "Temel kart ayırma (Charlier Cut, Revolution Cut) tekniklerini öğrenin.",
      "Kartları yayma (Giant Fan) ve şelale (Spring) yapma becerisini geliştirin.",
      "İki elli kart kesme hareketlerini (Sybil Cut gibi) çalışın.",
      "Hareketleri yavaşça ve akıcı şekilde birleştirerek kendi akışınızı oluşturun."
    ],
    stepsEn: [
      "Learn fundamental one-handed cuts (Charlier Cut, Revolution Cut).",
      "Practice the Spring and Giant Fan to get comfortable with card control.",
      "Study two-handed cuts like the classic Sybil Cut.",
      "Focus on fluidity and speed, combining cuts into a continuous flow."
    ],
    resources: [
      { labelTr: "Cardistry Başlangıç Kılavuzu", labelEn: "Cardistry Starter Tutorial", url: "https://youtube.com/results?search_query=cardistry+tutorial+for+beginners" }
    ]
  },
  {
    id: "sudoku",
    titleTr: "Sudoku",
    titleEn: "Sudoku Puzzles",
    categoryTr: "Zihin Oyunları",
    categoryEn: "Mind Games",
    descriptionTr: "9x9'luk bir ızgarada her satır, sütun ve 3x3'lük kutuda 1'den 9'a kadar rakamların birer kez yer almasını gerektiren mantık bulmacası.",
    descriptionEn: "A logic-based, combinatorial number-placement puzzle where you fill a 9x9 grid so that each column, row, and 3x3 section contains all digits from 1 to 9.",
    difficulty: "easy",
    cost: "low",
    setupTimeTr: "1 Dakika",
    setupTimeEn: "1 Minute",
    toolsTr: ["Sudoku Kitabı veya Mobil Uygulama", "Kurşun Kalem ve Silgi"],
    toolsEn: ["Sudoku Book or Mobile App", "Pencil and Eraser"],
    stepsTr: [
      "Tek ihtimal kalan hücreleri bulma (Sole Candidate) yöntemini öğrenin.",
      "Kutulardaki eksik sayıları satır/sütun kesişimlerine göre eleyin.",
      "İleri seviyeler için 'Not Alma' (Pencil marking) tekniğini kullanın.",
      "Zor bulmacalarda X-Wing, Swordfish gibi eleme tekniklerini öğrenin."
    ],
    stepsEn: [
      "Learn the scanning technique to find sole candidates.",
      "Cross-reference missing numbers with intersecting rows and columns.",
      "Use pencil marking (candidates) to handle medium and hard puzzles.",
      "Study advanced techniques like X-Wing or Swordfish for expert level puzzles."
    ],
    resources: [
      { labelTr: "Sudoku Çözüm Teknikleri Kılavuzu", labelEn: "Sudoku Solving Techniques Guide", url: "https://youtube.com/results?search_query=sudoku+techniques" }
    ]
  },
  {
    id: "just-dance",
    titleTr: "Just Dance",
    titleEn: "Just Dance",
    categoryTr: "Performans ve Oyun",
    categoryEn: "Active & Performance",
    descriptionTr: "Müzik eşliğinde ekrandaki dansçıların koreografilerini taklit ederek hem eğlenmeyi hem de spor yapmayı sağlayan dans oyunu.",
    descriptionEn: "A rhythm dance game where players mimic the on-screen dancer's choreography to popular songs.",
    difficulty: "easy",
    cost: "medium",
    setupTimeTr: "10 Dakika",
    setupTimeEn: "10 Minutes",
    toolsTr: ["Oyun Konsolu veya Bilgisayar", "Just Dance Oyunu", "Telefon veya Hareket Sensörü"],
    toolsEn: ["Gaming Console or PC/Smartphone", "Just Dance Game", "Motion Controller or Phone App"],
    stepsTr: [
      "Oyunu kurun ve kontrolcü olarak kullanacağınız telefonu/sensörü hazırlayın.",
      "Başlangıç için kolay seviyeli koreografiler (Örn: 'Classic' danslar) seçin.",
      "Ekrandaki ritim ikonlarını ve dansçının sağ elini takip ederek hareketleri uygulayın.",
      "Arkadaşlarınızla veya çevrimiçi modda yarışarak kondisyonunuzu geliştirin."
    ],
    stepsEn: [
      "Set up the game console, PC, or Just Dance Now web controller.",
      "Start with low-intensity, beginner-friendly songs.",
      "Focus on the gold pictograms and match the coach's movements.",
      "Dance regularly as a fun workout and compete in multiplayer modes."
    ],
    resources: [
      { labelTr: "Just Dance Resmi Web Sitesi", labelEn: "Just Dance Official Website", url: "https://www.ubisoft.com/en-us/game/just-dance" }
    ]
  },
  {
    id: "home-coffee",
    titleTr: "Evde Kahve Demleme (Barista)",
    titleEn: "Home Brewing & Coffee Crafting",
    categoryTr: "Yaşam Tarzı",
    categoryEn: "Lifestyle",
    descriptionTr: "Farklı kahve çekirdeklerini, V60, Chemex veya Aeropress gibi ekipmanlarla doğru ısı ve oranlarla demleme sanatı.",
    descriptionEn: "The craft of brewing specialty coffee beans using manual methods like V60, French Press, or Aeropress with precise ratios.",
    difficulty: "medium",
    cost: "medium",
    setupTimeTr: "10 Dakika",
    setupTimeEn: "10 Minutes",
    toolsTr: ["V60 Damlatıcı veya Aeropress", "Hassas Mutfak Terazisi", "Kahve Öğütücü", "Taze Kahve Çekirdekleri"],
    toolsEn: ["V60 Dripper or Aeropress", "Digital Kitchen Scale", "Manual Grinder", "Fresh Specialty Coffee Beans"],
    stepsTr: [
      "Taze kahve çekirdekleri edinin ve demleme yönteminize uygun boyutta öğütün.",
      "Demleme suyu sıcaklığını 90-95 derece arasında ayarlayın.",
      "Standart altın demleme oranını (1 gram kahveye 16 gram su) uygulayın.",
      "Kahveyi dairesel hareketlerle yavaşça ıslatarak ön demleme (blooming) yapın."
    ],
    stepsEn: [
      "Acquire fresh specialty beans and grind them to the correct size for your dripper.",
      "Heat your water to the optimal temperature of 90-95°C.",
      "Use the golden ratio of 1:16 (e.g., 15g coffee to 240g water).",
      "Pour water slowly in circular motions, starting with a 30-second bloom."
    ],
    resources: [
      { labelTr: "Kahve Demleme Teknikleri Eğitimleri", labelEn: "Coffee Brewing Techniques Video Guide", url: "https://youtube.com/results?search_query=how+to+brew+pour+over+coffee" }
    ]
  },
  {
    id: "geocacher",
    titleTr: "GeoCaching (Define Avı)",
    titleEn: "Geocaching",
    categoryTr: "Performans ve Oyun",
    categoryEn: "Active & Performance",
    descriptionTr: "GPS yardımıyla tüm dünyada gizlenmiş kutuları (cache) bulmaya çalıştığınız açık hava define avı oyunu.",
    descriptionEn: "A real-world, outdoor treasure hunting game using GPS-enabled devices to find hidden containers called geocaches.",
    difficulty: "easy",
    cost: "low",
    setupTimeTr: "10 Dakika",
    setupTimeEn: "10 Minutes",
    toolsTr: ["Akıllı Telefon (Geocaching Uygulaması)", "Tükenmez Kalem"],
    toolsEn: ["Smartphone with Geocaching App", "Pen to sign the logbook"],
    stepsTr: [
      "Resmi Geocaching uygulamasını telefonunuza indirin ve üye olun.",
      "Haritada yakınınızdaki yeşil ikonlu, kolay seviyeli bir kutu seçin.",
      "Kutunun konumuna gidip ipuçlarını ve koordinatları takip ederek arama yapın.",
      "Kutuyu bulduğunuzda içindeki defteri (Logbook) imzalayın ve kutuyu aynen yerine bırakın."
    ],
    stepsEn: [
      "Download the official Geocaching app and create a free account.",
      "Locate a low-difficulty cache near you on the map.",
      "Navigate to the coordinates and look for a hidden container.",
      "Sign the physical logbook, log your find in the app, and replace the cache as you found it."
    ],
    resources: [
      { labelTr: "Geocaching Resmi Başlangıç Kılavuzu", labelEn: "Geocaching Official Beginner Guide", url: "https://www.geocaching.com/" }
    ]
  },
  {
    id: "headshot-woodbots",
    titleTr: "Headshot WoodBots",
    titleEn: "Headshot WoodBots Craft",
    categoryTr: "El Sanatları",
    categoryEn: "Creative Arts",
    descriptionTr: "Ahşap mandallar, çöp şişler ve iplerle mini savaşçı robotlar (WoodBots) tasarlayıp onları yarıştırma hobisi.",
    descriptionEn: "Designing and crafting miniature battle robots (WoodBots) using wooden clothespins, skewers, and strings.",
    difficulty: "medium",
    cost: "low",
    setupTimeTr: "1 Saat",
    setupTimeEn: "1 Hour",
    toolsTr: ["Ahşap Mandallar", "Silikon Tabancası", "İp ve Makas", "Zımpara"],
    toolsEn: ["Wooden Clothespins", "Hot Glue Gun", "Threads & Scissors", "Sandpaper"],
    stepsTr: [
      "Mandalları sökerek gövde, kollar ve bacaklar için iskelet hazırlayın.",
      "Silikon tabancasıyla mafsalları esnek olacak şekilde birleştirin.",
      "Karakterinize kalkan, kılıç veya özel zırhlar ekleyerek özelleştirin.",
      "Hazırladığınız WoodBot'u iplerle kontrol ederek arkadaşlarınızla arenada kapıştırın."
    ],
    stepsEn: [
      "Disassemble wooden pegs and design the skeletal structure.",
      "Assemble joints using hot glue while keeping movement areas flexible.",
      "Add custom armor, weapons (using skewers), or shields.",
      "Control your WoodBot using strings and compete in tabletop arenas."
    ],
    resources: [
      { labelTr: "Mandallardan Robot Yapımı Eğitimi", labelEn: "Peg Robots Crafting Tutorial", url: "https://youtube.com/results?search_query=clothespin+robot+craft" }
    ]
  },
  {
    id: "dnd",
    titleTr: "Dungeons & Dragons (D&D)",
    titleEn: "Dungeons & Dragons (D&D)",
    categoryTr: "Zihin Oyunları",
    categoryEn: "Mind Games",
    descriptionTr: "Oyuncuların kendi fantastik karakterlerini oluşturup bir zindan efendisinin (DM) anlattığı hikayede maceralara atıldığı rol yapma oyunu.",
    descriptionEn: "A cooperative tabletop roleplaying game where players create heroic characters and embark on fantasy adventures narrated by a Dungeon Master.",
    difficulty: "medium",
    cost: "medium",
    setupTimeTr: "1 Saat",
    setupTimeEn: "1 Hour",
    toolsTr: ["7'li Polihidral Zar Seti (d20, d12...)", "Karakter Kağıdı (Character Sheet)", "Oyuncu El Kitabı (Player's Handbook)"],
    toolsEn: ["Polyhedral Dice Set (d20, d12, etc.)", "Character Sheets", "D&D Basic Rules or Player's Handbook"],
    stepsTr: [
      "D&D temel kurallarını (ücretsiz D&D Beyond başlangıç kuralları) okuyun.",
      "Kendinize bir ırk (Elfe, Cüce vb.) ve sınıf (Savaşçı, Büyücü vb.) seçerek karakter yaratın.",
      "Bir 'Dungeon Master' ve arkadaş grubu bularak ilk tek seferlik (One-shot) oyununuzu oynayın.",
      "Zarların (özellikle 20 yüzlü zarın) olayların başarısını nasıl etkilediğini öğrenin."
    ],
    stepsEn: [
      "Read the basic rules (available for free on D&D Beyond).",
      "Choose a race (Elf, Dwarf, etc.) and class (Fighter, Wizard) to create your character sheet.",
      "Find a group and a Dungeon Master (DM) for a beginner-friendly adventure.",
      "Learn how rolls (especially the 20-sided die) determine the success of actions."
    ],
    resources: [
      { labelTr: "D&D Beyond - Resmi Başlangıç Kuralları", labelEn: "D&D Beyond - Official Basic Rules", url: "https://www.dndbeyond.com/" }
    ]
  },
  {
    id: "stamp-edge-punch",
    titleTr: "Stamp Edge Punch",
    titleEn: "Stamp Edge Punch",
    categoryTr: "El Sanatları",
    categoryEn: "Creative Arts",
    descriptionTr: "Özel şekilli delgeçler ve baskı damgaları kullanarak kağıt kenarlarını süsleme ve defter tasarımı (Scrapbooking) hobisi.",
    descriptionEn: "Decorating card edges, scrapbooks, and stationery using specialty border punches and customized ink stamps.",
    difficulty: "easy",
    cost: "low",
    setupTimeTr: "5 Dakika",
    setupTimeEn: "5 Minutes",
    toolsTr: ["Kenar Şekillendirici Delgeç (Border Punch)", "Dekoratif Damgalar ve Mürekkep Pedi", "Tasarım Kağıtları"],
    toolsEn: ["Border Punch", "Decorative Stamps & Ink Pad", "Craft Paper"],
    stepsTr: [
      "Kağıdı delgecin kılavuz çizgilerine hizalayarak yerleştirin.",
      "Sırayla delerek kağıt boyunca kesintisiz bir dantel/desen kenarı oluşturun.",
      "Damgayı mürekkep pedine bastırıp kağıdın ortasına veya kenarlarına basın.",
      "Bu yöntemle kişisel tebrik kartları, kitap ayraçları veya Bullet Journal sayfaları süsleyin."
    ],
    stepsEn: [
      "Align the paper with the guide markings on the border punch tool.",
      "Punch continuously along the paper edge to create a seamless pattern.",
      "Press the stamp onto the ink pad and transfer the design to your page.",
      "Create customized gift cards, bookmarks, or decorate journal entries."
    ],
    resources: [
      { labelTr: "Defter Süsleme ve Delgeç Kullanımı Fikirleri", labelEn: "Scrapbooking & Border Punching Ideas", url: "https://youtube.com/results?search_query=border+punch+scrapbook" }
    ]
  },
  {
    id: "ice-skating",
    titleTr: "Buz Pateni",
    titleEn: "Ice Skating",
    categoryTr: "Performans ve Oyun",
    categoryEn: "Active & Performance",
    descriptionTr: "Özel patenlerle buz pisti üzerinde dengede durma, kayma ve çeşitli sanatsal/sportif figürler yapma sporu.",
    descriptionEn: "The sport and recreation of gliding across ice rinks using ice skates.",
    difficulty: "medium",
    cost: "medium",
    setupTimeTr: "30 Dakika",
    setupTimeEn: "30 Minutes",
    toolsTr: ["Buz Pateni (Pistten kiralanabilir)", "Kask ve Koruyucu Ekipmanlar", "Kalın Çoraplar"],
    toolsEn: ["Ice Skates", "Helmet & Safety Pads", "Warm Thick Socks"],
    stepsTr: [
      "Patenlerinizi ayağınızı sıkıca saracak ama acıtmayacak şekilde bağlayın.",
      "Buz üzerinde ilk olarak bariyerlere tutunarak dengede durma çalışması yapın.",
      "Ağırlığınızı hafifçe öne verip dizlerinizi bükerek küçük adımlarla kaymaya başlayın.",
      "Limon dilimi (c-cut) ve T-duruşu fren yapma tekniklerini öğrenin."
    ],
    stepsEn: [
      "Lace your skates tightly to support your ankles properly.",
      "Step onto the ice and practice balancing while holding the barrier.",
      "Bend your knees, lean slightly forward, and take small steps to glide.",
      "Master stopping techniques like the T-stop or snowplow stop."
    ],
    resources: [
      { labelTr: "Buz Pateni Temel Denge ve Kayma Eğitimi", labelEn: "Ice Skating Basics Guide", url: "https://youtube.com/results?search_query=how+to+ice+skate+for+beginners" }
    ]
  },
  {
    id: "camping",
    titleTr: "Kampçılık",
    titleEn: "Camping",
    categoryTr: "Performans ve Oyun",
    categoryEn: "Active & Performance",
    descriptionTr: "Doğayla iç içe olmak amacıyla çadır, uyku tulumu ve kamp ekipmanlarıyla açık havada konaklama etkinliği.",
    descriptionEn: "An outdoor recreational activity involving overnight stays away from home in a tent or shelter in nature.",
    difficulty: "medium",
    cost: "high",
    setupTimeTr: "1 Gün (Hazırlık)",
    setupTimeEn: "1 Day (Preparation)",
    toolsTr: ["Kamp Çadırı", "Uyku Tulumu ve Mat", "Kamp Ocağı", "Kafa Lambası"],
    toolsEn: ["Camping Tent", "Sleeping Bag & Mat", "Portable Stove", "Headlamp"],
    stepsTr: [
      "Hava durumunu kontrol ederek gideceğiniz bölgeye uygun malzeme listesi hazırlayın.",
      "Çadırınızı rüzgar almayan ve düz bir zemine kurmayı öğrenin.",
      "Ateş yakma ve güvenli şekilde söndürme kurallarını çalışın.",
      "Doğada atık bırakmama (Leave No Trace) felsefesini benimseyin."
    ],
    stepsEn: [
      "Check the weather forecast and pack gear suitable for the climate.",
      "Find flat ground away from water hazards and pitch your tent properly.",
      "Learn campfire safety rules and how to extinguish fires completely.",
      "Follow 'Leave No Trace' guidelines to preserve nature."
    ],
    resources: [
      { labelTr: "Yeni Başlayanlar İçin Kampçılık Kılavuzu", labelEn: "Camping Starter Guide Video", url: "https://youtube.com/results?search_query=beginner+camping+tips" }
    ]
  },
  {
    id: "board-games",
    titleTr: "Kutu Oyunları (Board Games)",
    titleEn: "Board Games",
    categoryTr: "Zihin Oyunları",
    categoryEn: "Mind Games",
    descriptionTr: "Monopoly gibi şans oyunlarının ötesinde, Catan, Carcassonne gibi strateji, diplomasi ve kaynak yönetimi içeren modern masaüstü oyunları.",
    descriptionEn: "Modern tabletop games involving strategy, resource management, and diplomacy, expanding far beyond standard family games.",
    difficulty: "easy",
    cost: "medium",
    setupTimeTr: "15 Dakika",
    setupTimeEn: "15 Minutes",
    toolsTr: ["Bir Kutu Oyunu (Örn: Carcassonne, Ticket to Ride)"],
    toolsEn: ["A Board Game (e.g. Carcassonne or Ticket to Ride)"],
    stepsTr: [
      "Grup boyutuna uygun, başlangıç seviyesi bir oyun seçin.",
      "Oyun kılavuzunu okumak yerine YouTube'dan 'Nasıl Oynanır' videosu izleyin.",
      "İlk oyunu öğrenme turu olarak oynayıp kuralları pekiştirin.",
      "BoardGameGeek (BGG) sitesini kullanarak yeni oyunlar ve stratejiler keşfedin."
    ],
    stepsEn: [
      "Select a gateway board game suitable for your player group size.",
      "Watch a quick 'How to Play' video on YouTube instead of struggling with rules.",
      "Play a dummy round first to understand the flow of the game.",
      "Explore new games and global ratings on BoardGameGeek."
    ],
    resources: [
      { labelTr: "BoardGameGeek - Küresel Kutu Oyunu Veritabanı", labelEn: "BoardGameGeek - Global Board Game Database", url: "https://boardgamegeek.com/" },
      { labelTr: "Catan Bot Yardımcımız", labelEn: "Our Catan Bot Helper App", url: "/apps/catan-bot" }
    ]
  },
  {
    id: "traveling",
    titleTr: "Seyahat ve Keşif",
    titleEn: "Traveling & Exploring",
    categoryTr: "Yaşam Tarzı",
    categoryEn: "Lifestyle",
    descriptionTr: "Yeni kültürler tanımak, tarihi ve doğal güzellikleri yerinde görmek amacıyla planlı veya plansız geziler yapma hobisi.",
    descriptionEn: "The hobby of visiting new places, cities, and countries to experience different cultures, cuisines, and landscapes.",
    difficulty: "medium",
    cost: "high",
    setupTimeTr: "1 Hafta (Planlama)",
    setupTimeEn: "1 Week (Planning)",
    toolsTr: ["Sırt Çantası", "Harita ve Seyahat Uygulamaları", "Pasaport / Vize (Gerekliyse)"],
    toolsEn: ["Backpack", "Offline Maps & Booking Apps", "Passport / Visa"],
    stepsTr: [
      "Bütçenize uygun bir şehir veya rota belirleyin.",
      "Ucuz uçak bileti/konaklama aramaları yapıp rezervasyonları tamamlayın.",
      "Gezilecek yerler listesi çıkarıp yerel kültür ve lezzetleri araştırın.",
      "Yerel halkla etkileşime girip turistik yerlerin dışındaki saklı mekanları keşfedin."
    ],
    stepsEn: [
      "Select a destination based on your budget and interest.",
      "Search for budget flights and accommodation options, then book ahead.",
      "Create a flexible itinerary of historical, natural, and culinary spots.",
      "Talk to locals to discover hidden gems outside tourist traps."
    ],
    resources: [
      { labelTr: "Harita Takip Uygulamamız", labelEn: "Our Map Tracker App", url: "/apps/map-tracker" }
    ]
  },
  {
    id: "knitting",
    titleTr: "Örgü Örmek",
    titleEn: "Knitting",
    categoryTr: "El Sanatları",
    categoryEn: "Creative Arts",
    descriptionTr: "İki şiş ve iplik kullanarak atkı, bere, hırka gibi giysileri ilmek ilmek dokuma sanatı.",
    descriptionEn: "The craft of looping yarn with knitting needles to create items of clothing, blankets, and accessories.",
    difficulty: "medium",
    cost: "low",
    setupTimeTr: "10 Dakika",
    setupTimeEn: "10 Minutes",
    toolsTr: ["Örgü Şişleri", "Yün İplik", "Makas"],
    toolsEn: ["Knitting Needles", "Yarn Skeins", "Scissors"],
    stepsTr: [
      "Şişe ilmek atmayı (Casting on) öğrenin.",
      "Temel düz örgü (Knit stitch) ve ters örgü (Purl stitch) hareketlerini çalışın.",
      "İlk projeniz olarak basit bir atkı veya bardak altlığı örmeye başlayın.",
      "Bitirme (Casting off) tekniğini öğrenerek örgünüzü tamamlayın."
    ],
    stepsEn: [
      "Learn how to cast on stitches onto your needle.",
      "Master the basic knit stitch and purl stitch.",
      "Start with a simple project like a basic scarf or coaster.",
      "Learn to bind off (cast off) to secure your finished work."
    ],
    resources: [
      { labelTr: "Örgü Örmeye Başlangıç Dersi", labelEn: "Knitting for Beginners Video Tutorial", url: "https://youtube.com/results?search_query=how+to+knit+for+beginners" }
    ]
  },
  {
    id: "dj",
    titleTr: "DJ'lik (Müzik Miksleme)",
    titleEn: "DJing / Music Mixing",
    categoryTr: "Performans ve Oyun",
    categoryEn: "Active & Performance",
    descriptionTr: "Şarkılar arasında yumuşak geçişler (transition), tempo eşitleme (beatmatching) ve ses efektleri kullanarak müzik miksleme sanatı.",
    descriptionEn: "The art of mixing tracks, beatmatching tempos, and using audio effects to create continuous music flows.",
    difficulty: "hard",
    cost: "high",
    setupTimeTr: "1 Gün (Kurulum)",
    setupTimeEn: "1 Day (Setup)",
    toolsTr: ["DJ Controller veya DJ Programı (VirtualDJ/Rekordbox)", "Kulaklık", "Müzik Kütüphanesi"],
    toolsEn: ["DJ Controller or DJ Software (VirtualDJ/Rekordbox)", "Monitoring Headphones", "Music Library"],
    stepsTr: [
      "Bilgisayarınıza VirtualDJ gibi ücretsiz bir program indirip arayüzü tanıyın.",
      "Şarkıların tempo (BPM) ve anahtarlarını (Key) eşitleyerek geçiş yapmayı çalışın.",
      "Fader ve EQ (bas, tiz, mid) ayarlarıyla şarkıları pürüzsüzce birleştirin.",
      "Kendi 30 dakikalık geçiş setinizi hazırlayıp kaydedin."
    ],
    stepsEn: [
      "Download a free DJ software like VirtualDJ or Rekordbox on your PC.",
      "Understand the concepts of BPM (tempo) and Key matching.",
      "Practice transitions using EQs (High, Mid, Low) and channel faders.",
      "Record your first 30-minute mix and listen for adjustments."
    ],
    resources: [
      { labelTr: "DJ'lik Temel Teknikleri Dersi", labelEn: "DJing Basics and Mix Tutorial", url: "https://youtube.com/results?search_query=djing+for+beginners+tutorial" }
    ]
  }
];
