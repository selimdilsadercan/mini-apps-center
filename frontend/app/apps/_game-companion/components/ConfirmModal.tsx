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
        <Drawer.Content className="bg-white dark:bg-[#1C1922] h-fit fixed bottom-0 left-0 right-0 outline-none rounded-t-3xl z-[70]">
          {/* Gesture bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-6 pt-4">
              <Drawer.Title className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {title}
              </Drawer.Title>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Warning Icon and Message */}
              <div className="flex items-start space-x-4">
                <div
                  className={`p-3 rounded-full ${isDestructive ? "bg-red-100" : "bg-blue-100"}`}
                >
                  <Warning
                    size={24}
                    className={isDestructive ? "text-red-600" : "text-blue-600"}
                    weight="fill"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-[var(--card-border)] text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-[var(--card-background)] transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    isDestructive
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-blue-500 text-white hover:bg-blue-600"
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
