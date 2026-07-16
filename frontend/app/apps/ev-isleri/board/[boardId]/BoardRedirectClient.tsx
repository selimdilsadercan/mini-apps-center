"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setLastBoardId } from "../../lastBoard";

export default function BoardRedirectClient({ boardId }: { boardId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (boardId && boardId !== "default") {
      setLastBoardId(boardId);
    }
    router.replace("/apps/ev-isleri");
  }, [boardId, router]);

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center text-xs font-bold text-app-muted uppercase tracking-widest animate-pulse">
      Yükleniyor...
    </div>
  );
}
