"use client";

import { getAppRootUrl, MINI_APPS, MiniApp } from "@/lib/apps";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CaretLeft,
  ArrowCounterClockwise,
  DownloadSimple,
  Trash,
  DeviceMobile,
  MagnifyingGlass,
  Spinner,
  Images,
  X,
  Image,
} from "@phosphor-icons/react";
import { toPng } from "html-to-image";
import { toast, Toaster } from "react-hot-toast";
import { Drawer } from "vaul";
import { DeviceChromeOverlay } from "./components/DeviceChromeOverlay";
import { StorePreviewDeviceFrame } from "@/components/device/IosDeviceChrome";
import {
  compositeScreenshot,
  getContentHeight,
  getDeviceChrome,
  injectIframeViewport,
} from "./device-chrome";

const GALLERY_KEY = "store-preview-gallery";

const DEVICE_PRESETS = [
  {
    id: "iphone-65",
    label: 'iPhone 6.5"',
    viewportWidth: 414,
    viewportHeight: 896,
    exportWidth: 1284,
    exportHeight: 2778,
  },
  {
    id: "ipad-129",
    label: 'iPad 12.9"',
    viewportWidth: 1024,
    viewportHeight: 1366,
    exportWidth: 2048,
    exportHeight: 2732,
  },
] as const;

type DevicePreset = (typeof DEVICE_PRESETS)[number];

interface CaptureItem {
  id: string;
  dataUrl: string;
  url: string;
  presetLabel: string;
  width: number;
  height: number;
  timestamp: number;
}

