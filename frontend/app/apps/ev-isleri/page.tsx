"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Broom, Plus } from "@phosphor-icons/react";
import { Toaster, toast } from "react-hot-toast";
import CreateBoardDrawer from "./components/CreateBoardDrawer";
import EvIsleriShell from "./components/EvIsleriShell";
import BoardDetailClient from "./board/[boardId]/BoardDetailClient";
import { createBoardAction, getBoardsAction } from "./actions";
import type { Board } from "./types";
import { pickDefaultBoardId, setLastBoardId } from "./lastBoard";

export default function EvIsleriHomePage() {
  const { user, isLoaded } = useUser();
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
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
        setActiveBoardId(null);
        return;
      }
      const result = await getBoardsAction(user.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const nextBoards = result.data ?? [];
      setBoards(nextBoards);
      setActiveBoardId(pickDefaultBoardId(nextBoards));
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
      const created = result.data;
      setLastBoardId(created.id);
      setBoards((prev) => [created, ...prev]);
      setActiveBoardId(created.id);
      setShowCreate(false);
      setBoardName("");
      toast.success("Board oluşturuldu");
    } finally {
      setCreating(false);
    }
  }

  function handleBoardChange(boardId: string) {
    if (!boardId) {
      setActiveBoardId(null);
      return;
    }
    setLastBoardId(boardId);
    setActiveBoardId(boardId);
  }

  if (!isLoaded || loading) {
    return (
      <EvIsleriShell>
        <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </EvIsleriShell>
    );
  }

  if (!user) {
    return (
      <EvIsleriShell>
        <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center p-6 shadow-sm">
          <Broom size={40} className="text-app-muted mb-4" weight="duotone" />
          <p className="text-sm font-bold text-app-muted">Ev işlerini planlamak için giriş yap.</p>
        </div>
      </EvIsleriShell>
    );
  }

  if (activeBoardId) {
    return (
      <BoardDetailClient
        boardId={activeBoardId}
        boards={boards}
        onBoardsChange={setBoards}
        onBoardChange={handleBoardChange}
      />
    );
  }

  return (
    <EvIsleriShell>
      <Toaster position="top-center" />

      <div className="text-center py-16 bg-app-surface rounded-2xl border border-app-border">
        <Broom size={48} className="mx-auto text-app-muted mb-4" weight="duotone" />
        <p className="text-sm font-bold text-app-text mb-1">Henüz board yok</p>
        <p className="text-xs text-app-muted mb-4">Ev veya oda için bir board oluştur.</p>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black active:scale-95"
        >
          <Plus size={14} weight="bold" />
          İlk board&apos;u oluştur
        </button>
      </div>

      <CreateBoardDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        boardName={boardName}
        onBoardNameChange={setBoardName}
        onSubmit={(e) => void handleCreate(e)}
        creating={creating}
      />
    </EvIsleriShell>
  );
}
