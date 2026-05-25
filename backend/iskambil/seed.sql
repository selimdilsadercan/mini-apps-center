-- Seed Games Data for Iskambil

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('baskan-got', 'başkan göt', 'başkan göt oyunu kuralları ve oynanış detayları.', '["52 kartlık tek deste ile 4-7 kişiyle oynanır. Oyunun amacı eldeki tüm kartları rakiplerden önce bitirmektir.","Tüm kartlar oyunculara eşit olarak dağıtılır. Kartı dağıtanın solundaki oyuncu elindeki herhangi bir değerdeki karttan bir veya daha fazla adet (örneğin iki adet 5''li) atarak oyunu başlatır.","Sıradaki oyuncular, ortadaki kart sayısı kadar ve daha yüksek değerde kart atmak zorundadır (örneğin iki adet 7''li). Kart atamayan oyuncu ''Pas'' der ve sıra geçer.","Herkes pas dediğinde ortadaki kartlar temizlenir ve en son kartı atan oyuncu yeni bir tur başlatır. 2 en büyük karttır ve ortayı temizler.","Eldeki kartları bitirme sırasına göre oyuncular unvan kazanır: 1. bitiren ''Başkan'', 2. bitiren ''Başkan Yardımcısı'', sonuncu ise ''Göt'' olur.","Yeni el başlarken, ''Göt'' en yüksek iki kartını ''Başkan''a vermek zorundadır. ''Başkan'' da karşılığında en değersiz iki kartını ''Göt''e verir. Yardımcılar da kendi aralarında birer kart değişimi yapar."]'::jsonb, 2, 4, '1 Deste', 'El Bitirme')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('crazy-eights-uno', 'crazy eights (uno)', 'crazy eights (uno) oyunu kuralları ve oynanış detayları.', '["Her oyuncuya 7''şer kart dağıtılır ve kalan deste kapalı olarak masaya konur. Destenin en üstündeki kart ortaya açılarak oyun başlar.","Sırası gelen oyuncu, yerdeki kartın rengine veya sayısına uyan bir kart atmak zorundadır (Örn: Karo 5 üzerine Karo 9 veya Sinek 5 atılabilir).","Eğer oyuncunun elinde oynayabileceği bir kart yoksa, desteden uygun bir kart bulana kadar sırayla kart çekmek zorundadır.","8 rakamlı kartlar jokerdir. Sırası gelen oyuncu elindeki 8''liyi istediği zaman atabilir ve yeni oynanacak rengi belirler.","Elde son kart kaldığında oyuncu ''Son Kart'' demek zorundadır. Demeyi unutursa ceza kartı çeker.","Bir oyuncu elini bitirdiğinde tur sona erer ve diğer oyuncular ellerindeki kartların puanları kadar ceza puanı yer: 8''ler 50, As 11, resimli kartlar 10, diğerleri sayı değeri kadar puan ceza yazılır."]'::jsonb, 2, 4, '1 Deste', 'El Bitirme')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('himbil-esek', 'hımbıl (eşek)', 'hımbıl (eşek) oyunu kuralları ve oynanış detayları.', '["Oyuncu sayısı kadar aynı sayı grubundan (Örn: 4 kişi için 4 As, 4 Kız, 4 Papaz, 4 Vale) toplamda oyuncu sayısı x 4 kart ile oynanır.","Her oyuncuya 4''er adet kart dağıtılır. Amaç elinde aynı değerden 4 kartı bir araya getirmektir.","Herkes elindeki kartlardan işine yaramayan bir tanesini seçer. Dağıtıcının ''3, 2, 1, Hımbıl!'' demesiyle aynı anda herkes seçtiği kartı sağındaki oyuncuya kapalı olarak verir.","Kart değişimi, bir oyuncu elindeki 4 kartı da aynı yapana kadar eşzamanlı olarak devam eder.","Elini tamamlayan oyuncu elini masanın ortasına koyarak ''Hımbıl!'' (veya Eşek!) diye bağırır. Bunu gören diğer oyuncular da ellerini hemen tamamlayan oyuncunun elinin üstüne koymak zorundadır.","Elini en son koyan oyuncu turu kaybeder ve hanesine ceza puanı (E-Ş-E-K harflerinden biri) yazılır. Harfleri tamamlayan elenir."]'::jsonb, 2, 4, '1 Deste', 'Eğlence / Hız')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('poker', 'poker', 'poker oyunu kuralları ve oynanış detayları.', '["Dünyanın en popüler kart oyunudur. 52 kartlık tek deste ile en az 2, en fazla 10 kişiyle oynanır. Oyun saat yönünde ilerler.","Her el başında tüm oyuncular masanın minimum bahis tutarı (pot) kadar çipi ortaya koyar. Herkese kapalı olarak 2 kart dağıtılır.","İlk bahis turundan sonra dağıtıcı masanın ortasına 3 adet açık kart açar (Flop). Oyuncular ellerindeki 2 kartla ortadaki kartları birleştirerek en iyi eli kurmaya çalışır.","İkinci bahis turundan sonra ortaya 4. kart (Turn) açılır. Üçüncü bahis turundan sonra 5. ve son kart (River) açılır.","Son bahis turundan sonra elinde kalan oyuncular kartlarını açar (Showdown). En yüksek 5''li kombinasyona sahip oyuncu ortadaki çipleri kazanır.","El güç sıralaması: Royal Flush, Straight Flush, Kare (Four of a Kind), Ful (Full House), Renk (Flush), Kent (Straight), Üçlü, Döper (Two Pair), Per (Pair), Yüksek Kart."]'::jsonb, 2, 4, '1 Deste', 'Casino / Bahis')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('blackjack', 'blackjack', 'blackjack oyunu kuralları ve oynanış detayları.', '["Dağıtıcıya (kasa) karşı oynanan bir casino oyunudur. Amaç 21 limitini aşmadan kasadan daha yüksek bir toplama ulaşmaktır.","Her oyuncuya ve kasaya 2''şer kart dağıtılır. Oyuncunun kartları açık, kasanın ise bir kartı açık bir kartı kapalı tutulur.","As kartı elin durumuna göre 1 veya 11 puan değerindedir. Vale, Kız, Papaz 10 puan, diğer kartlar ise üzerindeki sayı değerindedir.","Sırası gelen oyuncu kart isteyebilir (''Hit''), elindeki kartlarla kalabilir (''Stand''), bahsini ikiye katlayabilir (''Double'') veya gelen aynı değerdeki iki kartı iki ayrı el olarak bölebilir (''Split'').","Eğer oyuncunun kart toplamı 21''i geçerse (''Bust'') oyunu ve bahsini anında kaybeder.","Tüm oyuncular hamlelerini bitirince kasa kapalı kartını açar. Kasa 16 ve altındaki toplamlar için kart çekmek zorundadır, 17 ve üzerinde ise durmak zorundadır."]'::jsonb, 2, 4, '1 Deste', 'Casino / Bahis')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('clubbers', 'clubbers', 'clubbers oyunu kuralları ve oynanış detayları.', '["Tüm kartlar oyunculara eşit olarak dağıtılır ve kapalı bir deste halinde tutulur. Oyuncular kartlarına bakamaz.","Oyuncular sırasıyla destelerinin en üstündeki kartı masanın ortasına açık olarak atarlar.","Eğer atılan kart, yerdeki bir önceki kartla aynı değerdeyse (pişti durumu) ilk hamleyi yapan yerdeki kartları toplar.","Vale (J) 1 ceza puanı, Kız (Q) 2 ceza puanı, Papaz (K) 3 ceza puanı ve As (A) 4 ceza puanı değerindedir.","Elde en çok ceza puanı toplayan oyuncu oyunu kaybeder."]'::jsonb, 2, 4, '1 Deste', 'El Bitirme')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('gin-rummy-2-kisilik-101', 'gin rummy (2 kişilik 101)', 'gin rummy (2 kişilik 101) oyunu kuralları ve oynanış detayları.', '["2 kişiyle, 52 kartlık tek deste ile oynanır. Her oyuncuya 10''ar kart dağıtılır, kalan deste masaya konur and en üstteki kart açılır.","Amaç eldeki kartları perler (aynı sayıdan 3-4 adet veya aynı renkten sıralı en az 3 kart) halinde gruplamaktır. As (A) her zaman 1 puandır.","Oyuncular sırayla ya yerdeki açık kartı ya da destenin üstündeki kapalı kartı alır ve elinden bir kartı yere atarak sırasını bitirir.","Eşleşmemiş kartlarının (deadwood) toplam sayısal değeri 10 veya daha az olan oyuncu elini yere açabilir (Knock).","Eğer oyuncunun elindeki tüm kartlar per olmuşsa ''Gin'' yapar ve rakibe büyük ceza puanı yazar.","Vurma (Knock) sonrası diğer oyuncu elindeki perleri açar ve vuran kişinin perlerine elindeki uygun boş kartları ekleyebilir (Lay-off). 100 puana ulaşan oyunu kazanır."]'::jsonb, 2, 4, '1 Deste', 'Rumi / Okey')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('casino-toplamali-pisti', 'casino (toplamalı pişti)', 'casino (toplamalı pişti) oyunu kuralları ve oynanış detayları.', '["Herkese 4''er kart dağıtılır ve yere 4 adet açık kart konur. Oyunun amacı yerdeki kartları sayı değerlerini toplayarak almaktır.","Sırası gelen oyuncu elindeki bir kartla yerdeki bir veya birden fazla kartın toplamını eşitleyerek kartları alır (Örn: Yerde 3 ve 5 varsa eldeki 8''li ile ikisini birden alabilir).","Eğer ortadan kart alamıyorsa, elindeki bir kartı yere bırakmak zorundadır. Yerdeki kartların üzerine kart eklenerek değerleri birleştirilebilir.","Resimli kartlar (Papaz, Kız, Vale) toplama kombinasyonlarında kullanılamaz, sadece kendi eşleriyle alınabilirler.","Eldeki kartlar bittikçe 4''er kart daha dağıtılır. Son elde yerdeki kalan tüm kartları en son kart alan oyuncu toplar.","Puanlama: Karo 10 (3 puan), Sinek 2 (2 puan), Aslar (1 puan), En çok kart toplayan (3 puan)."]'::jsonb, 2, 4, '1 Deste', 'Diğer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('spite-and-mallice', 'spite and mallice', 'spite and mallice oyunu kuralları ve oynanış detayları.', '["İki kişi ve çift deste (104 kart) ile oynanan rekabetçi bir solitaire varyasyonudur.","Her oyuncunun 20''şer karttan oluşan kişisel bir ödeme destesi (pay-off pile) vardır. Amaç bu destedeki tüm kartları ilk önce bitirmektir.","Masanın ortasında As''tan başlayarak Papaz''a kadar sıralı olarak ortak beşli seriler oluşturulur.","Oyuncular ellerindeki 5 kartı, kendi ödeme destelerindeki en üst açık kartı ve yanlarındaki 4 adet kişisel atık destesini kullanarak ortadaki ortak serilere kart eklemeye çalışırlar.","Sırası gelen oyuncu hamle yapamaz hale gelene kadar oynamaya devam eder, ardından bir kartını kişisel atık destelerinden birine atarak sırasını bitirir."]'::jsonb, 2, 4, '2 Deste', 'Eğlence / Hız')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('corousel-rummy', 'corousel rummy', 'corousel rummy oyunu kuralları ve oynanış detayları.', '["2-5 kişiyle, 1 deste ve 1 joker kartı kullanılarak oynanır. Her oyuncuya 10''ar kart dağıtılır.","Amaç eldeki kartları perler halinde masanın ortasına açmaktır. Okey oyununa benzer bir mantıkla oynanır.","Sırası gelen oyuncu ya desteden kart çeker ya da masadaki perlere elindeki kartları işler (ekleme yapar).","Oyuncular sıradaki turlarında masadaki mevcut perleri tamamen bozup kendi ellerindeki kartlarla yeni per kombinasyonları oluşturabilirler (manipülasyon).","Eldeki tüm kartları bitiren ilk oyuncu eli kazanır ve diğer oyuncuların kalan kart değerleri toplamı kazanan hanesine artı puan yazılır."]'::jsonb, 2, 5, '1 Deste + 1 Joker', 'Rumi / Okey')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('pinochle', 'pinochle', 'pinochle oyunu kuralları ve oynanış detayları.', '["Özel 48 kartlık Pinochle destesi (9, 10, Vale, Kız, Papaz, As kartlarından ikişer adet) ile oynanır.","Oyun iki aşamadan oluşur: İhale/Deklare aşaması ve El alma (Trick-taking) aşaması.","Oyuncular ellerindeki kartların oluşturduğu kombinasyonlara (perler, evlilikler, pinochle vb.) göre puan toplarlar.","Ardından belirlenen koz rengine göre el alma oyunu oynanır. Alınan ellerdeki As, 10 ve Papaz kartları ekstra puan getirir.","Belirlenen hedef puana (genellikle 150 veya 500) ilk ulaşan oyuncu veya takım oyunu kazanır."]'::jsonb, 2, 4, '2 Deste', 'Diğer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('cucumber', 'cucumber', 'cucumber oyunu kuralları ve oynanış detayları.', '["2-7 kişiyle oynanan ve son eli almamaya çalışılan eğlenceli bir İskandinav oyunudur. Tek deste ile oynanır.","Herkese 7''şer kart dağıtılır. En büyük kartı atan el alır ancak oyunun temel amacı sonuncu eli almaktan kaçınmaktır.","Sırası gelen oyuncu yerdeki kartla aynı veya daha büyük değerde bir kart atmak zorundadır. Atamıyorsa elindeki en düşük kartı atmalıdır.","Son eli alan oyuncu, eli aldığı kartın sayısal değeri kadar ceza puanı yer (As 14, Papaz 13 vb.).","Ceza puanı 30''u aşan oyuncu oyundan elenir, en sona kalan oyuncu oyunu kazanır."]'::jsonb, 2, 7, '1 Deste', 'Diğer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('crazy-eights-countdown', 'crazy eights countdown', 'crazy eights countdown oyunu kuralları ve oynanış detayları.', '["Crazy Eights oyununun daha zorlu ve aşamalı bir versiyonudur. Her oyuncu oyuna 8 ceza puanı limitiyle başlar.","Her turda oyuncuların atabileceği joker kartın değeri, o anki countdown seviyelerine göre belirlenir ( Countdown 8''deyken sadece 8''ler jokerdir, el bitince seviye 7''ye düşer ve 7''ler joker olur).","Kart dağıtımı da countdown seviyesine göre azalır. Seviyesi 0''a ilk ulaşan oyuncu şampiyon olur."]'::jsonb, 2, 5, '1 Deste', 'El Bitirme')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('minnesota-whist', 'minnesota whist', 'minnesota whist oyunu kuralları ve oynanış detayları.', '["4 kişiyle, ikişerli takımlar halinde oynanan ihalesiz bir el alma (whist) oyunudur. Tüm kartlar dağıtılır.","Koz rengi deklare edilmez. Oyunu başlatan kartın rengi o elin rengini belirler.","Oyuncular yerdeki renge uymak zorundadır. En yüksek kartı atan eli takımına kazandırır.","Takımlar aldıkları el sayısına göre puan toplarlar. Hedeflenen skora ulaşan takım maçı kazanır."]'::jsonb, 4, 4, '1 Deste', 'Kozlu / Löf')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('crash', 'crash', 'crash oyunu kuralları ve oynanış detayları.', '["4 kişiyle oynanan ve poker ellerinin el alma mekaniğiyle birleştirildiği hızlı bir İngiliz oyunudur.","Tüm kartlar dağıtılır (herkese 13 kart). Oyuncular ellerindeki kartları en güçlü üçer kartlık 4 gruba ayırırlar.","Gruplar sırayla karşılaştırılır. Üçlü (Prial), Sıralı Renk (Running Flush), Sıralı (Run) veya Renk (Flush) kombinasyonları yarıştırılır.","Kombinasyon karşılaştırmalarında en çok puanı toplayan oyuncu eli kazanır."]'::jsonb, 4, 4, '1 Deste', 'Diğer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('scopa', 'scopa', 'scopa oyunu kuralları ve oynanış detayları.', '["Klasik bir İtalyan kart oyunudur. 8, 9 ve 10 kartları desteden çıkarılarak 40 kartla oynanır.","Herkese 3''er kart dağıtılır ve ortaya 4 kart açık olarak konur.","Sırası gelen oyuncu elindeki kartla yerdeki aynı değerdeki kartı veya toplamları elindeki karta eşit olan kartları alır.","Yerdeki son kartı alıp masayı tamamen boşaltan oyuncu ''Scopa'' (süpürme) yapmış olur ve ekstra puan kazanır."]'::jsonb, 2, 4, '1 Deste', 'Diğer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('31', '31', '31 oyunu kuralları ve oynanış detayları.', '["Her oyuncunun 3 canı vardır. Amaç aynı renkten 3 kartın toplam değerini 31 yapmaktır.","Herkese 3''er kart dağıtılır ve ortaya bir kart açılır. As 11 puan, resimli kartlar 10 puan, diğerleri sayı değerindedir.","Oyuncular sırayla yerden veya desteden kart alıp elindeki bir kartı yere atarak ellerini iyileştirirler.","Elini 31 yapan oyuncu anında elini açar ve diğer tüm oyuncular 1 can kaybeder.","Elini 31 yapamasa da elinin iyi olduğunu düşünen oyuncu sırası gelince ''Açın!'' diyebilir. Bu durumda herkes son bir tur kart çeker ve eller karşılaştırılır; en düşük skora sahip kişi can kaybeder."]'::jsonb, 4, 4, '1 Deste', 'Casino / Bahis')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('66-santase', '66 (santase)', '66 (santase) oyunu kuralları ve oynanış detayları.', '["2 kişiyle, destedeki sadece 9 ve üzerindeki 24 kartla oynanan hızlı bir strateji oyunudur.","Herkese 6''şar kart dağıtılır ve ortadaki destenin altına koz kartı açık olarak yerleştirilir.","As 11, 10''lu 10, Papaz 4, Kız 3, Vale 2 puan değerindedir. Ayrıca aynı renkten Papaz-Kız evliliği göstermek ek puan kazandırır.","Oyun içinde kart puanlarını toplayarak 66 puana ilk ulaşan oyuncu eli kazanır. 7 tur puanına ulaşan maçı alır."]'::jsonb, 2, 2, '1 Deste', 'Diğer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('21', '21', '21 oyunu kuralları ve oynanış detayları.', '["Blackjack oyununun Türkiye''de evlerde oynanan daha basit kurallı ve eğlenceli bir versiyonudur.","Amaç 21''i geçmeden kart toplamını 21''e en yakın hale getirmektir.","Oyuncular sırayla istedikleri kadar kart çekerler. 21''i aşan oyuncu yanar ve elenir."]'::jsonb, 2, 4, '1 Deste', 'Casino / Bahis')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('es-bulmali-speed', 'eş bulmalı speed', 'eş bulmalı speed oyunu kuralları ve oynanış detayları.', '["Hıza ve reflekslere dayalı, sırasız oynanan eğlenceli bir oyundur.","Yere 8 adet açık kart dizilir. Kalan kartlar oyunculara eşit dağıtılır.","Oyuncular ellerindeki kartları kontrol ederek, yerdeki kartlardan aynı değere sahip olanların üzerine ellerindeki eşleri hızlıca koymaya çalışırlar.","Kartını ilk bitiren oyuncu oyunu kazanır."]'::jsonb, 2, 4, '1 Deste', 'Eğlence / Hız')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('51', '51', '51 oyunu kuralları ve oynanış detayları.', '["Okey mantığıyla oynanan, çift deste ve jokerlerle icra edilen popüler bir baraj oyunudur.","Herkese 14''er kart dağıtılır (başlayana 15). Amaç eldeki kartları perler haline getirmektir.","Oyuncuların yere ellerini açabilmesi için perlerinin sayısal toplamının en az 51 puan olması gerekir.","Yere açılan perlere diğer oyuncular ellerindeki uygun kartları işleyebilirler. Elindeki tüm kartları bitiren oyuncu kazanır."]'::jsonb, 2, 4, '1 Deste', 'Rumi / Okey')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('speed-1-1-oyunu', 'speed (+1 -1 oyunu)', 'speed (+1 -1 oyunu) oyunu kuralları ve oynanış detayları.', '["2 kişiyle oynanan, sırasız ve son derece hızlı bir kart azaltma oyunudur.","Ortaya 2 adet açık kart konur. Oyuncuların elinde 5''er açık kart bulunur.","Oyuncular yerdeki açık kartların sayı değerinin 1 fazlası veya 1 eksiği olan kartları hızlıca ortadaki destelerin üzerine koymaya çalışırlar (Örn: Yerdeki 6 üzerine 5 veya 7 atılabilir).","Eldeki 5 kart azaldıkça kişisel desteden kart tamamlanır. Kartlarını ilk bitiren kazanır."]'::jsonb, 2, 4, '1 Deste', 'Eğlence / Hız')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('spit', 'spit', 'spit oyunu kuralları ve oynanış detayları.', '["Solitaire benzeri yerleşim düzeniyle oynanan çok hızlı bir 2 kişilik kart bitirme oyunudur.","Desteler ikiye bölünür ve her oyuncu kendi önüne 5 adet kart sütunu açarak üstlerini piramit gibi kapalı kartlarla doldurur.","Oyuncular aynı anda ortadaki ortak iki desteye +1 veya -1 kuralıyla kartlarını boşaltmaya çalışırlar.","Boşalan sütunlara önlerindeki diğer açık kartları kaydırarak tüm kişisel kartlarını ilk bitiren eli alır."]'::jsonb, 2, 4, '1 Deste', 'Eğlence / Hız')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('blof', 'blöf', 'blöf oyunu kuralları ve oynanış detayları.', '["Rakipleri yanıltmaya ve eldeki kartları yalan söyleyerek bitirmeye dayalı popüler bir grup oyunudur.","Kartlar eşit dağıtılır. Oyuna başlayan oyuncu ortaya kapalı olarak kart atar ve değerini söyler (Örn: ''Üç adet Kız'').","Diğer oyuncular sırayla bu beyanın yalan (blöf) olup olmadığını tahmin eder veya üzerine aynı değerde kart ekler.","Bir oyuncu ''Blöf!'' diyerek kartları açarsa; eğer kartlar söylenen değerdeyse blöf diyen yerdeki tüm kartları cezalı olarak çeker, yalan söylenmişse blöf yapan çeker."]'::jsonb, 2, 4, '1 Deste', 'Eğlence / Hız')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('dost-kazigi-kapti-kacti', 'dost kazığı (kaptı kaçtı)', 'dost kazığı (kaptı kaçtı) oyunu kuralları ve oynanış detayları.', '["Ortaya 4 açık kart konur ve herkese 4''er kart dağıtılır. Amaç yerdeki kartları eşleyerek toplamaktır.","Eğer elinizdeki kart yerdeki en üst kart ile aynı değerdeyse yerdeki tüm desteyi alabilirsiniz.","Eğer bir oyuncunun aldığı destenin en üstündeki kartın aynısı başka bir oyuncunun elinde varsa, o desteyi rakibinden çalabilir (Dost kazığı)."]'::jsonb, 2, 4, '1 Deste', 'Eğlence / Hız')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('papaz-kacti', 'papaz kaçtı', 'papaz kaçtı oyunu kuralları ve oynanış detayları.', '["Desteden 3 adet Papaz çıkarılır, sadece tek bir Papaz destede bırakılır. Kartlar eşit dağıtılır.","Oyuncular ellerindeki çift kartları (iki adet 7''li vb.) yere atarak eler.","Ardından sırayla yanındaki oyuncudan kapalı olarak bir kart çekilir ve eşleşen kartlar elenmeye devam eder.","Oyun sonunda elinde tek kalan Papaz kartı bulunan oyuncu oyunu kaybeder (Papaz kaçtı)."]'::jsonb, 3, 6, '1 Deste', 'Eğlence / Hız')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('pisti', 'pişti', 'pişti oyunu kuralları ve oynanış detayları.', '["Türkiye''de en çok oynanan klasik el alma oyunudur. Yere 3 kapalı 1 açık kart konur ve herkese 4 kart dağıtılır.","Oyuncular sırayla yerdeki kartı eşleyerek almaya çalışırlar. Vale (J) yerdeki tüm kartları alır.","Eğer yerde tek bir kart varken elinizdeki aynı değerdeki kartla onu alırsanız ''Pişti'' yapmış olursunuz (10 puan, Vale ile pişti 20 puan).","Kartlar bitince puanlama yapılır: Karo 10 (3 puan), Sinek 2 (2 puan), Aslar (1 puan), Valeler (1 puan), En çok kart toplayan (3 puan)."]'::jsonb, 2, 4, '1 Deste', 'Diğer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('pis-yedili', 'pis yedili', 'pis yedili oyunu kuralları ve oynanış detayları.', '["Uno benzeri özel kuralları olan eğlenceli bir kart bitirme oyunudur. Sinekle başlanır.","Vale kartı rengi değiştirir, As bir sonraki oyuncuyu pas geçirir, 7 atan sonraki oyuncuya 3 kart çektirir, 10 yönü değiştirir.","Elde tek kart kaldığında ''Tek'' denilmelidir. Kartlarını ilk bitiren kazanır, diğerlerinin elinde kalan kart değerleri ceza olarak yazılır."]'::jsonb, 2, 4, '1 Deste', 'El Bitirme')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('batak-spades', 'batak (spades)', 'batak (spades) oyunu kuralları ve oynanış detayları.', '["Türkiye''de kahvehanelerin vazgeçilmezi olan taktiksel el alma oyunudur. 4 kişiyle oynanır.","Her el başında oyuncular alabilecekleri el sayısını tahmin ederek deklare ederler. İhaleyi alan kozu belirler.","Yerde oynanan renkten kart atmak zorunludur. Yoksa koz atılmalıdır. En yüksek kartı atan eli alır.","İhale sayısına ulaşamayan oyuncu batar ve eksi puan alır."]'::jsonb, 5, 10, '1 Deste', 'Kozlu / Löf')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('gops-game-of-pure-strategy', 'gops (game of pure strategy)', 'gops (game of pure strategy) oyunu kuralları ve oynanış detayları.', '["Tamamen saf strateji ve psikolojik tahmine dayalı 2 kişilik bir matematik oyunudur.","Karo serisi ortada ödül kartları olarak kullanılır. Oyuncular ellerindeki Kupa ve Maça serilerini kullanarak bu ödülleri kazanmaya çalışırlar.","Orta açılan ödül kartı için iki oyuncu da elinden kapalı bir kart seçer ve aynı anda açarlar. Büyük kart atan ödülü kazanır.","Eşit kartlar atılırsa ödül ortada kalır ve sonraki el iki ödül birden kazanılır. En çok puanı toplayan kazanır."]'::jsonb, 2, 4, '1 Deste', 'Diğer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('gommeli-batak', 'gömmeli batak', 'gömmeli batak oyunu kuralları ve oynanış detayları.', '["3 kişiyle oynanan ve ihaleyi alanın yerdeki kapalı 4 kartı (gömüyü) alıp yerine 4 kart gömdüğü batak varyasyonudur.","Kartlar 16''şar adet dağıtılır ve yere 4 kart kapalı konur. İhaleyi kazanan yerdeki kartları alarak elini güçlendirir ve kozu belirler."]'::jsonb, 8, 12, '1 Deste', 'Kozlu / Löf')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('esli-batak', 'eşli batak', 'eşli batak oyunu kuralları ve oynanış detayları.', '["4 kişiyle, karşılıkli oturan oyuncuların ortak (ortaklı) olarak oynadığı popüler batak türüdür.","İhaleyi kazanan oyuncunun ortağı elini masaya tamamen açık olarak serer. İhaleyi alan oyuncu hem kendi elini hem de ortağının elini yönetir."]'::jsonb, 8, 12, '1 Deste', 'Kozlu / Löf')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('ikili-batak-rus-batagi', 'ikili batak (rus batağı)', 'ikili batak (rus batağı) oyunu kuralları ve oynanış detayları.', '["2 kişiyle oynanan stratejik bir batak varyasyonudur. Kartlar başlangıçta kapalı ve açık kombinasyonlar halinde dağıtılır.","Oyuncular yerdeki açık kartları ve kapalı kartları sırayla seçerek ellerini oluştururlar, ardından koz belirlenerek el alma aşamasına geçilir."]'::jsonb, 7, 10, '1 Deste', 'Kozlu / Löf')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('whist-ihalesiz-iki-kisilik-batak', 'whist (ihalesiz iki kişilik batak)', 'whist (ihalesiz iki kişilik batak) oyunu kuralları ve oynanış detayları.', '["İki kişiyle oynanan, ihalenin olmadığı klasik whist varyasyonudur.","Dağıtılan 13 kartın ardından ortadaki destenin en üstündeki kart açılır ve koz rengini belirler. Oyuncular sırayla eller oluşturarak en çok eli almaya çalışırlar."]'::jsonb, 2, 4, '1 Deste', 'Kozlu / Löf')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('authors-bana-2-tane-papaz-ver', 'authors (bana 2 tane papaz ver)', 'authors (bana 2 tane papaz ver) oyunu kuralları ve oynanış detayları.', '["Oyuncuların birbirlerinden kart isteyerek aynı sayı grubundan 4''lü setler (yazar setleri) oluşturmaya çalıştığı bir hafıza oyunudur.","Sırası gelen oyuncu istediği bir oyuncudan spesifik bir kart ister (Örn: ''Ahmet, sende Karo Kız var mı?''). İstediği kart varsa alır ve sormaya devam eder."]'::jsonb, 2, 4, '1 Deste', 'Diğer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('peanuts-nerts', 'peanuts (nerts)', 'peanuts (nerts) oyunu kuralları ve oynanış detayları.', '["Birden fazla desteyle oynanan, solitaire kurallarının çok oyunculu ve gerçek zamanlı bir versiyonudur.","Oyuncular kendi solitaire alanlarında kart dizerken, masanın ortasındaki ortak as alanlarına hızlıca kart taşımaya çalışırlar. Süre sınırı yoktur, refleks önemlidir."]'::jsonb, 2, 4, '2 Deste', 'Diğer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('carousel-rummy', 'carousel rummy', 'carousel rummy oyunu kuralları ve oynanış detayları.', '["2-5 kişiyle oynanan, masadaki perlerin bozulup tekrar birleştirilebildiği gelişmiş bir rumi/okey varyasyonudur.","Oyuncular ellerindeki taşları eritmek için masadaki tüm kombinasyonları manipüle edebilirler."]'::jsonb, 2, 4, '1 Deste + 1 Joker', 'Rumi / Okey')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('kosedeki-papazlar', 'köşedeki papazlar', 'köşedeki papazlar oyunu kuralları ve oynanış detayları.', '["Yere açılan 4 kartın etrafına Papazlar geldikçe köşelere yerleştirilerek oynanan bir solitaire-board melez oyunudur.","Oyuncular desteden kart çekip yerdeki serileri renklerine göre sıralı olarak tamamlamaya çalışırlar."]'::jsonb, 2, 4, '1 Deste', 'Diğer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('solitaire', 'solitaire', 'solitaire oyunu kuralları ve oynanış detayları.', '["Tek kişilik klasik kart dizme oyunudur. Amaç 7 sütundaki kartları As''tan başlayarak Papaz''a kadar kendi yuvalarına taşımaktır.","Sütunlarda kartlar bir kırmızı, bir siyah olmak üzere büyükten küçüğe doğru dizilebilir. Hamle kalmayınca desteden kart çekilir."]'::jsonb, 1, 1, '1 Deste', 'Tek Kişilik')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('freecell', 'freecell', 'freecell oyunu kuralları ve oynanış detayları.', '["Solitaire oyununun tüm kartların açık olarak dağıtıldığı ve şans faktörünün en az olduğu versiyonudur.","Üst köşede bulunan 4 adet geçici boş hücre (free cell) kartların geçici olarak tutulması için stratejik olarak kullanılır."]'::jsonb, 1, 1, '1 Deste', 'Tek Kişilik')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('spider-solitaire', 'spider solitaire', 'spider solitaire oyunu kuralları ve oynanış detayları.', '["Çift deste ile oynanan en zorlu tek kişilik solitaire varyasyonudur.","Amaç aynı renkten Papaz''dan As''a kadar kesintisiz seriler oluşturarak oyun alanından bu serileri temizlemektir."]'::jsonb, 1, 1, '1 Deste', 'Tek Kişilik')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

INSERT INTO iskambil.games (id, name, description, rules, min_players, max_players, deck_count, category)
VALUES ('go', 'go', 'go oyunu kuralları ve oynanış detayları.', '["Uzak Doğu kökenli klasik bir tahta oyunudur. Siyah ve beyaz taşlarla oynanır (Bu oyun kart oyunu değildir, bonus masa oyunu olarak listelenmiştir).","Amaç tahta üzerinde taşlarla alanları kuşatmak ve rakipten daha fazla alana sahip olmaktır."]'::jsonb, 2, 4, '1 Deste', 'Masa Oyunu')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  min_players = EXCLUDED.min_players,
  max_players = EXCLUDED.max_players,
  deck_count = EXCLUDED.deck_count,
  category = EXCLUDED.category;

