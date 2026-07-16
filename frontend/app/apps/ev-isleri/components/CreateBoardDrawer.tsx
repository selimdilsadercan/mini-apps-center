"use client";

import { X } from "@phosphor-icons/react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export default function CreateBoardDrawer({
  open,
  onOpenChange,
  boardName,
  onBoardNameChange,
  onSubmit,
  creating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardName: string;
  onBoardNameChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  creating: boolean;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-xl mx-auto rounded-t-3xl border-t border-app-border bg-app-surface">
        <DrawerHeader className="px-4 pt-2 pb-0 text-left">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base font-black text-app-text uppercase tracking-tight">
              Yeni board
            </DrawerTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-app-surface-muted flex items-center justify-center text-app-muted hover:text-app-text transition-all active:scale-95"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </DrawerHeader>

        <form onSubmit={onSubmit} className="px-4 pb-6 pt-3 space-y-4">
          <input
            value={boardName}
            onChange={(e) => onBoardNameChange(e.target.value)}
            placeholder="Örn: Ev, Yurt Odası 204"
            className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-teal-500/40 placeholder:text-app-muted"
            autoFocus
          />
          <button
            type="submit"
            disabled={creating || !boardName.trim()}
            className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 active:scale-[0.98]"
          >
            {creating ? "Oluşturuluyor..." : "Oluştur"}
          </button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