function normalizePath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "/home";
  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("http")) {
    try {
      const url = new URL(trimmed);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return "/home";
    }
  }
  return `/${trimmed.replace(/^\//, "")}`;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export default function StorePreviewPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [preset, setPreset] = useState<DevicePreset>(DEVICE_PRESETS[0]);
  const chrome = useMemo(() => getDeviceChrome(preset.id), [preset.id]);
  const contentHeight = useMemo(
    () => getContentHeight(preset.viewportHeight, chrome),
    [preset.viewportHeight, chrome],
  );
  const [framePath, setFramePath] = useState("/home");
  const [urlInput, setUrlInput] = useState("/home");
  const [iframeSrc, setIframeSrc] = useState("/home");
  const [iframeLoading, setIframeLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [appPickerOpen, setAppPickerOpen] = useState(false);
  const [appSearch, setAppSearch] = useState("");
  const [captures, setCaptures] = useState<CaptureItem[]>([]);
  const [scale, setScale] = useState(0.3);
  const [statusBarTheme, setStatusBarTheme] = useState<"light" | "dark">("dark");
  const [bgImage, setBgImage] = useState<string | null>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  const implementedApps = useMemo(
    () =>
      [...MINI_APPS]
        .filter((app) => app.isImplemented)
        .sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [],
  );

  const filteredApps = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    if (!q) return implementedApps;
    return implementedApps.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.id.toLowerCase().includes(q) ||
        app.href.toLowerCase().includes(q),
    );
  }, [appSearch, implementedApps]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(GALLERY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CaptureItem[];
      if (Array.isArray(parsed)) setCaptures(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(captures));
    } catch {
      /* ignore quota */
    }
  }, [captures]);

  const updateScale = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const padding = 32;
    const availableW = el.clientWidth - padding;
    const availableH = el.clientHeight - padding;
    const next = Math.min(
      availableW / preset.viewportWidth,
      availableH / preset.viewportHeight,
      1,
    );
    setScale(Math.max(next, 0.12));
  }, [preset]);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale]);

  const syncIframeUrl = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const href = iframe.contentWindow?.location.href;
      if (!href) return;
      const url = new URL(href);
      const path = `${url.pathname}${url.search}${url.hash}`;
      setFramePath(path);
      setUrlInput(path);
    } catch {
      /* cross-origin — keep last known path */
    }
  }, []);

  const navigateTo = useCallback((path: string) => {
    const normalized = normalizePath(path);
    setIframeSrc(normalized);
    setFramePath(normalized);
    setUrlInput(normalized);
    setIframeLoading(true);
  }, []);

  const prepareIframeViewport = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;

    injectIframeViewport(doc, preset.viewportWidth, preset.viewportHeight, chrome.top, preset.id);

    if (iframe.dataset.viewportPrepared !== "true") {
      iframe.dataset.viewportPrepared = "true";
      iframe.contentWindow?.location.reload();
      return;
    }

    iframe.contentWindow?.scrollTo(0, 0);

    doc.documentElement.style.width = `${preset.viewportWidth}px`;
    doc.documentElement.style.maxWidth = `${preset.viewportWidth}px`;
    doc.documentElement.style.height = `${preset.viewportHeight}px`;
    doc.documentElement.style.overflow = "hidden";
    doc.documentElement.style.overflowX = "hidden";
    doc.documentElement.style.backgroundColor = "#FAF9F7";

    doc.body.style.width = `${preset.viewportWidth}px`;
    doc.body.style.maxWidth = `${preset.viewportWidth}px`;
    doc.body.style.minHeight = `${preset.viewportHeight}px`;
    doc.body.style.height = `${preset.viewportHeight}px`;
    doc.body.style.overflow = "hidden";
    doc.body.style.overflowX = "hidden";
    doc.body.style.backgroundColor = "#FAF9F7";
    doc.body.style.margin = "0";
    // NOTE: Do NOT set doc.body.style.padding here — CSS injection from
    // injectIframeViewport sets padding-top for the status bar safe area.
    doc.body.style.paddingLeft = "0";
    doc.body.style.paddingRight = "0";
    doc.body.style.paddingBottom = "0";
  }, [preset.viewportWidth, preset.viewportHeight]);

  useEffect(() => {
    if (iframeRef.current) {
      delete iframeRef.current.dataset.viewportPrepared;
    }
  }, [iframeSrc, preset.id]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
    syncIframeUrl();
    prepareIframeViewport();
  }, [syncIframeUrl, prepareIframeViewport]);

  const handleGo = () => navigateTo(urlInput);

  const handleAppSelect = (app: MiniApp) => {
    navigateTo(app.href);
    setAppPickerOpen(false);
    setAppSearch("");
  };

  const handleCapture = async () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setCapturing(true);
    try {
      const doc = iframe.contentDocument;
      if (!doc?.documentElement) {
        throw new Error(
          "iframe içeriğine erişilemedi. /apps/... gibi same-origin path kullanın.",
        );
      }

      prepareIframeViewport();

      // Zero out padding-top for capture — we'll composite the status bar separately in canvas
      const styleEl = doc.getElementById("store-preview-frame-styles");
      const origStyleContent = styleEl?.textContent || "";
      if (styleEl) {
        // Override padding-top to 0 so content starts from top edge
        styleEl.textContent = origStyleContent.replace(
          /padding-top:\s*[\d.]+px\s*!important/g,
          "padding-top: 0px !important"
        );
      }
      // Force reflow
      void doc.body.offsetHeight;

      // Temporarily replace external (cross-origin) images with a styled placeholder
      const externalImgs: { el: HTMLImageElement; originalSrc: string }[] = [];
      doc.body.querySelectorAll("img").forEach((img) => {
        const src = img.src || "";
        if (src.startsWith("http") && !src.includes(window.location.host)) {
          externalImgs.push({ el: img, originalSrc: src });
          // Create an SVG placeholder with an image icon
          const w = img.clientWidth || 48;
          const h = img.clientHeight || 48;
          const iconSize = Math.min(Math.max(Math.min(w, h) * 0.4, 14), 28);
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
            <rect width="${w}" height="${h}" rx="8" fill="#2A2A2E"/>
            <g transform="translate(${w / 2 - iconSize / 2}, ${h / 2 - iconSize / 2})">
              <rect width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.15}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="${iconSize * 0.08}"/>
              <circle cx="${iconSize * 0.35}" cy="${iconSize * 0.33}" r="${iconSize * 0.1}" fill="rgba(255,255,255,0.35)"/>
              <path d="M${iconSize * 0.08} ${iconSize * 0.75} L${iconSize * 0.35} ${iconSize * 0.5} L${iconSize * 0.55} ${iconSize * 0.65} L${iconSize * 0.7} ${iconSize * 0.52} L${iconSize * 0.92} ${iconSize * 0.75} L${iconSize * 0.92} ${iconSize * 0.88} Q${iconSize * 0.92} ${iconSize} ${iconSize * 0.85} ${iconSize} L${iconSize * 0.15} ${iconSize} Q${iconSize * 0.08} ${iconSize} ${iconSize * 0.08} ${iconSize * 0.88} Z" fill="rgba(255,255,255,0.25)"/>
            </g>
          </svg>`;
          img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        }
      });

      // Capture only the content area (without status bar padding)
      const captureHeight = preset.viewportHeight - chrome.top;
      const captureExportHeight = Math.round(preset.exportHeight * (captureHeight / preset.viewportHeight));

      let contentDataUrl: string;
      try {
        contentDataUrl = await toPng(doc.body, {
          width: preset.viewportWidth,
          height: captureHeight,
          canvasWidth: preset.exportWidth,
          canvasHeight: captureExportHeight,
          pixelRatio: 1,
          cacheBust: false,
          skipFonts: true,
          backgroundColor: "#FAF9F7",
          imagePlaceholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
        });
      } finally {
        // Restore original style (re-adds the padding-top)
        if (styleEl) {
          styleEl.textContent = origStyleContent;
        }
        externalImgs.forEach(({ el, originalSrc }) => {
          el.src = originalSrc;
        });
        // Re-apply viewport prep so the live preview returns to normal
        prepareIframeViewport();
      }

      const dataUrl = await compositeScreenshot(contentDataUrl, preset, chrome, statusBarTheme, bgImage ?? undefined);

      const item: CaptureItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        dataUrl,
        url: framePath,
        presetLabel: preset.label,
        width: preset.exportWidth,
        height: preset.exportHeight,
        timestamp: Date.now(),
      };

      setCaptures((prev) => [item, ...prev]);
      toast.success("Ekran görüntüsü kaydedildi");
    } catch (err: any) {
      console.error("Capture error:", err);
      let errMsg = "Bilinmeyen hata";
      if (err instanceof Error) {
        errMsg = err.message;
      } else if (err instanceof Event) {
        errMsg = `Yükleme hatası (Event type: ${err.type}, target: ${err.target?.constructor?.name || "unknown"})`;
      } else if (typeof err === "object") {
        try {
          errMsg = JSON.stringify(err);
        } catch {
          errMsg = String(err);
        }
      } else {
        errMsg = String(err);
      }
      toast.error(`Capture başarısız oldu: ${errMsg}`);
    } finally {
      setCapturing(false);
    }
  };

  const handleDownload = (item: CaptureItem) => {
    const slug = item.url.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "screen";
    downloadDataUrl(
      item.dataUrl,
      `store-${slug}-${item.width}x${item.height}.png`,
    );
  };

  const handleDownloadAll = () => {
    captures.forEach((item, index) => {
      setTimeout(() => handleDownload(item), index * 300);
    });
  };

  const handleDeleteCapture = (id: string) => {
    setCaptures((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearGallery = () => {
    setCaptures([]);
    localStorage.removeItem(GALLERY_KEY);
    toast.success("Galeri temizlendi");
  };

  const iframeBack = () => {
    try {
      iframeRef.current?.contentWindow?.history.back();
    } catch {
      toast.error("Geri gidilemedi");
    }
  };

  const iframeForward = () => {
    try {
      iframeRef.current?.contentWindow?.history.forward();
    } catch {
      toast.error("İleri gidilemedi");
    }
  };

  const iframeReload = () => {
    setIframeLoading(true);
    iframeRef.current?.contentWindow?.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col">
      <Toaster position="top-center" />

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="px-4 pt-3 pb-3 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-[#7C3AED]" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
              <Camera size={18} weight="fill" className="text-[#7C3AED] shrink-0" />
              <span className="truncate">
                STORE PREVIEW
              </span>
            </h1>

            <button
              onClick={() => setGalleryOpen(true)}
              className="relative shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 bg-white rounded-lg border border-gray-200/60 active:scale-95"
              title="Galeri"
            >
              <Images size={16} weight="bold" />
              {captures.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#7C3AED] text-white text-[9px] font-black flex items-center justify-center">
                  {captures.length}
                </span>
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {DEVICE_PRESETS.map((item) => (
              <button
                key={item.id}
                onClick={() => setPreset(item)}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all ${
                  preset.id === item.id
                    ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                    : "bg-white text-gray-600 border-gray-200/80 hover:border-gray-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 flex flex-col lg:flex-row gap-4 min-h-0">
        <aside className="lg:w-72 shrink-0 space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Navigasyon
            </p>

            <div className="flex gap-1.5">
              <button
                onClick={iframeBack}
                className="flex-1 h-9 rounded-xl border border-gray-200/80 bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95 flex items-center justify-center"
                title="Geri"
              >
                <CaretLeft size={16} weight="bold" />
              </button>
              <button
                onClick={iframeForward}
                className="flex-1 h-9 rounded-xl border border-gray-200/80 bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95 flex items-center justify-center"
                title="İleri"
              >
                <CaretLeft size={16} weight="bold" className="rotate-180" />
              </button>
              <button
                onClick={iframeReload}
                className="flex-1 h-9 rounded-xl border border-gray-200/80 bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95 flex items-center justify-center"
                title="Yenile"
              >
                <ArrowCounterClockwise size={16} weight="bold" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGo()}
                placeholder="/apps/chocolate-db"
                className="flex-1 min-w-0 h-10 px-3 rounded-xl border border-gray-200/80 bg-gray-50 text-xs font-medium text-gray-800 outline-none focus:border-[#7C3AED]/40"
              />
              <button
                onClick={handleGo}
                className="h-10 px-3 rounded-xl bg-[#7C3AED] text-white text-[10px] font-black uppercase tracking-wide active:scale-95"
              >
                Git
              </button>
            </div>

            <button
              onClick={() => setAppPickerOpen(true)}
              className="w-full h-10 rounded-xl border border-gray-200/80 bg-white text-gray-700 text-[10px] font-black uppercase tracking-wide hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <DeviceMobile size={14} weight="bold" />
              Uygulama Seç
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Durum Çubuğu İkonları
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusBarTheme("light")}
                className={`flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                  statusBarTheme === "light"
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 active:scale-95"
                }`}
              >
                Siyah
              </button>
              <button
                onClick={() => setStatusBarTheme("dark")}
                className={`flex-1 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                  statusBarTheme === "dark"
                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 active:scale-95"
                }`}
              >
                Beyaz
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Arka Plan Görseli
            </p>
            <input
              ref={bgImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => setBgImage(ev.target?.result as string);
                reader.readAsDataURL(file);
              }}
            />
            {bgImage ? (
              <div className="relative rounded-xl overflow-hidden" style={{ height: 60 }}>
                <img src={bgImage} alt="Arka plan" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setBgImage(null); if (bgImageInputRef.current) bgImageInputRef.current.value = ""; }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X size={10} weight="bold" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => bgImageInputRef.current?.click()}
                className="w-full h-12 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#7C3AED]/40 hover:text-[#7C3AED] transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wide active:scale-95"
              >
                <Image size={14} weight="bold" />
                Görsel Seç
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Bilgi
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Viewport {preset.viewportWidth}×{preset.viewportHeight} → export{" "}
              {preset.exportWidth}×{preset.exportHeight}px
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Capture için same-origin path kullanın: <code className="text-[10px] bg-gray-100 px-1 rounded">/apps/...</code>
            </p>
            <p className="text-[10px] font-mono text-gray-400 truncate">{framePath}</p>
          </div>
        </aside>

        <section className="flex-1 min-h-0 flex flex-col gap-3">
          <div
            ref={viewportRef}
            className="flex-1 min-h-[420px] bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden relative"
          >
            {iframeLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                <Spinner size={28} className="animate-spin text-[#7C3AED]" />
              </div>
            )}

            <StorePreviewDeviceFrame
              screenWidth={preset.viewportWidth * scale}
              screenHeight={preset.viewportHeight * scale}
            >
              <div
                className="absolute top-0 left-0 origin-top-left overflow-hidden bg-black"
                style={{
                  width: preset.viewportWidth,
                  height: preset.viewportHeight,
                  transform: `scale(${scale})`,
                }}
              >
                <iframe
                  key={preset.id}
                  ref={iframeRef}
                  src={iframeSrc}
                  title="Store Preview Frame"
                  onLoad={handleIframeLoad}
                  style={{
                    top: 0,
                    width: preset.viewportWidth,
                    height: preset.viewportHeight,
                  }}
                />
                <DeviceChromeOverlay chrome={chrome} width={preset.viewportWidth} theme={statusBarTheme} presetId={preset.id} />
              </div>
            </StorePreviewDeviceFrame>
          </div>

          <button
            onClick={handleCapture}
            disabled={capturing || iframeLoading}
            className="w-full h-12 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-[0.99] shadow-lg shadow-[#7C3AED]/20"
          >
            {capturing ? (
              <>
                <Spinner size={18} className="animate-spin" />
                Capture...
              </>
            ) : (
              <>
                <Camera size={18} weight="bold" />
                Capture — {preset.label}
              </>
            )}
          </button>
        </section>
      </div>

      <Drawer.Root open={appPickerOpen} onOpenChange={setAppPickerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-xl flex-col rounded-t-3xl border-t border-gray-200/60 bg-white shadow-2xl outline-none">
            <div className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-gray-200" />
            <Drawer.Title className="px-4 text-lg font-black text-gray-900">
              Uygulama Seç
            </Drawer.Title>
            <div className="px-4 pb-2">
              <div className="relative">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  placeholder="Ara..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200/80 bg-gray-50 text-sm outline-none focus:border-[#7C3AED]/40"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
              {filteredApps.map((app) => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.id}
                    onClick={() => handleAppSelect(app)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 active:scale-[0.99] text-left border border-transparent hover:border-gray-100"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: app.color }}
                    >
                      <Icon size={20} weight="fill" className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{app.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{app.href}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Drawer.Root open={galleryOpen} onOpenChange={setGalleryOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-3xl border-t border-gray-200/60 bg-white shadow-2xl outline-none">
            <div className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-gray-200" />
            <div className="px-4 flex items-center justify-between gap-3">
              <Drawer.Title className="text-lg font-black text-gray-900">
                Galeri ({captures.length})
              </Drawer.Title>
              <div className="flex items-center gap-2">
                {captures.length > 0 && (
                  <>
                    <button
                      onClick={handleDownloadAll}
                      className="h-8 px-3 rounded-lg border border-gray-200/80 text-[10px] font-black uppercase tracking-wide text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                    >
                      <DownloadSimple size={14} />
                      Tümü
                    </button>
                    <button
                      onClick={handleClearGallery}
                      className="h-8 px-3 rounded-lg border border-red-200/80 text-[10px] font-black uppercase tracking-wide text-red-600 hover:bg-red-50 flex items-center gap-1"
                    >
                      <Trash size={14} />
                      Temizle
                    </button>
                  </>
                )}
                <button
                  onClick={() => setGalleryOpen(false)}
                  className="w-8 h-8 rounded-lg border border-gray-200/80 flex items-center justify-center text-gray-500"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2">
              {captures.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-12">
                  Henüz capture yok. Önizlemede gezinin ve Capture&apos;a basın.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {captures.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-50"
                    >
                      <div className="aspect-[9/19] bg-white">
                        <img
                          src={item.dataUrl}
                          alt=""
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="p-2 space-y-2">
                        <p className="text-[10px] font-bold text-gray-700 truncate">
                          {item.presetLabel}
                        </p>
                        <p className="text-[9px] text-gray-400 truncate">{item.url}</p>
                        <button
                          onClick={() => handleDownload(item)}
                          className="w-full h-8 rounded-lg bg-[#7C3AED] text-white text-[10px] font-black uppercase flex items-center justify-center gap-1"
                        >
                          <DownloadSimple size={12} />
                          İndir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
