"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { Broom, Plus, Users, Trash } from "@phosphor-icons/react";
import { Drawer } from "vaul";
import { Toaster, toast } from "react-hot-toast";
import EvIsleriShell from "./components/EvIsleriShell";
import { createBoardAction, deleteBoardAction, getBoardsAction } from "./actions";
import type { Board } from "./types";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

export default function EvIsleriHomePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { confirm } = useConfirmDialog();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    void loadBoards();
  }, [isLoaded, user?.id]);

  async function loadBoards() {
    try {
      setLoading(true);
      if (!user) {
        setBoards([]);
        return;
      }
      const result = await getBoardsAction(user.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setBoards(result.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !boardName.trim()) return;
    setCreating(true);
    try {
      const result = await createBoardAction(user.id, boardName.trim());
      if (result.error || !result.data) {
        toast.error(result.error ?? "Oluşturulamadı");
        return;
      }
      setShowCreate(false);
      setBoardName("");
      router.push(`/apps/ev-isleri/board/${result.data.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(board: Board) {
    if (!user) return;
    const ok = await confirm({
      title: "Board silinsin mi?",
      description: `"${board.name}" ve tüm planlar kalıcı olarak silinecek.`,
      confirmText: "Sil",
      variant: "danger",
    });
    if (!ok) return;
    const result = await deleteBoardAction(user.id, board.id);
    if (result.data) {
      setBoards((prev) => prev.filter((b) => b.id !== board.id));
      toast.success("Board silindi");
    } else {
      toast.error(result.error ?? "Silinemedi");
    }
  }

  if (!isLoaded || loading) {
    return (
      <EvIsleriShell>
        <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </EvIsleriShell>
    );
  }

  if (!user) {
    return (
      <EvIsleriShell>
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/50 flex flex-col items-center justify-center p-6 shadow-sm">
          <Broom size={40} className="text-gray-200 mb-4" weight="duotone" />
          <p className="text-sm font-bold text-gray-400">Ev işlerini planlamak için giriş yap.</p>
        </div>
      </EvIsleriShell>
    );
  }

  return (
    <EvIsleriShell>
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Board&apos;ların</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-teal-600 text-white text-[10px] font-black uppercase tracking-wide active:scale-95"
        >
          <Plus size={14} weight="bold" />
          Yeni
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Broom size={48} className="mx-auto text-gray-200 mb-4" weight="duotone" />
          <p className="text-sm font-bold text-gray-500 mb-1">Henüz board yok</p>
          <p className="text-xs text-gray-400 mb-4">Ev veya oda için bir board oluştur.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-black active:scale-95"
          >
            İlk board&apos;u oluştur
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {boards.map((board) => (
            <div
              key={board.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => router.push(`/apps/ev-isleri/board/${board.id}`)}
                className="w-full text-left px-4 py-4 flex items-center gap-3 active:bg-gray-50 transition-colors"
              >
                <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                  <Broom size={22} weight="fill" className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{board.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5 flex items-center gap-1">
                    <Users size={12} />
                    {board.memberCount} üye
                    {board.myRole === "owner" && " · Sahipsin"}
                  </p>
                </div>
              </button>
              {board.myRole === "owner" && (
                <div className="px-4 pb-3 flex justify-end border-t border-gray-50 pt-2">
                  <button
                    onClick={() => void handleDelete(board)}
                    className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-red-500"
                  >
                    <Trash size={12} />
                    Sil
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Drawer.Root open={showCreate} onOpenChange={setShowCreate}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 outline-none">
            <Drawer.Title className="text-sm font-black text-gray-900 mb-4">Yeni board</Drawer.Title>
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              <input
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Örn: Ev, Yurt Odası 204"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm font-bold outline-none focus:border-teal-200"
                autoFocus
              />
              <button
                type="submit"
                disabled={creating || !boardName.trim()}
                className="w-full py-3.5 rounded-2xl bg-teal-600 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 active:scale-[0.98]"
              >
                {creating ? "Oluşturuluyor..." : "Oluştur"}
              </button>
            </form>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </EvIsleriShell>
  );
}
