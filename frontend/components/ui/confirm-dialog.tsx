"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  icon?: React.ReactNode;
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function useConfirmDialog() {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) {
    throw new Error("useConfirmDialog must be used within a ConfirmDialogProvider");
  }
  return ctx;
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmDialogOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  };

  const handleCancel = () => {
    setOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  };

  const isDanger = options?.variant === "danger";

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
        <AlertDialogContent className="max-w-xs rounded-3xl border-gray-200 dark:border-zinc-800 p-6 gap-0">
          <AlertDialogHeader className="items-center text-center space-y-3 mb-6">
            {options?.icon && (
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${isDanger ? "bg-red-50 text-red-500 dark:bg-red-950/20 dark:text-red-400" : "bg-blue-50 text-blue-500 dark:bg-blue-950/20 dark:text-blue-400"}`}>
                {options.icon}
              </div>
            )}
            <AlertDialogTitle className="text-base font-bold text-gray-900 dark:text-zinc-50">
              {options?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
              {options?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:flex-row">
            <AlertDialogCancel
              onClick={handleCancel}
              className="flex-1 h-10 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold rounded-xl border-gray-200 dark:border-zinc-700 m-0"
            >
              {options?.cancelText || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={`flex-1 h-10 text-xs font-bold rounded-xl m-0 ${isDanger ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20" : ""}`}
            >
              {options?.confirmText || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}
