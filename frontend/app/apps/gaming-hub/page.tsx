"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { GameController, Plus, Check, Trash, Books, Desktop, DeviceMobile } from "@phosphor-icons/react";
import { Drawer } from "vaul";
import { Toaster, toast } from "react-hot-toast";
import GamingHubShell, { type MainTab } from "./components/GamingHubShell";
import GameSearchInput from "./components/GameSearchInput";
import GameCover from "./components/GameCover";
import DiscoverScrollSection from "./components/DiscoverScrollSection";
import LibraryGameDetailModal from "./components/LibraryGameDetailModal";
import {
  catalogGameToDiscoverItem,
  webGameToDiscoverItem,
} from "./lib/discover";
import {
  deleteLibraryItemAction,
  discoverGamesAction,
  getLibraryAction,
  getWebGamesAction,
  upsertLibraryItemAction,
} from "./actions";
import type { gaming_hub } from "@/lib/client";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

function isPlayed(status: gaming_hub.GameStatus): boolean {
  return status === "completed" || status === "playing";
}

export default function GamingHubPage() {
  const { user, isLoaded } = useUser();
  const { confirm } = useConfirmDialog();

  const [library, setLibrary] = useState<gaming_hub.LibraryItem[]>([]);
  const [bilgisayarWeb, setBilgisayarWeb] = useState<gaming_hub.WebGame[]>([]);
  const [mobilGames, setMobilGames] = useState<gaming_hub.MobileGame[]>([]);
  const [popularGames, setPopularGames] = useState<gaming_hub.DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [discoverLoading, setDiscoverLoading] = useState(false);

  const [mainTab, setMainTab] = useState<MainTab>("discover");

  const [showAddGame, setShowAddGame] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [selectedGame, setSelectedGame] = useState<gaming_hub.CatalogGame | null>(null);
  const [addingGame, setAddingGame] = useState(false);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<gaming_hub.LibraryItem | null>(null);

  async function loadLibrary() {
    if (!user) {
      setLibrary([]);
      return;
    }

    const libRes = await getLibraryAction(user.id);
    if (libRes.error) toast.error(libRes.error);
    else setLibrary(libRes.data ?? []);
  }

  async function loadDiscover() {
    setDiscoverLoading(true);
    try {
      const [webRes, popularRes] = await Promise.all([
        getWebGamesAction(),
        discoverGamesAction("popular", 24),
      ]);
      if (webRes.error) toast.error(webRes.error);
      else {
        setBilgisayarWeb(webRes.data?.bilgisayarWeb ?? []);
        setMobilGames(webRes.data?.mobil ?? []);
      }
      if (popularRes.error) toast.error(popularRes.error);
      else setPopularGames((popularRes.data ?? []).map(catalogGameToDiscoverItem));
    } finally {
      setDiscoverLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded) return;
    void (async () => {
      try {
        setLoading(true);
        await loadLibrary();
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoaded, user?.id]);

  useEffect(() => {
    if (!isLoaded || !user || mainTab !== "discover") return;
    void loadDiscover();
  }, [isLoaded, user?.id, mainTab]);

  function resetAddForm() {
    setNewGameName("");
    setSelectedGame(null);
  }

  function handleGameSelect(game: gaming_hub.CatalogGame) {
    setNewGameName(game.title);
    setSelectedGame(game);
  }

  async function handleAddGame(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newGameName.trim()) return;

    setAddingGame(true);
    try {
      const result = await upsertLibraryItemAction({
        userId: user.id,
        gameName: newGameName.trim(),
        platform: "PC",
        status: "backlog",
        gameMode: "single",
        igdbId: selectedGame?.gameId,
        coverUrl: selectedGame?.coverUrl ?? undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Kütüphaneye eklendi");
      setShowAddGame(false);
      resetAddForm();
      await loadLibrary();
    } finally {
      setAddingGame(false);
    }
  }

  async function handleDeleteItem(item: gaming_hub.LibraryItem) {
    if (!user) return;

    const ok = await confirm({
      title: "Oyun silinsin mi?",
      description: `"${item.gameName}" kütüphaneden kaldırılacak.`,
      confirmText: "Sil",
      variant: "danger",
    });
    if (!ok) return;

    const result = await deleteLibraryItemAction(user.id, item.id);
    if (result.error || !result.data) {
      toast.error(result.error ?? "Silinemedi");
      return;
    }

    setLibrary((prev) => prev.filter((g) => g.id !== item.id));
    toast.success("Oyun silindi");
  }

  async function togglePlayed(item: gaming_hub.LibraryItem) {
    if (!user) return;

    const nextStatus = isPlayed(item.status) ? "backlog" : "completed";
    const result = await upsertLibraryItemAction({
      userId: user.id,
      gameName: item.gameName,
      platform: item.platform,
      status: nextStatus,
      gameMode: item.gameMode,
      igdbId: item.igdbId ?? undefined,
      coverUrl: item.coverUrl ?? undefined,
      playTime: item.playTime,
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setLibrary((prev) =>
      prev.map((g) => (g.id === item.id ? { ...g, status: nextStatus } : g))
    );
  }

  const shellProps = {
    activeMainTab: mainTab,
    onMainTabChange: setMainTab,
  };

  if (!isLoaded || loading) {
    return (
      <GamingHubShell {...shellProps}>
        <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </GamingHubShell>
    );
  }

  if (!user) {
    return (
      <GamingHubShell {...shellProps}>
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/50 flex flex-col items-center justify-center p-6 shadow-sm">
          <GameController size={40} className="text-gray-200 mb-4" weight="duotone" />
          <p className="text-sm font-bold text-gray-500 mb-1">Giriş yapmalısın</p>
          <p className="text-xs text-gray-400">Oyunlarını takip etmek için oturum aç.</p>
        </div>
      </GamingHubShell>
    );
  }

  return (
    <GamingHubShell
      {...shellProps}
      headerRight={
        mainTab === "library" ? (
          <button
            onClick={() => setShowAddGame(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-violet-600 text-white text-[10px] font-black uppercase tracking-wide active:scale-95"
          >
            <Plus size={14} weight="bold" />
            Ekle
          </button>
        ) : undefined
      }
    >
      <Toaster position="top-center" />

      {mainTab === "discover" ? (
        discoverLoading ? (
          <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            Oyunlar yükleniyor...
          </div>
        ) : (
          <div className="space-y-5">
            <DiscoverScrollSection
              title="Web"
              icon={Desktop}
              category="bilgisayar-web"
              items={bilgisayarWeb.map(webGameToDiscoverItem)}
            />
            <DiscoverScrollSection
              title="Mobil"
              icon={DeviceMobile}
              category="mobil"
              items={mobilGames.map(webGameToDiscoverItem)}
              emptyMessage="Yakında Play Store ve App Store oyunları"
            />
            <DiscoverScrollSection
              title="Popüler Oyunlar"
              icon={GameController}
              category="populer"
              items={popularGames}
              aspect="poster"
              emptyMessage="Öneri bulunamadı"
            />
          </div>
        )
      ) : library.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Books size={48} className="mx-auto text-gray-200 mb-4" weight="duotone" />
          <p className="text-sm font-bold text-gray-500 mb-1">Kütüphanen boş</p>
          <p className="text-xs text-gray-400 mb-4">
            Oyunlarını ekle ve oynadıkça işaretle.
          </p>
          <button
            onClick={() => setShowAddGame(true)}
            className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-black active:scale-95"
          >
            Oyun ekle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {library.map((item) => {
            const played = isPlayed(item.status);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-3 px-3 py-3">
                  <button
                    type="button"
                    onClick={() => setSelectedLibraryItem(item)}
                    className="flex flex-1 items-center gap-3 min-w-0 text-left active:opacity-80"
                  >
                    <GameCover
                      coverUrl={item.coverUrl}
                      title={item.gameName}
                      igdbId={item.igdbId}
                      className="w-14 h-[4.5rem] rounded-xl"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 line-clamp-2">{item.gameName}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void togglePlayed(item);
                    }}
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide active:scale-95 transition-colors ${
                      played
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-gray-50 text-gray-400 border border-gray-200"
                    }`}
                  >
                    <Check size={12} weight={played ? "bold" : "regular"} />
                    {played ? "Oynandı" : "Oynanmadı"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDeleteItem(item);
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    aria-label="Sil"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LibraryGameDetailModal
        open={selectedLibraryItem != null}
        item={selectedLibraryItem}
        onClose={() => setSelectedLibraryItem(null)}
      />

      <Drawer.Root
        open={showAddGame}
        onOpenChange={(open) => {
          setShowAddGame(open);
          if (!open) resetAddForm();
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/25 z-40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl outline-none max-w-xl mx-auto border-t border-gray-100 shadow-xl">
            <div className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-gray-200" />
            <div className="px-5 pb-6 pt-2">
              <Drawer.Title className="text-sm font-black text-gray-900 mb-1">Oyun ekle</Drawer.Title>
              <p className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-wider">
                Kütüphanem
              </p>

              <form onSubmit={(e) => void handleAddGame(e)} className="space-y-4">
                {selectedGame && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <GameCover
                      coverUrl={selectedGame.coverUrl}
                      title={selectedGame.title}
                      className="w-12 h-16 rounded-lg"
                    />
                    <p className="text-sm font-black text-gray-900 line-clamp-2">{selectedGame.title}</p>
                  </div>
                )}

                <GameSearchInput
                  value={newGameName}
                  onChange={(v) => {
                    setNewGameName(v);
                    if (selectedGame && v.trim() !== selectedGame.title) {
                      setSelectedGame(null);
                    }
                  }}
                  onSelect={handleGameSelect}
                  placeholder="Oyun adı yaz..."
                />

                <button
                  type="submit"
                  disabled={addingGame || !newGameName.trim()}
                  className="w-full py-3 rounded-2xl bg-violet-600 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  {addingGame ? (
                    "Ekleniyor..."
                  ) : (
                    <>
                      <Check size={14} weight="bold" />
                      Kütüphaneye ekle
                    </>
                  )}
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </GamingHubShell>
  );
}
