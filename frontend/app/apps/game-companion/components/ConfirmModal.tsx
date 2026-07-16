"use client";

import { X, Warning } from "@phosphor-icons/react";
import { Drawer } from "vaul";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Sil",
  cancelText = "İptal",
  isDestructive = true,
  isLoading = false,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[70]" />
        <Drawer.Content
          className="h-fit fixed bottom-0 left-0 right-0 outline-none rounded-t-3xl z-[70] bg-app-bg"
        >
          {/* Gesture bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-app-border rounded-full"></div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-6 pt-4">
              <Drawer.Title className="text-xl font-black text-app-text tracking-tight uppercase">
                {title}
              </Drawer.Title>
              <button
                onClick={onClose}
                className="p-2 text-app-muted hover:text-app-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Warning Icon and Message */}
              <div className="flex items-start space-x-4">
                <div
                  className={`p-3 rounded-2xl ${isDestructive ? "bg-rose-50" : "bg-blue-50"}`}
                >
                  <Warning
                    size={24}
                    className={isDestructive ? "text-rose-500" : "text-blue-500"}
                    weight="fill"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-app-muted font-medium leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 border border-app-border bg-app-surface text-app-muted rounded-2xl font-bold hover:bg-app-surface-muted transition-all disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`flex-1 py-3 px-4 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg ${
                    isDestructive
                      ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-900/20"
                      : "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-900/20"
                  }`}
                >
                  {isLoading ? "Siliniyor..." : confirmText}
                </button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
