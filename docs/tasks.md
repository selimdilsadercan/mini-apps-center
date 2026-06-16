# 🧠 Mini Apps Center - Görev ve Durum Raporu (Tasks)

Bu dosya, platformun temel (core) özelliklerinin ve tüm mini uygulamaların geliştirme durumlarını tek bir yerden takip etmek amacıyla oluşturulmuştur.

## 🛠️ Genel Altyapı & Yapılacaklar (Global Tasks)

- [ ] Giriş yapma (Login) ekranı güncellemesi
- [ ] Chat-like (sohbet arayüzü tarzında) interaktif onboarding süreci
- [ ] Uygulamalar içerisindeki giriş (Auth/Clerk) modallarının güncellenmesi
- [ ] **Bildirimler (Push):** Backend altyapısı ve frontend hook hazır. Global layout entegrasyonu ve izin yönetimi cilası bekliyor.
- [ ] **Admin Paneli:** Uygulama listeleme ve temel yetki kontrolü var. Yeni uygulama ekleme formu ve kullanıcı yönetimi gerekiyor.
- [ ] **Mobil Uyumluluk:** Sayfalar responsive tasarlandı. Capacitor/Native özelinde derinlemesine testler yapılacak.
- [ ] **Performans:** Sayfa yükleme hızları iyi durumda. Görsel optimizasyonu ve bundle boyutu küçültme bekliyor.
- [ ] **Analitik & Takip:** Google Analytics ve Search Console derin entegrasyonu.
- [ ] **Geri Bildirim Sistemi:** Kullanıcıların hata bildirmesi veya uygulama önerisinde bulunması.
- [ ] **Gelişmiş Paylaşım:** Uygulama içi içeriklerin (skorlar, listeler vb.) sosyal paylaşımı.
- [x] **Kimlik Doğrulama (Auth):** Clerk entegrasyonu, Giriş/Kayıt sayfaları, Oturum yönetimi.
- [x] **Ana Sayfa (Hub):** Sürükle-bırak uygulama düzenleme, uygulama kaldırma, kişiselleştirilmiş grid.
- [x] **Keşfet (Discover):** Kategori bazlı uygulama listeleme, arama, uygulama ekleme (Get).
- [x] **Profil & Ayarlar:** Kullanıcı istatistikleri, dil seçimi (TR/EN), çıkış yapma.
- [x] **Sosyal Akış (Feed):** Arkadaş hareketlerini (aktivite, mekan vb.) görme ve etkileşim.
- [x] **Arkadaşlık Sistemi:** Kullanıcı arama (exact match), istek gönderme/kabul/ret, arkadaş listesi.
- [x] **AI Assistant:** Sohbet geçmişi, kalıcı depolama, akıllı uygulama kartları önerisi.
- [x] **Dil Desteği (i18n):** Tüm core sayfalarda tam TR/EN desteği.
- [x] **Giriş Sayfası (Landing):** Modern ve etkileyici karşılama sayfası.
- [x] **SEO & Metadata:** Sitemap, Robots.txt, Meta etiketleri ve JSON-LD yapılandırması.
- [x] **Deep Linking:** Uygulamalara ve içeriklere doğrudan URL üzerinden erişim.

---

## 📱 Tüm Uygulamalar

### Suggest

- [x] iTunes API (Şarkı) entegrasyonu
- [x] Arkadaş seçimi ve paylaşım altyapısı
- [x] Modern kart tasarımları
- [ ] Film API entegrasyonu
- [ ] Kitap API entegrasyonu
- [ ] Video/YouTube API entegrasyonu

### Card Game Codex (İskambil)

- [x] Geniş oyun arşivi
- [x] Arama ve filtreleme
- [x] Favorilere ekleme sistemi
- [x] Detaylı kural sayfaları
- [ ] Açıklamalardaki tekrar eden metinlerin temizlenmesi
- [ ] BGG benzeri puanlama sistemi
- [ ] "Kaç kişi için en iyi" göstergesi
- [ ] AKA (bilinen diğer adları) alanı
- [ ] Kurallara göre arama yapabilme özelliği

### Workplaces

- [x] Harita ve liste görünümü
- [x] Google Maps entegrasyonu
- [x] Mekan detayları ve notlar
- [x] Favori mekanlar sistemi

### SubCenter

- [x] Popüler marka kütüphanesi
- [x] Otomatik döviz kuru hesaplama
- [x] Yenileme tarihi takibi ve bildirimleri

### Memedex

- [x] Meme arşivi ve kategoriler
- [x] Trend takibi
- [x] Giphy entegrasyonu
- [ ] Link kopyalama ve paylaşım
- [ ] Giphy'e Memedex özel memelerinin yüklenmesi
- [ ] Topluluk oylama (Community vote) özellikleri
- [ ] Memedex Instagram hesabı yönetimi

