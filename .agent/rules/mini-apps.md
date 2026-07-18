---
trigger: always_on
---

# Mini-App Development Rules (SuperApp Ecosystem)

This guide documents the mandatory conventions and structure for adding new applications to the SuperApp (mini-apps-center).

## 📂 Folder Structure

| Layer | Path | Description |
| :--- | :--- | :--- |
| **Frontend UI** | `frontend/app/apps/[app-id]/` | Next.js Page components and local assets. |
| **Backend Service** | `backend/[app-id]/` | Encore.ts service logic and endpoint definitions. |
| **Database (SQL)** | `backend/[app-id]/table.sql/` | Supabase table definitions and RPC functions. |

## 🏷️ Naming Conventions

### 1. Unique ID
- Use **kebab-case** for the application ID (e.g., `morning-notifications`, `kiler`).
- This ID must be consistent across folder names, hrefs, and backend service names.

### 2. Database & SQL
- **Schema Isolation:** Every service must have its own dedicated schema named after the app ID (e.g., `kiler`, `map_tracker`).
- **SQL File Organization:**
    - `table.sql`: Contains the **root/ideal state** of the database structure for that service.
    - `migrations/`: Contains migration files. `01_init.up.sql` should include both tables and all initial RPC functions.
    - `functions/`: Each RPC function must reside in its own file in this folder for easy updates without migrations.
- **RPC Cleanup:** Every function SQL file **MUST** start with `DROP FUNCTION IF EXISTS [schema].[function_name]`.
- **Naming:** Functions and tables should NOT use prefixes if they are inside a dedicated schema, but must be schema-qualified in calls.

### 3. Backend (Encore.ts)
- Always create a dedicated `encore.service.ts` in the service root.
- Use explicit Request/Response interfaces for every API endpoint.
- Keep business logic inside the service files, using Supabase RPC for data layer only.

## 🌉 Frontend-Backend Integration

### 🛠️ Type Safety
- **Note:** The frontend client is automatically updated via a watcher when backend changes occur. No manual `npm run generate` is required during development.
- **Rule:** NEVER import types directly from `backend/` in frontend code. 
- **Usage:** Always import types and the service client from `@/lib/client`.
    - *Example:* `import { kiler } from "@/lib/client";`

### 🚀 Frontend Client Initialization
- Initialize the backend client within the page component using `new Client(Local)`.
- Use the generated namespace for type safety.
    - *Example:* 
      ```tsx
      import Client, { movies_this_year, Local } from "@/lib/client";
      const client = new Client(Local);
      ```

### 🚀 App Registration
- Register new apps in `frontend/lib/apps.ts`.
- Set `isImplemented: true` only when the initial feature set is ready.
- Use **Phosphor Icons** and descriptive, localized names.
- **Subdomain Configuration:**
    - Every new app must have a unique `subdomain` field in `frontend/lib/apps.ts`.
    - This subdomain must also be registered in `frontend/proxy.ts` (Next.js Proxy/Middleware) in the `SUBDOMAIN_ROUTES` map to ensure correct routing.
    - The exported function in `frontend/proxy.ts` must be named `proxy`.

### 🏠 Home Page Integration (`frontend/app/home/page.tsx`)
Yeni bir mini-app sadece `apps.ts`'e eklenmekle bitmez — ana sayfada görünmesi için ilgili sekmeye de eklenmelidir.

Ana sayfa sekmeleri ve hangi `category` değerinin nereye düştüğü:

| Sekme (`activeTab`) | Bölüm adı | `apps.ts` category | `home/page.tsx` değişkeni |
| :--- | :--- | :--- | :--- |
| `discover` | Pratik Araçlar | `Pratik Araçlar` | `toolsApps` |
| `explore` | Şehrini Keşfet | `Şehrini Keşfet` | `exploreApps` |
| `hobby` | Hobi | `Eğlence & Hobi` | `hobbyApps` |
| `wallet` | Cüzdan | `Finans & Tasarruf` | `walletApps` |
| `life` | Yaşam | `Kampüslülere Özel` | `lifeApps` |

**Zorunlu adımlar:**
1. `frontend/lib/apps.ts` içinde uygulamanın `category` alanını doğru sekmeye göre ayarla.
2. Sıralama önemliyse `home/page.tsx` içindeki ilgili `order` dizisine `app.id` ekle.
    - Örnek (Yaşam sekmesi): `const order = ["eksik-var", "ev-isleri", "rutinler", "meal-planner", "gym"];`
3. `frontend/locales/tr/common.json` ve `frontend/locales/en/common.json` dosyalarına `apps.[app-id].name` ve `apps.[app-id].description` ekle.

**Not:** `lifeApps` gibi bazı listeler yalnızca belirli `category` değerlerini filtreler. Yanlış kategoride kayıtlı bir uygulama ana sayfada hiç görünmez.

### 🔄 Data Fetching & Loading States
- **Authentication:** Many apps use `useUser()` from Clerk.
- **Rule:** Always ensure `loading` states are resolved (set to `false`) even if the user is not logged in. This prevents infinite spinners for anonymous users.
- **Pattern:**
  ```tsx
  useEffect(() => {
    if (isUserLoaded) {
      fetchData();
    }
  }, [isUserLoaded, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!user) {
        // Clear data or set defaults for anonymous users
        setItems([]); 
        return;
      }
      // Fetch data for authenticated user
    } finally {
      setLoading(false);
    }
  };
  ```

