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
- use tailwind always