### YouTube Discover

- [x] Kategori bazlı seri keşfi
- [x] Modern ve akıcı UI
- [x] Detay sayfaları ve video önizleme

### İTÜ Yemekhane

- [x] Görsel yemek tepsisi tasarımı
- [x] Günlük kalori takibi
- [x] Bildirim ayarları ve hatırlatıcılar

### Melt & Work (Pomodoro)

- [x] Buz erime animasyonlu zamanlayıcı
- [x] Sesli uyarılar ve modlar
- [x] Kişiselleştirilebilir ayarlar

### Icon Set Guide

- [x] Açık kaynak ikon setleri arşivi
- [x] Gerçek UI üzerinde anlık karşılaştırma

### Daily Weather

- [x] Hava durumu verisi çekme
- [x] Bildirim altyapısı
- [ ] UI cilası ve son dokunuşlar
- [ ] Kapsamlı test süreci

### Tutor Place

- [x] Öğrenci kayıt sistemi
- [x] Ödeme takip takip tabloları
- [ ] Kullanıcı akış testleri
- [ ] Raporlama özellikleri

### PDF Tools

- [x] Sayfa silme özelliği
- [x] Sayfa sıralama arayüzü
- [ ] PDF birleştirme aracı
- [ ] PDF sıkıştırma özelliği

### Sticker Maker

- [x] Tasarım arayüzü
- [x] Önizleme modu
- [ ] WhatsApp dışa aktarma (export) testi
- [ ] Paket oluşturma sistemi

### Ne Yapsak? (Kim Gelir)

- [x] Aktivite daveti oluşturma
- [x] Hızlı anket sistemi
- [ ] UI/UX iyileştirmeleri
- [ ] Katılımcı yönetimi detayları

### Tasket

- [x] Not ve görev yönetimi
- [x] Sepet (bucket) mantığı
- [ ] Cihazlar arası senkronizasyon kontrolü
- [ ] Hatırlatıcı bildirimleri

### Hobby Center

- [x] Hobi yol haritaları altyapısı
- [ ] İçerik girişi ve kaynak linkleri
- [ ] İlerleme takibi sistemi

### Eşlikçi (Board Game Companion)

- [x] Masa oyunu puan takibi
- [x] Yardımcı araçlar (zar, sayaç vb.)
- [ ] Oyun bazlı özel şablonlar

### Turnuva Merkezi

- [x] Lig usulü turnuva yönetimi
- [x] Eleme usulü (bracket) sistemi
- [ ] UI cilası ve animasyonlar

### Board Game Clubs

- [x] Kulüp kütüphane yönetimi altyapısı
- [ ] Veri girişi ve oyun listeleri

### Film Graph

- [x] Filmler arası bağlantı görselleştirme altyapısı
- [ ] Veri seti genişletme (TMDB entegrasyonu)

### Movies This Year

- [x] Yılın popüler filmleri listesi tasarımı
- [ ] Otomatik API entegrasyonu

### Kiler

- [x] Ev stok yönetimi arayüzü
- [x] Son kullanma tarihi takibi
- [ ] Akıllı bildirim sistemi

### Harita Takip

- [x] Google Maps listeleri altyapısı
- [ ] Liste içe aktarma (import) testleri

### Meal Planner

- [x] Haftalık yemek planlama takvimi
- [ ] Tarif kütüphanesi entegrasyonu

### Ne Yapsak? (Stop Scroll)

- [x] Aktivite öneri motoru
- [ ] İçerik zenginleştirme (yeni aktiviteler)

### My Concert List

- [x] Konser kayıt sistemi
- [ ] UI iyileştirmesi ve bilet görseli ekleme

### Campus Concerts

- [x] Etkinlik takibi altyapısı
- [ ] Veri kaynağı bağlantısı (Kampüs API)

### One Day City Guide

- [x] Şehir bazlı rota tasarımı
- [ ] İçerik girişi (yeni şehirler)

### Tasarruf

- [x] Harcama azaltma meydan okumaları
- [ ] Oyunlaştırma (gamification) öğeleri

### Penalty Jar

- [x] Arkadaş grubu ceza takip sistemi
- [ ] UI cilası ve geçmiş kayıtlar

### ChocolateDB

- [x] Çikolata arşivi altyapısı
- [x] Veri girişi ve kullanıcı puanlamaları

## 🔴 İptal Edilenler / Gizli (Cancelled)

Sadece admin tarafından görülebilen, yayına alınmayacak uygulamalar.

### Meme Sorts

- [ ] Algoritma görselleştirme aracı

### Catan Bot

- [ ] Catan oyunu yardımcı aracı

---

*Son Güncelleme: 12 Haziran 2026*