---
trigger: always_on
---

backend yapısı sürekli değişiyor o yüzden burda yazanların yanında mevcut backend klasörlerini inceleyip son yapma şekillerimize bakmanı istiyorum

# Backend & Database Standards

## 1. Database Architecture (Supabase/PostgreSQL)

### 1.1. Schema Isolation
- Every independent service must have its own dedicated schema (e.g., `kiler`, `tournament`, `subcenter`).
- The `public` schema should only contain global tables like `users` or shared metadata.
- **KRİTİK**: Supabase Dashboard üzerinde yeni bir şema oluşturulduğunda, Encore veya API üzerinden erişilebilmesi için **Settings > API > Exposed schemas** listesine manuel olarak eklenmelidir. 
  - [API Settings Link](https://supabase.com/dashboard/project/nxtmjrmimcpudskzzqcr/integrations/data_api/settings)
- **Schema & Table Permissions (Grants)**: Yeni şema ve tablolar oluşturulurken schema kullanım yetkisi (`USAGE`), tüm tablolar, sekanslar ve fonksiyonlar için tüm yetkiler (`ALL`) `anon`, `authenticated`, `service_role` rollerine atanmalı ve varsayılan yetkiler (`ALTER DEFAULT PRIVILEGES`) yapılandırılmalıdır.
  - Örnek:
    ```sql
    GRANT USAGE ON SCHEMA şema_adı TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA şema_adı TO anon, authenticated, service_role;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA şema_adı TO anon, authenticated, service_role;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA şema_adı TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA şema_adı GRANT ALL ON TABLES TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA şema_adı GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA şema_adı GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
    ```


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

## 3. AI Assistant Integration (assistant.ts)

### 3.1. Tool Call Architecture
- Every service must contain a local `assistant.ts` file that defines its AI assistant tools and executors.
- **MANDATORY RULE**: Executors inside `assistant.ts` MUST NOT execute raw database queries or direct Supabase RPC functions. Instead, they must call the service's own API endpoints.
- **Cross-Service Clients**: To trigger these API calls through Encore's service mesh (and make them visible in the Encore dashboard tracing logs), you must import the service client from `~encore/clients`.
  - *Example:*
    ```typescript
    import { kiler } from "~encore/clients";
    
    // Inside executors:
    list_items: async ({ userId }) => {
      const res = await kiler.getItems({ userId });
      return res.items;
    }
    ```
- All parameter parsing from LLM args (which are `Record<string, unknown>`) should be done using helper functions in `../lib/assistant-params` (e.g. `requireString`, `optionalString`, `requireNumber`, `optionalNumber`).

---

## Session Summary (Migration to Schema Architecture)
The following services have been successfully migrated to the dedicated schema + RPC architecture:
1. **Kiler**: `kiler` schema
2. **Tournament**: `tournament` schema
3. **ITU Yemekhane**: `itu_yemekhane` schema
4. **Subcenter**: `subcenter` schema
5. **Recipe**: `recipe` schema

All direct `public` table accesses have been replaced with schema-qualified RPC calls.
