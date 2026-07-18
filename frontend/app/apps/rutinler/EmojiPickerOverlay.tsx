"use client";

import { X } from "@phosphor-icons/react";
import { CustomEmojiPicker } from "./EmojiPicker";

interface EmojiPickerOverlayProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

/** In-drawer overlay — no portal, no nested Vaul. Stays clickable inside Drawer.Content. */
export function EmojiPickerOverlay({ onSelect, onClose }: EmojiPickerOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col bg-app-surface rounded-t-3xl animate-in slide-in-from-bottom-4 fade-in duration-200"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="px-4 pt-2 pb-2 flex items-center justify-between shrink-0 border-b border-app-border">
        <p className="text-sm font-black text-app-text uppercase tracking-tight">Emoji Seç</p>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-app-surface-muted flex items-center justify-center text-app-muted hover:text-app-text active:scale-95"
        >
          <X size={16} weight="bold" />
        </button>
      </div>
      <div className="flex-1 min-h-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <CustomEmojiPicker
          onSelect={(emoji) => {
            onSelect(emoji);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
