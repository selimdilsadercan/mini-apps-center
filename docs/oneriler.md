# Everything — Süper-App Önerileri

> Kod tabanının (56 backend servisi, 51 tüketici + 9 işletme app'i, hub toplayıcı katman, Capacitor mobil, kart-tabanlı AI asistan) analizine dayalı, önceliklendirilmiş öneriler.
> Amaç: özellik eklemek değil — **odak, yapışkanlık ve gelir**.

---

## 0. Tek cümlelik yön
Mühendislik ve vizyon A+. Sıradaki savaş **acımasız odak**: 60 app'i tek "kim için, hangi anda" hikâyesine bağlamak ve 2–3 app'i *vazgeçilmez* yapmak.

Önerilen konumlandırma cümlesi:
> **"Günlük hayatını ve yakın çevrendeki işletmeleri tek yerden yöneten yaşam uygulaması."**

Her karar bu cümleye hizmet ediyor mu diye test edilmeli.

---

## ŞİMDİ (0–4 hafta) — Odak ve temizlik

### 1. Kimliği netleştir
- Kategori adı hâlâ **"Kampüslülere Özel"** ama ürün genel hayat + yerel işletmeye taşındı. Bu çelişkiyi çöz:
  - Ya kategori adını **"Günlük Hayat"** yap (bu oturumda Yaşam sekmesinde zaten "Günlük Hayat / Finans" başlıklarına geçtik — tutarlı hale getir),
  - Ya da bilinçli olarak "öğrenci" konumlanmasına geri dön. İkisinin arasında kalma.

### 2. İptal app'leri kod tabanından ayıkla
- **17 iptal + 2 yapılmamış** app hâlâ `RAW_MINI_APPS` içinde. Bunlar:
  - Keşif yükünü ve bakım maliyetini artırıyor,
  - `MobileThemeManager` gibi yerlerde ölü `statusBarColor` alanları taşıyor.
- **Aksiyon:** iptal app'leri ayrı bir `archived/` listeye taşı veya flag'le tamamen filtrele. Kullanıcı 60 değil, ~15 net app görsün.

### 3. "Vazgeçilmez 3" seç
Her şeyi eşit besleme. Retention verisine göre **en yapışkan 3 app'i** seç (aday: `read-tracker`, `ev-isleri`, `rutinler`/ajanda, `gym`) ve tüm cila/AI/bildirim yatırımını oraya yoğunlaştır. Gerisi "destekleyici".

### 4. Bugün akışını retention motoru olarak sertleştir
`hub` toplayıcı katman en büyük kozun. Onu ölç ve güçlendir:
- Her widget için **"bugün etkileşim oldu mu"** metriği ekle.
- Boş/etkisiz widget'ları otomatik gizle (zaten `dailyWidgetStates` altyapısı var — genişlet).
- Bu oturumda okuma widget'ına eklediğimiz **inline eylem butonları** modelini diğer widget'lara da yay (gym seti tikle, öğün tamamla — tek dokunuş, app'e girmeden).

---

## SIRADA (1–3 ay) — Yapışkanlık ve gelir

### 5. Bildirim stratejisi = retention
- Push altyapısı (`lib/fcm.ts`) var ama **doğru anlar** kritik: "bugün 90 sayfa kaldı", "ev işi sırası sende", "3 gün streak — bozma".
- Kişisel, app-bazlı değil **Bugün-bazlı** tek akıllı bildirim > 10 ayrı app bildirimi.

### 6. Sosyal dokuyu app'lerin içine göm
- Arkadaş grafiği + feed + öneri + "kim gelir" güçlü ama **ayrı adalar**. Değer, çapraz bağlandığında çıkar:
  - "Arkadaşın X kitabını bitirdi", "3 arkadaşın bu etkinliğe geliyor", "budget'ta borç bölüşümü bekliyor".
- Feed'i "app'ler arası sosyal olay akışı" olarak konumla (altyapı `feed` servisinde hazır).

### 7. B2B / Stüdyo = gelir motoru → önceliklendir
- Tüketici tarafı büyüme, **Stüdyo tarafı para**. Aynı ürünün (menü, kaşe kartı, etkinlik) iki yüzü olması zaten akıllıca.
- **Aksiyon:**
  - İşletme onboarding'ini akıcılaştır (`/dashboard` → işletme oluştur → app aç).
  - Net bir **fiyatlandırma/paket** ekle (landing'de `for-businesses` `pricingPlans` iskeleti var — canlıya bağla).
  - "Tutor Place" (CRM), "Dijital Menü", "Müdavim Kartı" en olgun B2B ürünler — bunları öne çıkar.
- Bu oturumda kurduğumuz **Stüdyo sekmesi + paket kartları + iletişim bottom-sheet'i** bunun ilk adımı; `STUDIO_CONTACT_URL` placeholder'ını gerçek kanala bağla.

### 8. Keşif/onboarding'i kişiselleştir
- İlk açılışta "neyle ilgileniyorsun?" → 3-4 app öner, gerisini gizle.
- 60 app'i herkese göstermek yerine **kişiye göre daralt.**

---

## SONRA (3 ay+) — Ölçek ve savunulabilirlik

### 9. AI asistanı ürünün beyni yap
- Kart/araç tabanlı mimari (36 app modülü) doğru ve nadir. Bir üst seviye:
  - Asistan **Bugün'ü yönetsin**: "planımı düzenle", "bu haftaki hedeflerim", "ev işlerini dağıt".
  - Cross-app tek giriş noktası → süper-app'in doğal "komuta satırı".

### 10. Platformu dışa aç (opsiyonel, uzun vade)
- Schema-per-service + per-app asistan modülü zaten **mini-program mimarisi**. İleride 3. parti/işletme app'lerine açılabilir (WeChat modeli).

### 11. Ölçüm & operasyon
- 56 servis küçük ekip için ağır. **App-bazlı retention/DAU paneli** kur (`admin` servisi var) — hangi app yaşıyor, hangisi ölü, veriyle karar ver.
- "Kill or invest" kararlarını hisle değil metrikle ver.

---

## Özet öncelik tablosu
| Öncelik | Öneri | Neden |
|---|---|---|
| 🔴 Şimdi | Kimlik netleştir + iptal app'leri ayıkla | Odak, keşif yükü |
| 🔴 Şimdi | Vazgeçilmez 3 app + Bugün widget'larını sertleştir | Retention |
| 🟡 Sırada | Akıllı bildirim + sosyal çapraz bağ | Yapışkanlık |
| 🟡 Sırada | B2B paket/fiyat + onboarding | **Gelir** |
| 🟢 Sonra | AI asistan = Bugün'ün beyni | Savunulabilirlik |
| 🟢 Sonra | Metrik paneli, kill-or-invest | Operasyon |

---

## Kapanış
En büyük risk **başarısızlık değil, dağılma**. Elinde harika bir motor ve gerçek bir süper-app tezi var. Bundan sonrası özellik eklemek değil — **birkaç app'i vazgeçilmez kılmak, gerisini onların etrafında hizalamak ve B2B'yi gelire çevirmek.**
