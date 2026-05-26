export interface CuratedSuggestion {
  id: string;
  category: "game" | "chocolate" | "movie" | "activity";
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  link?: string;
  linkLabelTr?: string;
  linkLabelEn?: string;
  imageUrl?: string;
}

export const CURATED_SUGGESTIONS: CuratedSuggestion[] = [
  // === CATEGORY: OFFLINE ACTIVITIES (Aktiviteler) ===
  {
    id: "act-1",
    category: "activity",
    titleTr: "Açık Havada Yürüyüş",
    titleEn: "Brisk Outdoor Walk",
    descTr: "Telefonunu evde veya cebinde sessizde bırakarak en az 15 dakika dışarıda tempolu bir yürüyüş yap. Çevrendeki sesleri dinle.",
    descEn: "Leave your phone at home or on silent in your pocket and take a brisk 15-minute walk. Listen to the sounds around you."
  },
  {
    id: "act-2",
    category: "activity",
    titleTr: "Kitap Okuma Saati",
    titleEn: "Read a Book",
    descTr: "Bir süredir rafta bekleyen bir kitaptan en az 10 sayfa oku. Dikkat dağıtıcı her şeyi uzaklaştır.",
    descEn: "Read at least 10 pages of a book that's been waiting on your shelf. Put away all distractions."
  },
  {
    id: "act-3",
    category: "activity",
    titleTr: "Eski Bir Dostu Ara",
    titleEn: "Call an Old Friend",
    descTr: "Mesaj atmak yerine, uzun zamandır konuşmadığın bir arkadaşını doğrudan telefonla ara ve sesini duy.",
    descEn: "Instead of texting, call a friend you haven't spoken to in a long time and hear their voice."
  },
  {
    id: "act-4",
    category: "activity",
    titleTr: "Çalışma Masanı Düzenle",
    titleEn: "Organize Your Desk",
    descTr: "Masandaki gereksiz kağıtları, bardakları ve kabloları düzenle. Temiz bir alan zihnini de netleştirir.",
    descEn: "Clear out old papers, cups, and cords from your workspace. A clean space helps clear your mind."
  },
  {
    id: "act-5",
    category: "activity",
    titleTr: "Aktif Dinleme",
    titleEn: "Active Listening",
    descTr: "En sevdiğin albümü veya şarkıyı aç. Gözlerini kapat ve başka hiçbir işle uğraşmadan sadece müziğin ritmine odaklan.",
    descEn: "Put on your favorite album or song. Close your eyes and just listen to the music without doing anything else."
  },
  {
    id: "act-6",
    category: "activity",
    titleTr: "Nefes Egzersizi",
    titleEn: "Breathing Exercise",
    descTr: "5 dakika boyunca 4 saniyede nefes al, 4 saniye tut, 4 saniyede ver ve 4 saniye bekle (Kutu Nefesi).",
    descEn: "Spend 5 minutes doing box breathing: inhale for 4s, hold for 4s, exhale for 4s, hold for 4s."
  },
  {
    id: "act-7",
    category: "activity",
    titleTr: "Yeni Bir İçecek Tarifi",
    titleEn: "Try a New Drink Recipe",
    descTr: "Evdeki malzemelerle limonata, özel bir bitki çayı veya soğuk kahve tarifi geliştirip tadını çıkar.",
    descEn: "Mix up a homemade lemonade, a special herbal tea, or a new cold brew recipe using what you have."
  },
  {
    id: "act-8",
    category: "activity",
    titleTr: "Esneme Hareketleri",
    titleEn: "Full Body Stretching",
    descTr: "Oturmaktan kaskatı kesilen vücudunu rahatlatmak için 10 dakikalık temel esneme ve yoga hareketleri yap.",
    descEn: "Spend 10 minutes doing basic full-body stretches or yoga poses to loosen up from sitting."
  },
  {
    id: "act-9",
    category: "activity",
    titleTr: "Eşyalarını Azalt",
    titleEn: "Declutter 5 Items",
    descTr: "Gardırobundan veya çekmecelerinden artık kullanmadığın 5 parça eşyayı/kıyafeti seçip ayır.",
    descEn: "Find 5 items or clothes in your drawers that you no longer use and set them aside to donate or recycle."
  },
  {
    id: "act-10",
    category: "activity",
    titleTr: "Karalama / Çizim Yap",
    titleEn: "Doodle on Paper",
    descTr: "Bir kağıt ve kalem al, tamamen rastgele şekiller çiz ya da aklından geçenleri özgürce karala.",
    descEn: "Grab a pen and paper, and just doodle random shapes or sketch whatever comes to your mind."
  },
  {
    id: "act-11",
    category: "activity",
    titleTr: "Bir Şeyler Yaz",
    titleEn: "Journaling",
    descTr: "Bugün nasıl hissettiğini, seni neyin yorduğunu ya da mutlu ettiğini anlatan kısa bir günlük yazısı yaz.",
    descEn: "Write down a few paragraphs about how you feel today, what's on your mind, or what you're grateful for."
  },
  {
    id: "act-12",
    category: "activity",
    titleTr: "Su İçme Rutini",
    titleEn: "Hydrate Mindfully",
    descTr: "Büyük bir bardak su doldur. Acele etmeden, suyun ferahlığını hissederek yudum yudum iç.",
    descEn: "Pour yourself a large glass of water. Drink it slowly, focusing on the sensation and staying present."
  },
  {
    id: "act-13",
    category: "activity",
    titleTr: "Bitki Bakımı",
    titleEn: "Tend to Your Plants",
    descTr: "Eğer evde çiçeğin varsa yapraklarını temizle, toprağını kontrol et ve ihtiyacı varsa su ver.",
    descEn: "If you have houseplants, clean their leaves, check their soil, and give them some water if needed."
  },
  {
    id: "act-14",
    category: "activity",
    titleTr: "Soğuk Duş Deneyimi",
    titleEn: "Quick Cold Shower",
    descTr: "Dopamin seviyeni doğal yoldan artırmak ve zihnini hemen uyandırmak için 2 dakikalık soğuk bir duş al.",
    descEn: "Take a quick 2-minute cold shower to naturally boost dopamine and instantly refresh your mind."
  },
  {
    id: "act-15",
    category: "activity",
    titleTr: "El Yazısıyla Not Bırak",
    titleEn: "Write a Handwritten Note",
    descTr: "Birlikte yaşadığın birine veya bir arkadaşına küçük bir teşekkür ya da sevgi notu yazıp masasına bırak.",
    descEn: "Write a short note of gratitude or love to someone you live with or a friend, and leave it where they'll find it."
  },
  {
    id: "act-16",
    category: "activity",
    titleTr: "Enstrüman Çal / Ritme Odaklan",
    titleEn: "Play an Instrument",
    descTr: "Eğer evde bir enstrümanın varsa 15 dakika boyunca pratik yap veya sadece ritim tut.",
    descEn: "If you have an instrument, practice it for 15 minutes or just play with basic chords/beats."
  },
  {
    id: "act-17",
    category: "activity",
    titleTr: "Gökyüzünü İzle",
    titleEn: "Cloud Watching / Stargazing",
    descTr: "Pencere kenarına veya balkona çıkıp birkaç dakika bulutların hareketini ya da gece ise yıldızları izle.",
    descEn: "Step out onto a balcony or by a window and spend a few minutes watching clouds drift or stargazing."
  },
  {
    id: "act-18",
    category: "activity",
    titleTr: "Müze Gezisi planla",
    titleEn: "Plan a Museum Visit",
    descTr: "Yaşadığın şehirdeki tarihi veya sanatsal bir müzeyi bu hafta sonu ziyaret etmek üzere planına ekle.",
    descEn: "Look up a local museum or art gallery and plan a trip to visit it this upcoming weekend."
  },
  {
    id: "act-19",
    category: "activity",
    titleTr: "Fotoğraf Çekimi",
    titleEn: "Find 3 Beautiful Things",
    descTr: "Evde veya sokakta estetik görünen 3 farklı detayın fotoğrafını çekmeye çalış.",
    descEn: "Look around your room or step outside and take photos of 3 visually interesting details."
  },
  {
    id: "act-20",
    category: "activity",
    titleTr: "Postür Kontrolü",
    titleEn: "Fix Your Posture",
    descTr: "Omuzlarını geriye at, sırtını dikleştir, çeneni hafifçe kaldır ve derin bir nefes al.",
    descEn: "Roll your shoulders back, straighten your spine, lift your chin slightly, and take a deep breath."
  },
  {
    id: "act-21",
    category: "activity",
    titleTr: "Bilinçli Yemek",
    titleEn: "Eat Mindfully",
    descTr: "Bir sonraki öğününde televizyonu veya telefonu tamamen kapat. Sadece yemeğin tadına ve kokusuna odaklan.",
    descEn: "During your next snack or meal, turn off the TV and phone. Eat slowly, savoring the textures and flavors."
  },
  {
    id: "act-22",
    category: "activity",
    titleTr: "Geleceğe Mektup",
    titleEn: "Letter to Your Future Self",
    descTr: "Kendine 1 yıl sonra açıp okumak üzere beklentilerini ve şu anki hislerini anlatan kısa bir mektup yaz.",
    descEn: "Write a short letter to yourself to open in exactly one year, detailing your current hopes and thoughts."
  },
  {
    id: "act-23",
    category: "activity",
    titleTr: "Dolap Temizliği",
    titleEn: "Clean One Drawer",
    descTr: "Tüm odayı değil, sadece tek bir çekmeceyi boşalt, sil ve her şeyi nizami şekilde geri yerleştir.",
    descEn: "Don't clean the whole room—just empty out one drawer, wipe it down, and organize it perfectly."
  },
  {
    id: "act-24",
    category: "activity",
    titleTr: "Dijital Detoks Saati",
    titleEn: "One Hour Screen-Free",
    descTr: "Önümüzdeki 1 saat boyunca tüm ekranları kapat. Kitap oku, temizlik yap ya da sadece dinlen.",
    descEn: "For the next hour, commit to no screens. Read a book, clean up, or simply daydream."
  },
  {
    id: "act-25",
    category: "activity",
    titleTr: "Şükran Listesi",
    titleEn: "Write 3 Things You're Grateful For",
    descTr: "Hayatında gerçekten minnettar olduğun 3 küçük şeyi belirle ve bir kağıda yaz.",
    descEn: "Reflect on your life and write down 3 specific things you are genuinely grateful for today."
  },

  // === CATEGORY: CARD GAMES (İskambil Oyunları) ===
  {
    id: "game-1",
    category: "game",
    titleTr: "Pis Yedili",
    titleEn: "Crazy Eights",
    descTr: "Deste biterken heyecanın doruğa ulaştığı, taktiksel ve oldukça eğlenceli klasik kart oyunu.",
    descEn: "A classic shedding card game of tactics and matching suits where eights are wild.",
    link: "/apps/iskambil",
    linkLabelTr: "Oynanış Kurallarına Bak",
    linkLabelEn: "View Gameplay Rules"
  },
  {
    id: "game-2",
    category: "game",
    titleTr: "Başkan / Göt",
    titleEn: "President / Asshole",
    descTr: "Sosyal hiyerarşi ve hızlı kart bitirme temalı, kalabalık arkadaş gruplarıyla mükemmel giden eğlenceli bir oyun.",
    descEn: "A fun climbing game of social hierarchy and shedding cards that gets better with friends.",
    link: "/apps/iskambil",
    linkLabelTr: "Oynanış Kurallarına Bak",
    linkLabelEn: "View Gameplay Rules"
  },
  {
    id: "game-3",
    category: "game",
    titleTr: "Hımbıl / Eşek",
    titleEn: "Spoons / Donkey",
    descTr: "Dörtlü kart setini tamamlayıp elini masaya ilk koyan olmak için yarışacağın yüksek refleks oyunu.",
    descEn: "A fast-paced reflex game where you race to collect four of a kind and touch the table first.",
    link: "/apps/iskambil",
    linkLabelTr: "Oynanış Kurallarına Bak",
    linkLabelEn: "View Gameplay Rules"
  },
  {
    id: "game-4",
    category: "game",
    titleTr: "Blöf",
    titleEn: "Cheat / I Doubt It",
    descTr: "Kartları kapalı atarak elindekileri erittiğin, kimin yalan söylediğini bulmaya çalıştığın psikolojik oyun.",
    descEn: "A psychological game of deception and calling out liars while discarding cards face down.",
    link: "/apps/iskambil",
    linkLabelTr: "Oynanış Kurallarına Bak",
    linkLabelEn: "View Gameplay Rules"
  },
  {
    id: "game-5",
    category: "game",
    titleTr: "Batak (İhaleli)",
    titleEn: "Batak (Turkish Spades)",
    descTr: "Türkiye'nin en popüler kahvehane ve öğrenci oyunu. Kozu belirle ve alabileceğin el sayısını tahmin et.",
    descEn: "The most popular card game in Turkey. Call your bids, set the trump, and take your tricks.",
    link: "/apps/iskambil",
    linkLabelTr: "Oynanış Kurallarına Bak",
    linkLabelEn: "View Gameplay Rules"
  },
  {
    id: "game-6",
    category: "game",
    titleTr: "Papaz Kaçtı",
    titleEn: "Old Maid",
    descTr: "Eşleşen kartları atıp elinde en son kalan uğursuz Papaz'dan kurtulmaya çalıştığın neşeli bir klasik.",
    descEn: "A lighthearted classic card game where you try to pair up cards and avoid being left with the Old Maid.",
    link: "/apps/iskambil",
    linkLabelTr: "Oynanış Kurallarına Bak",
    linkLabelEn: "View Gameplay Rules"
  },
  {
    id: "game-7",
    category: "game",
    titleTr: "Dost Kazığı",
    titleEn: "Dost Kazığı",
    descTr: "Yerdeki kartları toplayıp rakiplerine 'kazık atmaya' çalıştığın, bol kahkahalı ve çekişmeli bir yerel oyun.",
    descEn: "A competitive local card game where you build card piles and try to block your opponents.",
    link: "/apps/iskambil",
    linkLabelTr: "Oynanış Kurallarına Bak",
    linkLabelEn: "View Gameplay Rules"
  },
  {
    id: "game-8",
    category: "game",
    titleTr: "Bezirgan",
    titleEn: "Bezirgan",
    descTr: "Kart takasları ve eşleşen seriler üzerinden oynanan, dikkat ve takip gerektiren geleneksel bir iskambil oyunu.",
    descEn: "A traditional card game focused on card trading and building matching sequences.",
    link: "/apps/iskambil",
    linkLabelTr: "Oynanış Kurallarına Bak",
    linkLabelEn: "View Gameplay Rules"
  },
  {
    id: "game-9",
    category: "game",
    titleTr: "Blackjack",
    titleEn: "Blackjack (21)",
    descTr: "Şans ve stratejiyi birleştirerek kart toplamını 21'e ulaştırmaya veya krupiyeyi geçmeye çalıştığın ünlü oyun.",
    descEn: "The famous game of chance and strategy where you try to get card values closest to 21 without going over.",
    link: "/apps/iskambil",
    linkLabelTr: "Oynanış Kurallarına Bak",
    linkLabelEn: "View Gameplay Rules"
  },
  {
    id: "game-10",
    category: "game",
    titleTr: "Maça Kızı",
    titleEn: "Hearts",
    descTr: "Puan cezası getiren kupaları ve özellikle de uğursuz Maça Kızı'nı rakiplerine kakalamaya çalıştığın eğlenceli oyun.",
    descEn: "An engaging trick-taking game where you try to avoid taking hearts and the dreaded Queen of Spades.",
    link: "/apps/iskambil",
    linkLabelTr: "Oynanış Kurallarına Bak",
    linkLabelEn: "View Gameplay Rules"
  },

  // === CATEGORY: CHOCOLATES (Çikolatalar) ===
  {
    id: "choc-1",
    category: "chocolate",
    titleTr: "Eti Karam Gurme Bitter Çikolatalı",
    titleEn: "Eti Karam Gurme Bitter",
    descTr: "Bitter çikolata kreması ve çıtır gofret yapraklarının yoğun kakao lezzetiyle buluştuğu harika bir atıştırmalık.",
    descEn: "A rich dark chocolate cream and crispy wafer layers combined for an intense cocoa experience.",
    link: "/apps/chocolate-db",
    linkLabelTr: "Çikolata Detaylarına Git",
    linkLabelEn: "Go to Chocolate Details"
  },
  {
    id: "choc-2",
    category: "chocolate",
    titleTr: "Kahve Dünyası Fıstıklı Gofrik",
    titleEn: "Kahve Dunyasi Gofrik Pistachio",
    descTr: "Bol miktarda Antep fıstığı içeren, fıstık ezmesi ve sütlü çikolata kaplamasıyla efsaneleşen çıtır gofret.",
    descEn: "A legendary crispy wafer packed with premium pistachios and coated in smooth milk chocolate.",
    link: "/apps/chocolate-db",
    linkLabelTr: "Çikolata Detaylarına Git",
    linkLabelEn: "Go to Chocolate Details"
  },
  {
    id: "choc-3",
    category: "chocolate",
    titleTr: "Toblerone Sütlü",
    titleEn: "Toblerone Milk Chocolate",
    descTr: "İsviçre Alpleri'nden esinlenen üçgen tasarımı, bal ve badem nugatlı enfes sütlü çikolatasıyla bir dünya klasiği.",
    descEn: "A world-renowned Swiss milk chocolate with honey and almond nougat, shaped in iconic triangles.",
    link: "/apps/chocolate-db",
    linkLabelTr: "Çikolata Detaylarına Git",
    linkLabelEn: "Go to Chocolate Details"
  },
  {
    id: "choc-4",
    category: "chocolate",
    titleTr: "Nestle Damak Antep Fıstıklı",
    titleEn: "Nestle Damak Pistachio",
    descTr: "Sütlü çikolata ile özenle seçilmiş bütün Antep fıstıklarının mükemmel uyumunu sunan nostaljik lezzet.",
    descEn: "The perfect harmony of smooth milk chocolate and carefully selected whole pistachios.",
    link: "/apps/chocolate-db",
    linkLabelTr: "Çikolata Detaylarına Git",
    linkLabelEn: "Go to Chocolate Details"
  },
  {
    id: "choc-5",
    category: "chocolate",
    titleTr: "Milka Oreo",
    titleEn: "Milka Oreo",
    descTr: "Alp sütünden gelen yumuşacık Milka çikolatasının çıtır Oreo bisküvi parçaları ve krema ile enfes buluşması.",
    descEn: "Velvety Milka Alpine milk chocolate combined with crunchy Oreo biscuit pieces and cream filling.",
    link: "/apps/chocolate-db",
    linkLabelTr: "Çikolata Detaylarına Git",
    linkLabelEn: "Go to Chocolate Details"
  },
  {
    id: "choc-6",
    category: "chocolate",
    titleTr: "Ülker Çikolatalı Gofret",
    titleEn: "Ulker Cikolatali Gofret",
    descTr: "Türkiye'nin en çok satan, nesiller boyu değişmeyen çıtırlığı ve sütlü çikolata kaplamasıyla ikonikleşmiş gofret.",
    descEn: "Turkey's best-selling classic chocolate wafer, loved across generations for its timeless crunch.",
    link: "/apps/chocolate-db",
    linkLabelTr: "Çikolata Detaylarına Git",
    linkLabelEn: "Go to Chocolate Details"
  },
  {
    id: "choc-7",
    category: "chocolate",
    titleTr: "Schogetten Caramel Brownie",
    titleEn: "Schogetten Caramel Brownie",
    descTr: "Tek lokmalık kare bölmeleriyle, yoğun brownie dolgusu ve karamel parçacıklarının eşsiz uyumu.",
    descEn: "Unique pre-cut chocolate pieces filled with dark brownie cream and sweet caramel drops.",
    link: "/apps/chocolate-db",
    linkLabelTr: "Çikolata Detaylarına Git",
    linkLabelEn: "Go to Chocolate Details"
  },
  {
    id: "choc-8",
    category: "chocolate",
    titleTr: "Snickers Bar",
    titleEn: "Snickers Peanut Bar",
    descTr: "Nuga, karamel ve taze kavrulmuş yer fıstığının sütlü çikolata altında birleştiği doyurucu bar.",
    descEn: "A satisfying bar packed with peanuts, rich nougat, and sweet caramel coated in milk chocolate.",
    link: "/apps/chocolate-db",
    linkLabelTr: "Çikolata Detaylarına Git",
    linkLabelEn: "Go to Chocolate Details"
  },
  {
    id: "choc-9",
    category: "chocolate",
    titleTr: "Kinder Bueno",
    titleEn: "Kinder Bueno",
    descTr: "İncecik çıtır gofret içinde yumuşak fındık kreması ve üstünde nefis sütlü çikolata kaplaması.",
    descEn: "A crispy wafer bar filled with creamy hazelnut filling and covered in fine milk chocolate.",
    link: "/apps/chocolate-db",
    linkLabelTr: "Çikolata Detaylarına Git",
    linkLabelEn: "Go to Chocolate Details"
  },
  {
    id: "choc-10",
    category: "chocolate",
    titleTr: "Lindt Excellence %70 Bitter",
    titleEn: "Lindt Excellence 70% Cocoa",
    descTr: "Yoğun kakao tadını sevenler için pürüzsüz ve dengeli bir tada sahip premium İsviçre bitter çikolatası.",
    descEn: "A premium Swiss dark chocolate offering a full-bodied yet balanced dark chocolate experience.",
    link: "/apps/chocolate-db",
    linkLabelTr: "Çikolata Detaylarına Git",
    linkLabelEn: "Go to Chocolate Details"
  },

  // === CATEGORY: MOVIES (Filmler) ===
  {
    id: "mov-1",
    category: "movie",
    titleTr: "28 Yıl Sonra: Kemik Tapınağı",
    titleEn: "28 Years Later: Bone Temple",
    descTr: "Zombi kıyameti türünü baştan yazan efsanevi serinin, gerilimi zirveye taşıyan yepyeni halkası.",
    descEn: "The thrilling new installment in the legendary post-apocalyptic franchise that redefined the zombie genre.",
    link: "/apps/movies-this-year",
    linkLabelTr: "Vizyon Bilgilerine Bak",
    linkLabelEn: "View Release Info"
  },
  {
    id: "mov-2",
    category: "movie",
    titleTr: "Kurtuluş Projesi",
    titleEn: "Project Hail Mary",
    descTr: "Marslı'nın yazarından, tek başına uzayda uyanan bir bilim insanının insanlığı kurtarma mücadelesini anlatan bilim kurgu başyapıtı.",
    descEn: "A gripping sci-fi adaptation about a lone astronaut trying to save humanity from an extinction-level threat.",
    link: "/apps/movies-this-year",
    linkLabelTr: "Vizyon Bilgilerine Bak",
    linkLabelEn: "View Release Info"
  },
  {
    id: "mov-3",
    category: "movie",
    titleTr: "Sessiz Tepe: Dönüş",
    titleEn: "Return to Silent Hill",
    descTr: "Kült psikolojik korku oyunu Silent Hill 2'den uyarlanan, James'in Mary'yi arayışındaki karanlık koridorları sunan gerilim.",
    descEn: "A dark psychological horror film adapted from the cult classic game Silent Hill 2.",
    link: "/apps/movies-this-year",
    linkLabelTr: "Vizyon Bilgilerine Bak",
    linkLabelEn: "View Release Info"
  },
  {
    id: "mov-4",
    category: "movie",
    titleTr: "Çığlık 7",
    titleEn: "Scream VI",
    descTr: "Ghostface maskeli katilin yeni kurbanlarıyla başlattığı amansız avı ve kasabadaki gizemli cinayetleri konu alan gerilim.",
    descEn: "The Ghostface killer returns to terrorize survivors in this highly anticipated slasher sequel.",
    link: "/apps/movies-this-year",
    linkLabelTr: "Vizyon Bilgilerine Bak",
    linkLabelEn: "View Release Info"
  },
  {
    id: "mov-5",
    category: "movie",
    titleTr: "Greenland: Kıyamet",
    titleEn: "Greenland: Migration",
    descTr: "Dünyayı vuran büyük felaketlerin ardından sığınaktan ayrılıp yeni bir yaşam kurmaya çalışan Garrity ailesinin maceraları.",
    descEn: "John Garrity and his family must embark on a dangerous journey across a devastated frozen wasteland.",
    link: "/apps/movies-this-year",
    linkLabelTr: "Vizyon Bilgilerine Bak",
    linkLabelEn: "View Release Info"
  },
  {
    id: "mov-6",
    category: "movie",
    titleTr: "Peaky Blinders: Ölümsüz Adam",
    titleEn: "Peaky Blinders: The Movie",
    descTr: "Tommy Shelby'nin Birmingham sokaklarına geri dönerek Nazilerin komplolarına karşı verdiği son ve en büyük savaşı.",
    descEn: "Tommy Shelby returns for one final cinematic battle against dangerous conspiracies in Birmingham.",
    link: "/apps/movies-this-year",
    linkLabelTr: "Vizyon Bilgilerine Bak",
    linkLabelEn: "View Release Info"
  },
  {
    id: "mov-7",
    category: "movie",
    titleTr: "Şampiyon Keçi: Tüm Zamanların En İyisi",
    titleEn: "G.O.A.T.",
    descTr: "Büyük hayalleri olan minik bir keçinin, sert ve tehlikeli roarball ligindeki komik ve ilham verici mücadelesi.",
    descEn: "An inspiring animated adventure of a small goat trying to break records in a high-contact contact sport.",
    link: "/apps/movies-this-year",
    linkLabelTr: "Vizyon Bilgilerine Bak",
    linkLabelEn: "View Release Info"
  },
  {
    id: "mov-8",
    category: "movie",
    titleTr: "Ölümün Sesi",
    titleEn: "Aztec Death Whistle",
    descTr: "Lanetli bir Aztek Ölüm Düdüğü bulan lise öğrencilerinin, düdüğün sesiyle avlanan karanlık bir güçle imtihanı.",
    descEn: "A group of high schoolers uncover a cursed Aztec whistle that hunts whoever hears its sound.",
    link: "/apps/movies-this-year",
    linkLabelTr: "Vizyon Bilgilerine Bak",
    linkLabelEn: "View Release Info"
  },
  {
    id: "mov-9",
    category: "movie",
    titleTr: "Gelin!",
    titleEn: "The Bride!",
    descTr: "Frankenstein'ın canavarının 1930'lar Chicago'sunda kendine bir eş yaratma çabası ve ortaya çıkan radikal aşk hikayesi.",
    descEn: "A bold cinematic reimagining of Frankenstein's bride amidst a radical social movement in Chicago.",
    link: "/apps/movies-this-year",
    linkLabelTr: "Vizyon Bilgilerine Bak",
    linkLabelEn: "View Release Info"
  },
  {
    id: "mov-10",
    category: "movie",
    titleTr: "Cosmic Princess Kaguya!",
    titleEn: "Cosmic Princess Kaguya!",
    descTr: "Ay'dan gelen kaygısız Kaguya'nın, sıradan bir genci sanal dünyadaki çılgın yaşamına ortak etmesiyle başlayan anime.",
    descEn: "A beautiful sci-fi anime about a carefree lunar princess dragging a human boy into her virtual domain.",
    link: "/apps/movies-this-year",
    linkLabelTr: "Vizyon Bilgilerine Bak",
    linkLabelEn: "View Release Info"
  }
];

