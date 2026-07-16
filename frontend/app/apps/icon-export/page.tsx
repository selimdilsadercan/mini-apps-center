"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useCallback, useRef, useState } from "react";
import {
  CaretLeft,
  ImageSquare,
  Package,
  Spinner,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { toast, Toaster } from "react-hot-toast";
import {
  ALL_ICON_TARGETS,
  ICON_EXPORT_GROUPS,
  ANDROID_ICON_TARGETS,
  IOS_ICON_TARGETS,
  WEB_ICON_TARGETS,
} from "./icon-spec";
import { buildIconExportZip, downloadBlob } from "./icon-engine";

export default function IconExportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [slug, setSlug] = useState("app-icon");
  const [opaqueBg, setOpaqueBg] = useState("#FFFFFF");

  const setSelectedFile = useCallback((next: File | null) => {
    setFile(next);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next ? URL.createObjectURL(next) : null;
    });
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (!picked.type.startsWith("image/")) {
      toast.error("Lütfen PNG veya JPG yükleyin");
      return;
    }
    setSelectedFile(picked);
    e.target.value = "";
  };

  const handleExport = async () => {
    if (!file) {
      toast.error("Önce bir görsel seçin");
      return;
    }

    setExporting(true);
    try {
      const zip = await buildIconExportZip(file, { opaqueBackground: opaqueBg });
      const safeSlug = slug.trim().replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "") || "app-icon";
      downloadBlob(zip, `${safeSlug}-icons.zip`);
      toast.success(`${ALL_ICON_TARGETS.length} dosya indirildi`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Export başarısız");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col">
      <Toaster position="top-center" />

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="px-4 pt-3 pb-3 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-[#0EA5E9]" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-gray-900 flex items-center gap-1.5">
              <ImageSquare size={18} weight="fill" className="text-[#0EA5E9] shrink-0" />
              <span className="truncate">
                Icon <span className="text-[#0EA5E9]">Export</span>
              </span>
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Kaynak Görsel
          </p>

          {!previewUrl ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full min-h-[200px] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100/80 hover:border-[#0EA5E9]/40 transition-all flex flex-col items-center justify-center gap-3 active:scale-[0.99]"
            >
              <UploadSimple size={32} weight="bold" className="text-gray-300" />
              <span className="text-xs font-black text-gray-500 uppercase tracking-wide">
                PNG yükle (1024×1024 önerilir)
              </span>
            </button>
          ) : (
            <div className="flex gap-4 items-start">
              <div className="w-28 h-28 rounded-2xl border border-gray-200 overflow-hidden bg-gray-100 shrink-0">
                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-bold text-gray-900 truncate">{file?.name}</p>
                <p className="text-[11px] text-gray-500">
                  Kare crop ile tüm boyutlar üretilir.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-red-600 hover:text-red-700"
                >
                  <X size={12} weight="bold" />
                  Kaldır
                </button>
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Export Ayarları
          </p>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              ZIP dosya adı
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="chocolate-db"
              className="mt-1 w-full h-10 px-3 rounded-xl border border-gray-200/80 bg-gray-50 text-sm font-medium outline-none focus:border-[#0EA5E9]/40"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              iOS 1024 arka plan (opak)
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={opaqueBg}
                onChange={(e) => setOpaqueBg(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
              />
              <input
                value={opaqueBg}
                onChange={(e) => setOpaqueBg(e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl border border-gray-200/80 bg-gray-50 text-sm font-mono outline-none focus:border-[#0EA5E9]/40"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Paket İçeriği
            </p>
            <span className="text-[10px] font-black text-[#0EA5E9] uppercase">
              {ALL_ICON_TARGETS.length} dosya
            </span>
          </div>

          {ICON_EXPORT_GROUPS.map((group) => {
            const targets =
              group.id === "ios"
                ? IOS_ICON_TARGETS
                : group.id === "android"
                  ? ANDROID_ICON_TARGETS
                  : WEB_ICON_TARGETS;

            return (
              <div
                key={group.id}
                className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5"
              >
                <p className="text-[11px] font-black text-gray-800 uppercase tracking-wide">
                  {group.label}{" "}
                  <span className="text-gray-400 font-bold">({group.count})</span>
                </p>
                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                  {targets
                    .slice(0, 8)
                    .map((t) => t.path.split("/").pop())
                    .join(", ")}
                  {targets.length > 8 ? "…" : ""}
                </p>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={!file || exporting}
          className="w-full h-12 rounded-2xl bg-[#0EA5E9] hover:bg-[#0284C7] disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-[0.99] shadow-lg shadow-[#0EA5E9]/20"
        >
          {exporting ? (
            <>
              <Spinner size={18} className="animate-spin" />
              Export...
            </>
          ) : (
            <>
              <Package size={18} weight="bold" />
              Tümünü ZIP İndir
            </>
          )}
        </button>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed pb-4">
          iOS, Android mipmap ve web/PWA ikonları — projedeki mevcut klasör yapısıyla uyumlu.
        </p>
      </main>
    </div>
  );
}
