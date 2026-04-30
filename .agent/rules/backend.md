# Backend & Database Standards

## 1. Database Architecture (Supabase/PostgreSQL)

### 1.1. Schema Isolation
- Every independent service must have its own dedicated schema (e.g., `kiler`, `tournament`, `subcenter`).
- The `public` schema should only contain global tables like `users` or shared metadata.
- **KRİTİK**: Supabase Dashboard üzerinde yeni bir şema oluşturulduğunda, Encore veya API üzerinden erişilebilmesi için **Settings > API > Exposed schemas** listesine manuel olarak eklenmelidir. 
  - [API Settings Link](https://supabase.com/dashboard/project/nxtmjrmimcpudskzzqcr/integrations/data_api/settings)

### 1.2. Table Management
- **Root Table Definition**: Each service directory must contain a `table.sql` file that represents the **ideal/latest state** of the database structure for that service.
- **Migrations**: 
  - Sadece tablo yapısı değişiklikleri (tablo oluşturma, kolon ekleme/çıkarma vb.) için kullanılmalıdır.
  - Migration dosyaları `migrations/` klasöründe `01_description.up.sql` formatında olmalıdır.
  - **Kritik Kural**: Migrasyon dosyalarının içine asla RPC fonksiyonları (CREATE FUNCTION) yazılmamalıdır.

### 1.3. Function Management (RPC)
- **Location**: Tüm RPC fonksiyonları servis dizini altındaki `functions/` klasöründe tutulmalıdır.
- **Dosyalama**: Her fonksiyon, kendi ismini taşıyan bağımsız bir `.sql` dosyasında bulunmalıdır.
- **Logic Değişiklikleri**: Fonksiyonlardaki mantıksal değişiklikler migrasyon gerektirmez; doğrudan ilgili `.sql` dosyası üzerinden güncellenir.
- **Cleanup Requirement**: Her fonksiyon dosyası mutlaka `DROP FUNCTION IF EXISTS ...` ile başlamalıdır.
- **Schema Qualification**: Fonksiyonlar servis şemasında oluşturulmalı ve tablolara şema ismiyle (örn: `kiler.items`) referans vermelidir.

## 2. Backend Logic (Encore.dev)

### 2.1. RPC Integration
- Use `supabase.rpc("schema.function_name", { params })` to call database logic.
- Avoid complex business logic inside TypeScript if it can be handled more efficiently within a PostgreSQL function.

### 2.2. Table Access
- When direct table access is necessary, always specify the schema: `supabase.schema("service_name").from("table_name")`.

---

## Session Summary (Migration to Schema Architecture)
The following services have been successfully migrated to the dedicated schema + RPC architecture:
1. **Kiler**: `kiler` schema
2. **Tournament**: `tournament` schema
3. **ITU Yemekhane**: `itu_yemekhane` schema
4. **Subcenter**: `subcenter` schema
5. **Recipe**: `recipe` schema

All direct `public` table accesses have been replaced with schema-qualified RPC calls.
