"use client";

import { useState, useEffect } from "react";
import { X, Trash } from "@phosphor-icons/react";
import { Drawer } from "vaul";
import AvatarGenerator from "./AvatarGenerator";
import ConfirmModal from "./ConfirmModal";
import { MOCK_PLAYERS, MOCK_GROUPS } from "../lib/mock-data";

interface EditPlayerModalProps {
  playerId: string;
  onClose: () => void;
  groups: any[];
}

// UI-only mode logic: Mocking the database hooks
const useQueryMock = (apiPath: string, args?: any): any => {
  if (apiPath.includes("getPlayerById")) return MOCK_PLAYERS.find(p => p._id === args?.id) || MOCK_PLAYERS[0];
  return undefined;
};

const useMutationMock = (apiPath: string) => async (args: any) => {
  console.log("Mock mutation called:", apiPath, args);
  return { _id: "new-id" };
};

export default function EditPlayerModal({
  playerId,
  onClose,
  groups,
}: EditPlayerModalProps) {
  const [playerName, setPlayerName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [playerAvatar, setPlayerAvatar] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const currentPlayer = useQueryMock("api.players.getPlayerById", { id: playerId });

  const updatePlayer = useMutationMock("api.players.updatePlayer");
  const deletePlayer = useMutationMock("api.players.deletePlayer");

  useEffect(() => {
    if (currentPlayer) {
      setPlayerName(currentPlayer.name);
      setPlayerAvatar(currentPlayer.avatar || "");
      if (currentPlayer.groupId) {
        setSelectedGroup(currentPlayer.groupId);
      }
    }
  }, [currentPlayer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    setIsUpdating(true);
    try {
      await updatePlayer({
        id: playerId,
        name: playerName.trim(),
        initial: playerName.trim().charAt(0).toUpperCase(),
        avatar: playerAvatar,
        groupId: selectedGroup || undefined,
      });

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
    setIsDeleting(true);
    try {
      await deletePlayer({ id: playerId });
      onClose();
    } catch (error) {
      console.error("Error deleting player:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const selectGroup = (groupId: string) => {
    setSelectedGroup(selectedGroup === groupId ? null : groupId);
  };

  if (!currentPlayer) {
    return null;
  }

  return (
    <>
      <Drawer.Root open={true} onOpenChange={(open) => !open && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 opacity-100 z-[60]" />
          <Drawer.Content className="bg-white dark:bg-[#1C1922] h-fit fixed bottom-0 left-0 right-0 outline-none rounded-t-3xl z-[60]">
            {/* Gesture bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-6 pt-4">
                <Drawer.Title className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  Kişiyi Düzenle
                </Drawer.Title>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Player Name Input with Avatar */}
                <div>
                  <div className="flex items-center space-x-4">
                    {/* Avatar on the left */}
                    <div className="flex-shrink-0">
                      <AvatarGenerator
                        name={playerName.trim() || "Player"}
                        size={80}
                        initialAvatar={playerAvatar}
                        onAvatarChange={setPlayerAvatar}
                      />
                    </div>

                    {/* Column with name input */}
                    <div className="flex-1">
                      {/* Name input */}
                      <div>
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="Kişi adını girin"
                          className="w-full px-4 py-3 border border-blue-300 dark:border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-[var(--card-background)]"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Selection */}
                {groups.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Grup Seçimi
                    </label>
                    <div className="space-y-2">
                      {groups.map((group) => (
                        <div
                          key={group._id}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-gray-800 dark:text-gray-200">
                            {group.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => selectGroup(group._id)}
                            className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                              selectedGroup === group._id
                                ? "bg-blue-500 border-blue-500"
                                : "bg-white dark:bg-gray-700 border-blue-500 dark:border-blue-400"
                            }`}
                          >
                            {selectedGroup === group._id && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                    className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={!playerName.trim() || isUpdating}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                      !playerName.trim() || isUpdating
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
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
