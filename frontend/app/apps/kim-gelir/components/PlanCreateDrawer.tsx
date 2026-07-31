"use client";

import { X } from "@phosphor-icons/react";
import { Drawer } from "vaul";
import { PlanCreateForm, type PlanCreateFormProps } from "./PlanCreateForm";

export interface PlanCreateDrawerProps extends PlanCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanCreateDrawer({ open, onOpenChange, ...formProps }: PlanCreateDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
        <Drawer.Content className="bg-app-surface rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[92dvh] outline-none z-[70] max-w-xl mx-auto border-t border-app-border shadow-2xl flex flex-col">
          <div className="p-5 flex-1 overflow-y-auto flex flex-col">
            <div className="mx-auto w-10 h-1 flex-shrink-0 rounded-full bg-app-border mb-4" />

            <header className="flex justify-between items-center mb-5 shrink-0">
              <div>
                <Drawer.Title className="font-black text-base text-app-text">Plan Oluştur</Drawer.Title>
                <p className="text-[10px] text-app-muted font-bold mt-0.5">
                  Ne, nerede, ne zaman — istediğin kadarını netleştir
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-1.5 hover:bg-app-surface-muted rounded-lg transition-colors active:scale-95 text-app-muted"
              >
                <X size={18} weight="bold" />
              </button>
            </header>

            <PlanCreateForm {...formProps} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
