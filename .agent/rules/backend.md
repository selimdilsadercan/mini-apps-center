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


### 1.2. Migration & Database Management
- **Tables and Schema Definition**: Her servisin veritabanı şeması ve tabloları, `migrations/tables.up.sql` dosyası içerisinde tanımlanmalıdır. Bu dosya, servisin güncel veritabanı şema ve tablo yapısını gösteren ana dosyadır.
  - **Tables Header Rule**: `tables.up.sql` dosyasının en üstünde mutlaka "LATEST MIGRATIONS & STRUCTURAL UPDATES" şablonu (yeni kolon ekleme, veri taşıma vb. geçici migrasyonlar için) ve altında "IDEAL STATE (Current Schema)" şablonu (tabloların en güncel ideal tanımı için) bulunmalıdır.
- **Functions (RPC) Definition**: Servise ait tüm PostgreSQL fonksiyonları (RPC) tek bir dosya altında, `migrations/functions.up.sql` içinde tutulmalıdır. Servis kökünde ayrı bir `functions/` dizini veya ayrı SQL dosyaları **kullanılmamalıdır**.
  - **Functions Header Rule**: `functions.up.sql` dosyasının en üstünde mutlaka `-- FUNCTIONS` ile başlayan ve altında sırayla tanımlı tüm fonksiyonları (örn: `-- 1. schema.func_name`) listeleyen bir index bulunmalıdır.
- **Logic & Function Updates**: Fonksiyonlardaki mantıksal değişiklikler doğrudan `migrations/functions.up.sql` dosyasındaki ilgili fonksiyon güncellenerek (veya `DROP` / `CREATE OR REPLACE` yardımıyla) yapılır. Mantıksal fonksiyon değişiklikleri için ayrı bir migrasyon dosyası oluşturulmaz.
- **Initialization**: Yeni bir servis oluşturulurken, `migrations/` klasörü altında mutlaka hem `tables.up.sql` hem de `functions.up.sql` dosyaları oluşturulmalı ve veritabanı yapısı bu dosyalar aracılığıyla kurulmalıdır.
- **Grants & Permissions**: `tables.up.sql` dosyasının sonunda şema, tablolar ve diziler için `anon`, `authenticated`, `service_role` rollerine yetkiler (`GRANT`) mutlaka verilmelidir.
- **Function Cleanup**: `functions.up.sql` dosyasındaki her fonksiyon tanımından önce `DROP FUNCTION IF EXISTS [şema].[fonksiyon_adı]([parametre_tipleri])` ifadesi yer almalıdır.
- **Schema Qualification**: Tüm SQL sorguları ve fonksiyon tanımları ilgili servis şeması (örn: `budget.projects`, `budget.get_user_projects`) ile nitelenmelidir.

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

## 4. Developer Workflow & Client Generation
- **DO NOT RUN `bun run generate` OR `encore gen`**: The user has a background development client watcher configured. The AI assistant does not need to manually trigger typings compilation or client regenerations during implementation steps.

