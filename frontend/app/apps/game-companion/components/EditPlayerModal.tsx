"use client";

import { useState, useEffect } from "react";
import { X, Trash } from "@phosphor-icons/react";
import { Drawer } from "vaul";
import ConfirmModal from "./ConfirmModal";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";

const client = createBrowserClient();

interface EditPlayerModalProps {
  player: any;
  onClose: () => void;
  onUpdate: (updatedPlayer: any) => void;
  onDelete: (playerId: string) => void;
}

export default function EditPlayerModal({
  player,
  onClose,
  onUpdate,
  onDelete,
}: EditPlayerModalProps) {
  const { user: clerkUser } = useClerkUser();
  const [playerName, setPlayerName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (player) {
      setPlayerName(player.name);
    }
  }, [player]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !clerkUser || !player) return;

    setIsUpdating(true);
    try {
      const res = await client.yazboz.updatePlayer({
        userId: clerkUser.id,
        playerId: player.id || player._id,
        name: playerName.trim(),
        initial: playerName.trim().charAt(0).toUpperCase(),
      });

      if (res.player) {
        onUpdate({
          ...res.player,
          _id: res.player.id,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error updating player:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clerkUser || !player) return;
    setIsDeleting(true);
    try {
      const targetId = player.id || player._id;
      const res = await client.yazboz.deletePlayer({
        userId: clerkUser.id,
        playerId: targetId,
      });
      if (res.success) {
        onDelete(targetId);
      }
      onClose();
    } catch (error) {
      console.error("Error deleting player:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!player) {
    return null;
  }

  return (
    <>
      <Drawer.Root open={true} onOpenChange={(open) => !open && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/45 z-[60]" />
          <Drawer.Content
            className="h-fit fixed bottom-0 left-0 right-0 outline-none rounded-t-3xl z-[60]"
            style={{ backgroundColor: "var(--card-background)" }}
          >
            {/* Gesture bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-app-border rounded-full"></div>
            </div>
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-6 pt-4">
                <Drawer.Title className="text-xl font-bold text-app-text text-app-text">
                  Kişiyi Düzenle
                </Drawer.Title>
                <button
                  onClick={onClose}
                  className="p-2 text-app-muted  hover:text-app-text "
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-app-text  mb-2">
                    Kişi Adı
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Kişi adını girin"
                    className="w-full px-4 py-3 border border-blue-300 dark:border-blue-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-app-text placeholder:text-app-muted bg-app-surface"
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    className="flex-1 py-3 px-4 border border-red-300 dark:border-red-500 text-red-600 dark:text-red-400 rounded-lg font-medium flex items-center justify-center space-x-2"
                  >
                    <Trash size={16} />
                    <span>{isDeleting ? "Siliniyor..." : "Kaldır"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 px-4 border border-app-border text-app-muted rounded-lg font-medium hover:bg-app-surface-muted"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={!playerName.trim() || isUpdating}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                      !playerName.trim() || isUpdating
                        ? "bg-app-border text-app-muted  cursor-not-allowed"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    {isUpdating ? "Güncelleniyor..." : "Güncelle"}
                  </button>
                </div>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <ConfirmModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDeleteConfirm}
        title="Kişiyi Sil"
        message="Bu kişiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </>
  );
}
