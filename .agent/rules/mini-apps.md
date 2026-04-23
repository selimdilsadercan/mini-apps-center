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
- **Table Names:** Must be prefixed with the app ID: `[app-id]_items` (e.g., `kiler_items`).
- **SQL File Organization:**
    - `[app-id].sql`: Contains ONLY table definitions and indexes.
    - `[app-id]_[function_name].sql`: Each RPC function must reside in its own file named after the function.
- **Function Names:** Supabase RPC functions must be prefixed with the app ID: `[app-id]_get_items`.

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

## ✨ UI/UX Standards
- use tailwind always
