"use client";

import { CircleNotch, LinkSimple, ListBullets } from "@phosphor-icons/react";

const ACCENT = "#EF4444";

export default function SeriesPlaylistImport({
  url,
  onChange,
  onImport,
  loading,
}: {
  url: string;
  onChange: (url: string) => void;
  onImport: () => void;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-red-500/30 bg-red-500/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <ListBullets size={16} weight="fill" style={{ color: ACCENT }} />
        <p className="text-[10px] font-black uppercase tracking-wider text-red-500">
          Oynatma listesinden bölüm ekle
        </p>
      </div>
      <p className="text-[10px] font-medium text-app-muted leading-relaxed">
        YouTube playlist URL&apos;si yapıştır — listedeki tüm videolar tek seferde bu seriye
        eklenir. API anahtarı gerekmez.
      </p>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://youtube.com/playlist?list=..."
          className="flex-1 h-9 px-3 border border-app-border rounded-lg text-xs font-medium bg-app-surface"
        />
        <button
          type="button"
          onClick={onImport}
          disabled={loading || !url.trim()}
          className="h-9 px-3 rounded-lg text-white text-[10px] font-black uppercase disabled:opacity-50 flex items-center gap-1 shrink-0"
          style={{ backgroundColor: ACCENT }}
        >
          {loading ? (
            <CircleNotch size={14} className="animate-spin" />
          ) : (
            <LinkSimple size={12} weight="bold" />
          )}
          Listeyi Ekle
        </button>
      </div>
    </div>
  );
}
