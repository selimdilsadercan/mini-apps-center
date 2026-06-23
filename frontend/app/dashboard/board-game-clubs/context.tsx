"use client";

import { createContext, useContext, useState, useEffect, ReactNode, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { board_game_clubs, business } from "@/lib/client";
import { toast } from "react-hot-toast";
import { getClubByBusinessIdAction } from "@/app/apps/board-game-clubs/actions";

const client = createBrowserClient();

interface BoardGameClubsContextType {
  id: string;
  loading: boolean;
  business: business.Business | null;
  club: board_game_clubs.Club | null;
  refreshData: () => Promise<void>;
}

const BoardGameClubsContext = createContext<BoardGameClubsContextType | undefined>(undefined);

function BoardGameClubsProviderInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const { user, isLoaded: isUserLoaded } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [bizData, setBizData] = useState<business.Business | null>(null);
  const [clubData, setClubData] = useState<board_game_clubs.Club | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [bizRes, clubRes] = await Promise.all([
        client.business.getBusiness(id),
        getClubByBusinessIdAction(id)
      ]);

      if (bizRes.business) {
        setBizData(bizRes.business);
      }
      if (clubRes.data) {
        setClubData(clubRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Bilgiler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded && user && id) {
      loadData();
    }
  }, [isUserLoaded, user, id]);

  return (
    <BoardGameClubsContext.Provider value={{
      id,
      loading,
      business: bizData,
      club: clubData,
      refreshData: loadData
    }}>
      {children}
    </BoardGameClubsContext.Provider>
  );
}

export function useBoardGameClubs() {
  const context = useContext(BoardGameClubsContext);
  if (context === undefined) {
    throw new Error("useBoardGameClubs must be used within a BoardGameClubsProvider");
  }
  return context;
}

export function BoardGameClubsProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#FDFBF9]">
          <div className="w-12 h-12 border-4 border-[#D4A830]/10 border-t-[#D4A830] rounded-full animate-spin" />
        </div>
      }
    >
      <BoardGameClubsProviderInner>{children}</BoardGameClubsProviderInner>
    </Suspense>
  );
}