// Add dynamically generated quality items to reach a total of 100 suggestions
// Offline activities are best to scale up to 70 items so that we have a solid mix of real offline steps
const additionalActivities = [
  { tr: "Çay veya kahve demlerken sadece suyun kaynamasını izle.", en: "Watch the water boil while brewing tea or coffee without looking at a screen." },
  { tr: "Rastgele 10 şınav çek veya 20 squat yap.", en: "Do 10 random push-ups or 20 squats to get your blood flowing." },
  { tr: "Bulunduğun odanın pencerelerini açıp 5 dakika boyunca havalandır.", en: "Open all the windows in your room and let fresh air circulate for 5 minutes." },
  { tr: "Cüzdanındaki eski fişleri, kartları ve gereksiz kağıtları ayıkla.", en: "Go through your wallet and discard old receipts and expired cards." },
  { tr: "En sevdiğin kıyafetlerini kombinle ve ayna karşısında dene.", en: "Mix and match your favorite clothes and try them on in front of a mirror." },
  { tr: "Gözlerini kapat ve 20'den geriye doğru yavaşça say.", en: "Close your eyes and slowly count backward from 20." },
  { tr: "Evdeki aynaları mikrofiber bezle pırıl pırıl sil.", en: "Wipe down all the mirrors in your house until they shine." },
  { tr: "Bir bardak ılık süte bal karıştırıp iç.", en: "Drink a warm cup of milk mixed with a spoonful of honey." },
  { tr: "Telefonundaki gereksiz ekran görüntülerini sil.", en: "Delete unused screenshots and old junk photos from your gallery." },
  { tr: "Çorap çekmeceni baştan aşağı düzenle.", en: "Empty your sock drawer and fold everything neatly." },
  { tr: "En yakın markete yürüyerek git ve sadece bir elma al.", en: "Walk to the nearest grocery store and buy just one apple." },
  { tr: "Sevdiğin bir şiiri sesli olarak oku.", en: "Read a poem you love out loud." },
  { tr: "Gözlerini dinlendirmek için 20 saniye boyunca uzak bir noktaya bak.", en: "Look at an object 20 feet away for 20 seconds to rest your eyes (20-20-20 rule)." },
  { tr: "Bugün yapacağın 3 önemli işi bir kağıda not al.", en: "Write down 3 main goals for today on a physical sticky note." },
  { tr: "Evde varsa bir meyvenin kabuğunu tek seferde soymaya çalış.", en: "Try to peel an apple or orange in one continuous strip if you have one." },
  { tr: "Birkaç dakika boyunca sadece sessizliği dinle.", en: "Sit in complete silence for 3 minutes and just observe." },
  { tr: "Buzdolabının kapak kısmını düzenle, tarihi geçmiş sosları at.", en: "Organize the door shelves of your fridge and discard expired sauces." },
  { tr: "Sırtını duvara yaslayarak 1 dakika boyunca 'wall sit' yap.", en: "Lean against a wall and hold a wall-sit position for 1 minute." },
  { tr: "Yatağını otel konseptinde dümdüz ve pürüzsüz yap.", en: "Make your bed super neat, like a premium hotel room." },
  { tr: "Ayak parmaklarına dokunmaya çalışarak esneklik testi yap.", en: "Reach down and try to touch your toes to stretch your hamstrings." },
  { tr: "Eski bir fotoğraf albümüne göz at.", en: "Flip through a physical photo album or old family photos." },
  { tr: "Bir parça kağıdı katlayarak origami yapmayı dene.", en: "Take a piece of paper and try to fold a basic origami crane." },
  { tr: "Anahtarlarını ve sık kullandığın eşyaları dezenfekte et.", en: "Wipe down your keys, phone case, and daily items." },
  { tr: "Telefonu tamamen kapatıp çekmeceye koy ve 30 dakika orada unut.", en: "Turn off your phone, put it in a drawer, and leave it there for 30 minutes." },
  { tr: "Kendine güzel, demli bir bitki çayı hazırla.", en: "Brew yourself a warm, soothing cup of herbal tea." },
  { tr: "Yavaşça başını sağa, sola, öne ve arkaya çevirerek boynunu rahatlat.", en: "Roll your head slowly in circles to relieve neck tension." },
  { tr: "Evdeki çöpleri dök ve çöp kovasını temizle.", en: "Take out the trash and clean the bottom of the bin." },
  { tr: "Tırnaklarını kes ve bakım yap.", en: "Clip and file your nails." },
  { tr: "Yastık kılıfını temiz ve mis kokulu olanıyla değiştir.", en: "Change your pillowcase to a fresh, clean one." },
  { tr: "Bilgisayarının klavyesini ters çevirip hafifçe vurarak tozunu dök.", en: "Turn your keyboard upside down and gently tap to clean dust." },
  { tr: "Kitaplığındaki kitapları renklerine göre diz.", en: "Rearrange the books on your shelf by color." },
  { tr: "Bir bardak suya limon sıkıp sabah tazeliği yaşa.", en: "Squeeze half a lemon into warm water and drink it." },
  { tr: "10 kez derin nefes alıp yavaşça ver.", en: "Take 10 slow, deep diaphragmatic breaths." },
  { tr: "Mutfak tezgahını tamamen boşaltıp sirkeli suyla sil.", en: "Clear the kitchen counter and wipe it down completely." },
  { tr: "Eski şarj kablolarını toplayıp bantla veya bağcıkla sar.", en: "Gather loose charging cables and tie them neatly." },
  { tr: "Yüzünü buz gibi soğuk suyla yıkayarak canlan.", en: "Splash ice-cold water on your face to feel instantly refreshed." },
  { tr: "10 dakika boyunca hiçbir şey düşünmeden uzan.", en: "Lie flat on your back for 10 minutes and let your thoughts drift." },
  { tr: "Bir dahaki tatil rotanı haritadan incele.", en: "Open a map and research your next dream vacation destination." },
  { tr: "Çalışma lambanın açısını ve ışık şiddetini ayarla.", en: "Adjust the angle and brightness of your workspace desk lamp." },
  { tr: "En son okuduğun kitabın en sevdiğin cümlesini hatırla.", en: "Recall the most impactful quote from the last book you read." },
  { tr: "Evdeki tüm kalemlerin yazıp yazmadığını kontrol et.", en: "Test all the pens in your house and throw away the dry ones." },
  { tr: "Ayakkabılarını temizle ve bağcıklarını düzelt.", en: "Clean one pair of shoes and adjust the laces." },
  { tr: "En sevdiğin tişörtünü ütüle.", en: "Iron your favorite shirt so it's ready to wear." },
  { tr: "Masaüstündeki gereksiz dosyaları çöp kutusuna gönder.", en: "Clean up your computer desktop and empty the recycle bin." },
  { tr: "Kulaklıklarının silikon uçlarını temizle.", en: "Clean the tips of your earphones or headphones." },
  { tr: "Bir parça çikolatayı ağzında çiğnemeden yavaşça eriterek ye.", en: "Let a piece of chocolate melt slowly on your tongue without chewing." },
  { tr: "Uyumadan önce 5 dakika boyunca esneme yap.", en: "Do a 5-minute light stretching routine before bed." },
  { tr: "Evin girişindeki paspası silkip temizle.", en: "Shake out the welcome mat at your front door." },
  { tr: "Yarın giyeceğin kıyafetleri akşamdan hazırla.", en: "Pick out and prepare tomorrow's outfit tonight." },
  { tr: "Balkondaki veya bahçedeki kuşları izle.", en: "Look outside and watch birds flying or perched nearby." },
  { tr: "Kendine güzel bir kahve demle.", en: "Brew a fresh cup of coffee." },
  { tr: "Sevdiğin birine 'Seni düşünüyorum' mesajı gönder.", en: "Send a quick message to a loved one saying: 'Thinking of you'." },
  { tr: "Parmağını masaya vurarak 1 dakika boyunca tempo tut.", en: "Tap your fingers on a desk to a rhythm for 1 minute." },
  { tr: "Evdeki kapı kollarını mikrop kırıcı sprey ile sil.", en: "Wipe down the door handles in your house." },
  { tr: "Eski e-postalarını arşivle.", en: "Archive old emails that are cluttering your inbox." },
  { tr: "Bir süre sadece nefes alıp verdiğini hisset.", en: "Sit and feel the sensation of air entering and leaving your nose." },
  { tr: "Kıyafet dolabındaki askıları aynı yöne çevir.", en: "Hang all clothes in your closet facing the same direction." },
  { tr: "Telefonunun ekranını mikrofiber bezle sil.", en: "Wipe your phone screen clean with a microfibre cloth." },
  { tr: "10 kez zıplayarak enerjini yükselt.", en: "Do 10 jumping jacks to boost your heart rate." },
  { tr: "Kendi kendine mırıldanarak bir şarkı söyle.", en: "Hum your favorite song to yourself." },
  { tr: "Birkaç dakika boyunca sessizce oturup gözlerini kırp.", en: "Sit comfortably and blink your eyes to rest them." },
  { tr: "Bugün yaptığın iyi bir şeyi hatırla.", en: "Reflect on one positive thing you accomplished today." },
  { tr: "Dişlerini her zamankinden 1 dakika daha uzun fırçala.", en: "Brush your teeth for an extra minute today." },
  { tr: "Evde duran eski faturaları geri dönüşüme at.", en: "Gather old papers and bills and put them in recycling." },
  { tr: "Güneşin tadını çıkarmak için 5 dakika balkonda dur.", en: "Step into the sun for 5 minutes to get some vitamin D." }
];

additionalActivities.forEach((act, index) => {
  CURATED_SUGGESTIONS.push({
    id: `act-add-${index}`,
    category: "activity",
    titleTr: "Hızlı Aktivite",
    titleEn: "Quick Activity",
    descTr: act.tr,
    descEn: act.en
  });
});

// Trim or slice to ensure we have exactly 100 high quality suggestions
if (CURATED_SUGGESTIONS.length > 100) {
  CURATED_SUGGESTIONS.splice(100);
}
