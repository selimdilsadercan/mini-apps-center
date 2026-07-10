# Scripts

Monorepo komutları burada toplanır. `package.json` dosyaları yalnızca ince giriş noktalarıdır.

## Hızlı kullanım (root)

```bash
bun run dev      # Geliştirme ortamı
bun run build    # Frontend production build
bun run secret   # Encore secret ayarla
bun run ios      # iOS build (macOS)
bun run ota      # OTA build
bun run mobile   # Debug APK pipeline
bun run apk      # Sadece Gradle APK/AAB
```

## Hızlı kullanım (frontend/)

Root ile aynı script'lere gider; `frontend/` içinden çalıştırmak için:

```bash
cd frontend
bun run build
bun run mobile
# ...
```

## Hızlı kullanım (backend/)

```bash
cd backend
bun run dev              # Encore API
bun run generate         # Client codegen
bun run generate:watch   # Otomatik codegen
bun run test             # Vitest
bun run clean            # node_modules + .encore temizle
```

## Klasör yapısı

```
docs/scripts/
├── README.md
├── dev.ts                 # Ana geliştirme orchestrator
├── backend/               # Backend / Encore script'leri
│   ├── dev.ts
│   ├── test.ts
│   ├── generate.ts
│   ├── generate-watch.ts
│   ├── clean.ts
│   └── secret.ts
├── frontend/              # Frontend / Capacitor script'leri
│   ├── build.ts
│   ├── ios.ts
│   ├── mobile.ts
│   ├── store.ts
│   ├── ota.ts
│   ├── sync.ts
│   ├── apk.ts
│   ├── aab.ts
│   ├── open-apk.ts
│   ├── open-aab.ts
│   ├── clean-android.ts
│   └── increment-version.ts
└── lib/
    ├── root.ts
    ├── backend.ts
    ├── frontend.ts
    ├── exec.ts
    ├── platform.ts
    ├── kill-ports.ts
    ├── run.ts
    └── capacitor-build.ts
```

## Root komutları

### `dev.ts` → `bun run dev`

1. 5000 ve 8000 portlarını temizler
2. Paralel süreçler:
   - **frontend** — Next.js (`http://localhost:5000`)
   - **encore** — Backend API (`http://localhost:8000`)
   - **generate** — 3 sn sonra client codegen watcher

### `secret.ts` → `bun run secret`

Encore secret tanımlama (`backend/secret.ts`).

## Backend komutları (`docs/scripts/backend/`)

| Script | Komut | Ne yapar |
|--------|-------|----------|
| `dev.ts` | `dev` | `encore run --port 8000` — API sunucusu |
| `test.ts` | `test` | Vitest test suite |
| `generate.ts` | `generate` | Encore client → `frontend/lib/client.ts` |
| `generate-watch.ts` | `generate:watch` | `.ts` değişince otomatik codegen |
| `clean.ts` | `clean` | `node_modules` + `.encore` sil |
| `secret.ts` | `secret` (root) | Encore secret tanımla |

`backend/package.json` tüm komutları `bun ../docs/scripts/backend/...` ile çağırır.

## Frontend komutları (`docs/scripts/frontend/`)

| Script | Komut | Ne yapar |
|--------|-------|----------|
| `build.ts` | `build` | sync-games + next build |
| `ios.ts` | `ios` | Xcode/Simulator temizle → Capacitor build → sync → Xcode aç (macOS) |
| `mobile.ts` | `mobile` | Capacitor build → sync → APK → klasörü aç |
| `store.ts` | `store` | Sürüm artır → Capacitor build → sync → release APK/AAB |
| `ota.ts` | `ota` | Sürüm artır → OTA paketi oluştur |
| `sync.ts` | `sync` | cap sync + pod install |
| `apk.ts` | `apk` | Gradle assembleDebug + bundleRelease |
| `aab.ts` | `aab` | Sürüm artır + bundleRelease |
| `open-apk.ts` | `open-apk` | Debug APK klasörünü aç |
| `open-aab.ts` | `open-aab` | AAB klasörünü aç |
| `clean-android.ts` | `clean` | Gradle clean |
| `increment-version.ts` | `increment-version` | Uygulama sürümünü artır |

`frontend/package.json` içinde yalnızca `dev`, `start`, `lint`, `generate` doğrudan Next.js/eslint çalıştırır. Diğer tüm komutlar `bun ../docs/scripts/frontend/...` ile bu script'lere yönlendirilir.

Root `package.json` da aynı `docs/scripts/frontend/` dosyalarını çağırır — tekrar eden mantık yok.

## Platform notları

- **macOS**: Android build için `JAVA_HOME` otomatik ayarlanır (Android Studio JBR)
- **Windows**: Gradle `gradlew.bat` kullanır; klasör açma `explorer` ile yapılır
- **iOS**: Yalnızca macOS'ta çalışır

## Neden burada?

- Shell tırnak kaçışları Mac/Windows'ta kırılıyordu
- Ortam değişkenleri `Bun.spawn` ile verilir
- Tekrar eden Capacitor build adımları `lib/capacitor-build.ts` içinde paylaşılır
- Her komutun ne yaptığı bu README'de dokümante edilir
