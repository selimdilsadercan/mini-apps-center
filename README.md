# Everyday Hub 🚀
A collection of high-fidelity, modular mini-apps built with **Next.js** and **Encore.ts**.

This project is a monorepo containing various personal utility applications, all connected to a centralized **Supabase** backend and secured with **Clerk** authentication.

---

## 📱 Mini-Apps Included

### 💳 Subscription Center
*   **Focus:** Tracking recurring monthly and yearly expenses.
*   **UI:** Clean, pastel-accented "chill" design with smooth Framer Motion transitions.
*   **Features:** Quick presets for popular services (Netflix, Spotify, etc.), manual add/delete, and spending analysis.

### 🍱 Recipe Planner
*   **Focus:** Managing meal plans and ingredients.
*   **Features:** AI-ready recipe parsing, detailed ingredient lists, and instructions.

### 🎭 Meme Sorts
*   **Focus:** Visualizing sorting algorithms with a cinematic twist.
*   **Features:** Cinematic "Thanos Snap" particle effect for elements that disappear during sort/rearrange.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Phosphor Icons
- **Auth:** Clerk

### Backend
- **Framework:** [Encore.ts](https://encore.dev) (Type-safe distributed systems)
- **Database:** Supabase (PostgreSQL)
- **Architecture:** Modular Service Pattern (Identity, Recipe, Subcenter)

---

## 🚀 Getting Started

### 1. Installation
Run the following command in the root directory to install dependencies:
```bash
bun install
```

### 2. Configure Environment
Set up your secrets for the backend:
```bash
# Configure Supabase
encore secret set SupabaseUrl
encore secret set SupabaseAnonKey

# Configure Clerk (if needed by services)
encore secret set ClerkPublishableKey
```

### 3. Run Locally
Start the development environment (both Frontend and Backend):
```bash
# Terminal 1: Run Frontend
bun run dev

# Terminal 2: Run Encore Backend
bun run encore
```

---

## 🏗 Backend Architecture

The backend follows a strict **Service-Oriented Architecture (SOA)**. Each application has its own dedicated service folder under `backend/`.

### Naming Conventions (Strict Rules)
To ensure scalability and prevent collisions in Supabase, we follow these naming patterns:
- **Tables:** `{appname}_item`, `{appname}_metadata` (e.g., `subcenter_items`)
- **RPC Functions:** `{appname}_create_item`, `{appname}_get_user_items`

---

## 📂 Project Structure
```text
everything/
├── backend/            # Encore.ts services
│   ├── identity/       # User management
│   ├── recipe/         # Recipe planner logic
│   ├── subcenter/      # Subscription center logic
│   └── lib/            # Common database utilities
├── frontend/           # Next.js application
│   ├── app/            # App router pages
│   ├── components/     # Shared UI components
│   └── lib/            # API clients & constants
└── package.json        # Monorepo scripts
```

---

*Built with ❤️ by EveryDay Team*