## ✨ UI/UX Standards

> **Önemli:** Eskiden her uygulama için farklı bir görsel dil hedefleniyordu. Artık tüm mini-app'ler **aynı tasarım sistemini** paylaşmalıdır. Referans uygulamalar: **Eksik Var**, **Meal Planner** (`RecipeShell`), **Ev İşleri** (`EvIsleriShell`).

### Ortak Sayfa Yapısı
- Arka plan: `bg-[#FAF9F7]`
- İçerik genişliği: `max-w-xl mx-auto`
- Ana alan: `px-4 pt-4 pb-8` (veya `pb-32` sabit alt aksiyon varsa)
- Kartlar: `bg-white rounded-2xl border border-gray-100 shadow-sm`
- Vurgu rengi: `apps.ts` içindeki `color` alanı — buton, ikon ve başlık vurgularında tutarlı kullan

### Header (Zorunlu Kalıp)
Her mini-app'in header'ı aynı iskelete sahip olmalıdır. Özel/tek seferlik header tasarımları yapma.

```tsx
<header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
  <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
    <div className="flex items-center gap-2">
      {/* Geri butonu */}
      <button
        onClick={() => { window.location.href = getAppRootUrl(); }}
        className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
      >
        <CaretLeft size={14} weight="bold" className="text-[ACCENT]" />
      </button>

      {/* Başlık: ikon + uppercase, bir kelime accent renkte */}
      <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
        <AppIcon size={18} weight="fill" className="text-[ACCENT] shrink-0" />
        <span className="truncate">
          Kelime <span className="text-[ACCENT]">Vurgu</span>
        </span>
      </h1>

      {/* Sağ aksiyonlar (opsiyonel): w-8 h-8 rounded-lg border border-gray-200/60 */}
    </div>

    {/* Sekmeler / araç çubuğu (opsiyonel) */}
    <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100 mt-2.5">
      {/* segment butonları: text-[10px] font-black uppercase */}
    </div>
  </div>
</header>
```

**Header kuralları:**
- Geri butonu her zaman sol üstte, `getAppRootUrl()` ile hub'a döner.
- Başlık: `font-black uppercase tracking-tight`, Phosphor ikon `weight="fill"`, accent renk uygulaması.
- Sağdaki aksiyon butonları: `w-8 h-8 rounded-lg border border-gray-200/60` — header yüksekliğini bozma.
- Sekmeler varsa header içinde kalır; sayfa gövdesine taşınmaz.
- Mümkünse mevcut shell bileşenlerini kopyala veya genişlet: `EvIsleriShell`, `RecipeShell`.

### Shell Bileşeni Önerisi
Çok sayfalı uygulamalarda `components/[AppName]Shell.tsx` oluştur ve tüm alt sayfalarda kullan. Header mantığını tek yerde tut.

### Etkileşim & Geri Bildirim
- `alert()` / `confirm()` kullanma → `useConfirmDialog` kullan.
- Bottom sheet / drawer: `vaul` Drawer veya projedeki mevcut drawer bileşenleri.
- Toast: `react-hot-toast`.

### Navigation
- Every mini-app must have a "Back" button that redirects to the user's personal hub.
- **Rule:** Use `window.location.href = getAppRootUrl()` for the back button. Import `getAppRootUrl` from `@/lib/apps`.
- Do NOT use `router.back()` or `getRootHomeUrl()` as they might not work correctly across subdomains.

### Not Found Page
- A global `frontend/app/not-found.tsx` is implemented to redirect any invalid paths back to the root domain's home page.

## 🌍 Localization (i18n)
- **Cross-Subdomain Persistence:** 
    - Language selection (locale) is shared across all subdomains (e.g., `my.allminiapps.com`, `tasarruf.allminiapps.com`).
    - This is achieved using a cookie named `everything_locale` scoped to the root domain (`.allminiapps.com`).
    - **Usage:** Always use the `useLanguage` hook and `LanguageProvider` to manage and access the current locale.
    - **Implementation Detail:** The `setLocale` function in `LanguageContext.tsx` automatically handles setting this cross-subdomain cookie.

## 🎨 Styling & Dark Mode Standards
- **Dark Mode Support:** All mini-apps must support dark mode. Avoid using hardcoded light/dark colors (e.g. `bg-white`, `bg-[#FAF9F7]`, `text-gray-900`, `border-gray-200`). Instead, use the project's predefined CSS variables:
  - Background: `bg-app-bg text-app-text`
  - Cards & Surface elements: `bg-app-surface border border-app-border text-app-text`
  - Interactive/tab tracks: `bg-app-tab-track border border-app-border`
  - Active tabs: `bg-app-tab-active`
  - Muted text: `text-app-muted`
- **Tab Layout Width:** Segmented control/tab tracks in headers must NOT be full width (`w-full` / `max-w-none`). Use `inline-flex` without `w-full` so they shrink to fit the content, keeping them cohesive and centered/left-aligned as seen in other mini-apps.

