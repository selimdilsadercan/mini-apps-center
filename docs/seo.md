# Everything SEO Stratejisi ve İyileştirmeler

Everything platformunun Google arama sonuçlarında üst sıralarda yer alması ve "Zengin Sonuçlar" (Rich Results) ile görünmesi için uygulanan stratejiler:

## 1. Statik Sayfa Yapısı (Prerendering)
- **Problem:** Dinamik rotalar (`[appId]`) botlar tarafından her zaman verimli taranmayabilir.
- **Çözüm:** Her uygulama için `/directory/{app-id}` yolunda fiziksel `page.tsx` dosyaları üretildi. Bu, Google'ın her uygulamayı bağımsız bir sayfa olarak görmesini sağlar.

## 2. İçerik Yönetimi (Markdown Tabanlı)
- **Uygulama:** `frontend/content/apps-seo/` klasörü altında her uygulama için özel `.md` dosyaları oluşturuldu.
- **Detay:** Bu dosyalar üzerinden her uygulama için:
    - Özgün Meta Açıklamaları
    - Hedef Anahtar Kelimeler
    - Detaylı "Nasıl Kullanılır" ve "Özellikler" metinleri yönetilir.
- **Fayda:** Google, "kopya içerik" yerine her uygulama için dolu ve özgün bir sayfa görür.

## 3. Yapılandırılmış Veri (JSON-LD / Schema.org)
Her tanıtım sayfasında botlara teknik bilgi veren 3 ana schema kullanılmaktadır:
- **SoftwareApplication:** Uygulamanın adı, kategorisi, işletim sistemi ve ücretsiz olduğu bilgisini verir.
- **BreadcrumbList:** Google sonuçlarında `Everything > Uygulamalar > {Uygulama}` şeklinde hiyerarşik link yapısı sağlar.
- **FAQPage:** Sıkça sorulan soruların Google sonuç sayfasında doğrudan açılır pencere olarak görünmesini sağlar (Sitelinks görünümü için kritik).

## 4. Site Haritası (Sitemap) ve İndeksleme
- **Dinamik Sitemap:** `frontend/app/sitemap.ts` dosyası, `lib/apps.ts` içindeki tüm yayınlanmış uygulamaları otomatik olarak site haritasına ekler.
- **Önceliklendirme:** Directory sayfalarına yüksek öncelik (`0.8` - `0.9`) verilerek botların bu sayfaları daha sık taraması sağlanır.

## 5. Sosyal Paylaşım ve Görünürlük
- **OpenGraph & Twitter Cards:** Her sayfa için dinamik `og:title`, `og:description` ve `og:image` etiketleri ayarlanmıştır. Paylaşımlarda zengin önizleme görünür.
- **Favicon & Icons:** Google'ın site adının yanında logo göstermesi için gerekli tüm ikon setleri tanımlıdır.

## 6. İç Linkleme (Internal Linking)
- **Katalog Yapısı:** `/directory` sayfasında uygulamalar kategorize edilerek (Pratik Araçlar, Şehrini Keşfet vb.) semantik bir ağ oluşturulmuştur.
- **Header Navigasyonu:** Aktif sayfanın belirginleştirilmesi ve her sayfadan kataloğa kolay dönüş linkleri botların siteyi daha derinlemesine taramasına yardımcı olur.

## 7. Gelecek Önerileri / Yapılması Gerekenler (Backlog)

Sitenin otoritesini ve sıralamasını daha da artırmak için şu adımlar atılabilir:

### 1. Şehir Bazlı Sayfalar (Local SEO)
- **Fikir:** `/maraş/sinema-seanslari` veya `/istanbul/konser-takvimi` gibi lokasyon bazlı sayfalar oluşturmak.
- **Neden:** İnsanlar genellikle şehir ismiyle arama yapar. Bu sayfalar yerel aramalarda doğrudan üst sıraya çıkmamızı sağlar.

### 2. Blog ve Rehber İçerikleri
- **Fikir:** `content/blog` klasörü oluşturup "Öğrenciler için En İyi 5 PDF Aracı" veya "Kahramanmaraş'ta Hafta Sonu Gidilecek 3 Mekan" gibi yazılar yazmak.
- **Neden:** Uzun formlu içerikler (800+ kelime) Google'ın siteyi o konuda "otorite" olarak görmesini sağlar.

### 3. Uygulama İçi Görseller (Screenshots)
- **Fikir:** Her uygulamanın tanıtım sayfasına (intro page) o uygulamanın içinden 1-2 gerçek ekran görüntüsü eklemek.
- **Neden:** Google Görseller üzerinden trafik çekmemizi sağlar ve kullanıcı güvenini artırır.

### 4. Backlink Çalışması
- **Fikir:** Yerel haber sitelerinde veya teknoloji bloglarında Everything'den bahsettirmek.
- **Neden:** Dışarıdan gelen kaliteli linkler (backlink), sitenin "Domain Authority" değerini yükseltir.

### 5. Google Business Profili
- **Fikir:** Everything için bir Google İşletme profili oluşturup katalog sayfasına link vermek.
- **Neden:** Google Haritalar üzerinden doğrudan trafik çekilebilir.

### 6. Alt Etiketleri (Alt Tags)
- **Fikir:** İkon ve varsa görsellerin tamamına anlamlı `alt` etiketleri eklemek (Örn: "Everything PDF Düzenleme Aracı İkonu").
- **Neden:** Görme engelli kullanıcılar ve botlar için sayfanın neyle ilgili olduğunu netleştirir.
