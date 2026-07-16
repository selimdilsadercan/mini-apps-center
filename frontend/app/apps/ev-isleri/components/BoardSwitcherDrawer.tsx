"use client";

import { Broom, Plus, Trash, Users, X, Check } from "@phosphor-icons/react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Board } from "../types";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteBoardAction } from "../actions";

export default function BoardSwitcherDrawer({
  open,
  onClose,
  boards,
  activeBoardId,
  onSelect,
  onCreate,
  onBoardsChange,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  boards: Board[];
  activeBoardId: string | null;
  onSelect: (boardId: string) => void;
  onCreate: () => void;
  onBoardsChange: (boards: Board[]) => void;
  userId: string;
}) {
  const { confirm } = useConfirmDialog();

  async function handleDelete(board: Board) {
    const ok = await confirm({
      title: "Board silinsin mi?",
      description: `"${board.name}" ve tüm görevler kalıcı olarak silinecek.`,
      confirmText: "Sil",
      variant: "danger",
    });
    if (!ok) return;

    const result = await deleteBoardAction(userId, board.id);
    if (result.data) {
      onBoardsChange(boards.filter((b) => b.id !== board.id));
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) onClose();
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-w-xl mx-auto rounded-t-3xl border-t border-app-border bg-app-surface">
        <DrawerHeader className="px-4 pt-2 pb-0 text-left">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base font-black text-app-text uppercase tracking-tight">
              Board seç
            </DrawerTitle>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="w-8 h-8 rounded-full bg-app-surface-muted flex items-center justify-center text-app-muted hover:text-app-text transition-all active:scale-95"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </DrawerHeader>

        <div className="px-4 pt-3 pb-4 max-h-[50vh] overflow-y-auto space-y-2">
          {boards.map((board) => {
            const active = board.id === activeBoardId;
            return (
              <div
                key={board.id}
                className={`rounded-2xl border overflow-hidden ${
                  active ? "border-teal-500/40 bg-teal-500/5" : "border-app-border bg-app-bg"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect(board.id);
                    handleOpenChange(false);
                  }}
                  className="w-full text-left px-4 py-3.5 flex items-center gap-3 active:opacity-80"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Broom size={20} weight="fill" className="text-teal-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-app-text truncate">{board.name}</p>
                    <p className="text-[10px] font-bold text-app-muted mt-0.5 flex items-center gap-1">
                      <Users size={11} />
                      {board.memberCount} üye
                      {board.myRole === "owner" && " · Sahipsin"}
                    </p>
                  </div>
                  {active && <Check size={18} weight="bold" className="text-teal-500 shrink-0" />}
                </button>
                {board.myRole === "owner" && (
                  <div className="px-4 pb-2.5 flex justify-end border-t border-app-border pt-2">
                    <button
                      type="button"
                      onClick={() => void handleDelete(board)}
                      className="flex items-center gap-1 text-[10px] font-bold text-app-muted hover:text-red-500"
                    >
                      <Trash size={12} />
                      Sil
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-4 pb-6 pt-2 border-t border-app-border">
          <button
            type="button"
            onClick={() => {
              handleOpenChange(false);
              onCreate();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wide active:scale-[0.98]"
          >
            <Plus size={14} weight="bold" />
            Yeni board
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
