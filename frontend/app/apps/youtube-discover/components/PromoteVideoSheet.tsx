"use client";

import { useEffect, useState } from "react";
import { CircleNotch } from "@phosphor-icons/react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Series } from "../lib/types";

const ACCENT = "#EF4444";

interface PromoteVideoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: Series | null;
  loading?: boolean;
  onConfirm: (title: string) => void;
}

export default function PromoteVideoSheet({
  open,
  onOpenChange,
  source,
  loading = false,
  onConfirm,
}: PromoteVideoSheetProps) {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
    }
  }, [open, source?.id]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || loading) return;
    onConfirm(trimmed);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-xl mx-auto rounded-t-3xl border-t border-app-border bg-app-surface">
        <DrawerHeader className="px-4 pt-2 pb-0 text-left">
          <DrawerTitle className="text-base font-black text-app-text uppercase tracking-tight">
            Seri adı ver
          </DrawerTitle>
          <DrawerDescription className="text-[11px] font-medium text-app-muted">
            Tek video ham kaynak olarak kalır; Keşfet&apos;te gösterilecek seri adını sen belirle.
          </DrawerDescription>
        </DrawerHeader>

        {source && (
          <form onSubmit={handleSubmit} className="px-4 pb-6 pt-4 space-y-4">
            <div className="flex gap-3 p-3 rounded-xl border border-app-border bg-app-surface-muted">
              {source.youtubeId ? (
                <img
                  src={`https://img.youtube.com/vi/${source.youtubeId}/hqdefault.jpg`}
                  alt=""
                  className="w-20 h-14 rounded-lg object-cover shrink-0"
                />
              ) : null}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-app-muted mb-1">
                  Video
                </p>
                <p className="text-[12px] font-bold text-app-text line-clamp-2">{source.title}</p>
                <p className="text-[10px] font-bold text-app-muted mt-1">{source.creator}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="series-title"
                className="text-[10px] font-black uppercase tracking-wider text-app-muted px-1"
              >
                Seri adı
              </label>
              <input
                id="series-title"
                required
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={source.title || "Örn. Yemekte Enis Kirazoglu"}
                className="w-full h-11 px-3 bg-app-surface border border-app-border rounded-xl text-sm font-bold text-app-text placeholder:text-app-muted outline-none focus:border-red-500/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="w-full h-11 rounded-xl text-white text-[11px] font-black uppercase tracking-wider disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ backgroundColor: ACCENT }}
            >
              {loading ? (
                <>
                  <CircleNotch size={16} className="animate-spin" />
                  Ekleniyor...
                </>
              ) : (
                "Keşfet'e ekle"
              )}
            </button>
          </form>
        )}
      </DrawerContent>
    </Drawer>
  );
}
