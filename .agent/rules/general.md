# Proje Genel Kuralları ve Geliştirme Standartları

Bu proje, bir "SuperApp" (Everything) ekosistemi olarak kurgulanmıştır. Her yeni özellik veya uygulama aşağıdaki standartlara uymak zorundadır.

## 🚀 Yeni Uygulama Ekleme (Mini-App Yapısı)

### 1. Dosya ve Klasör Düzeni
- **Frontend (UI):** `frontend/app/apps/[app-id]/`
- **Backend (Service):** `backend/[app-id]/`
- **Veritabanı (SQL):** `backend/[app-id]/sql/`

### 2. İsimlendirme Konvansiyonu
- **ID:** Her zaman `kebab-case` (Örn: `itu-yemekhane`, `catan-bot`).
- **Tablo İsimleri:** Uygulama ID'si ile başlamalıdır: `[app-id]_items`.
- **SQL Dosyaları:** Her fonksiyon kendi dosyasında olmalıdır: `[app-id]_[fonksiyon_adı].sql`.
- **RPC Fonksiyonları:** Supabase'de `[app-id]_get_data` gibi isimlendirilmelidir.

### 3. Teknoloji ve Tip Güvenliği
- **Backend:** Encore.ts kullanılır.
- **Client Üretimi:** Backend değişikliklerinden sonra mutlaka `backend/` dizininde `npm run generate` çalıştırılmalıdır.
- **Frontend Import:** Backend dosyalarından doğrudan import **yasaktır**. Tüm tipler `@/lib/client` üzerinden alınmalıdır.

### 4. Tasarım ve UI/UX
- **İkonlar:** Sadece `Phosphor Icons` kullanılır.
- **Animasyonlar:** Pürüzsüz geçişler için `Framer Motion` zorunludur.
- **Dashboard:** Yeni uygulamalar `frontend/lib/apps.ts` dosyasına kaydedilerek ana ekrana eklenir.

---
*Not: Bu kurallar projenin sürdürülebilirliği ve monorepo yapısının temiz kalması için kritiktir.*
