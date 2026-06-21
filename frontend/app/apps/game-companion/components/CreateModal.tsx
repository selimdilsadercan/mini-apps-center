"use client";

import { useState } from "react";
import { X, User, Users } from "@phosphor-icons/react";
import { Drawer } from "vaul";
import AvatarGenerator from "./AvatarGenerator";

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "player" | "group";
  groups?: Array<{
    _id: string;
    name: string;
    description?: string;
  }>;
}

type ModalType = "player" | "group";

export default function CreateModal({ isOpen, onClose, type = "player", groups = [] }: CreateModalProps) {
  const [modalType, setModalType] = useState<ModalType>(type);

  // Player form state
  const [playerName, setPlayerName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [playerAvatar, setPlayerAvatar] = useState<string>("");

  // Group form state
  const [groupName, setGroupName] = useState("");

  const [isCreating, setIsCreating] = useState(false);

  // Local mocks
  const user = { uid: "u1" };
  const createPlayer = async (args: any) => console.log("Mock create player", args);
  const createGroup = async (args: any) => console.log("Mock create group", args);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      if (modalType === "player") {
        if (!playerName.trim()) return;
        if (!user) {
          console.error("User not authenticated");
          return;
        }
        await createPlayer({
          name: playerName.trim(),
          initial: playerName.trim().charAt(0).toUpperCase(),
          avatar: playerAvatar,
          groupId: selectedGroup || undefined,
          firebaseId: user.uid,
        });
      } else {
        if (!groupName.trim()) return;
        if (!user) {
          console.error("User not authenticated");
          return;
        }
        await createGroup({
          name: groupName.trim(),
          firebaseId: user.uid,
        });
      }

      onClose();
    } catch (error) {
      console.error("Error creating:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const selectGroup = (groupId: string) => {
    setSelectedGroup(selectedGroup === groupId ? null : groupId);
  };

  const resetForm = () => {
    setPlayerName("");
    setSelectedGroup(null);
    setPlayerAvatar("");
    setGroupName("");
  };

  const handleTypeChange = (type: ModalType) => {
    setModalType(type);
    resetForm();
  };

  const isFormValid =
    modalType === "player" ? playerName.trim() : groupName.trim();

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Drawer.Content className="bg-white dark:bg-[var(--card-background)] h-fit fixed bottom-0 left-0 right-0 outline-none rounded-t-3xl z-[70]">
          <div className="px-6 pb-6">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <Drawer.Title className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {modalType === "player" ? "Kişi Oluştur" : "Grup Oluştur"}
              </Drawer.Title>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Type Selection Cards */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => handleTypeChange("player")}
                className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                  modalType === "player"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    Kişi Oluştur
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange("group")}
                className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                  modalType === "group"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users size={24} className="text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    Grup Oluştur
                  </span>
                </div>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {modalType === "player" ? (
                <>
                  {/* Player Name Input with Avatar */}
                  <div>
                    <div className="flex items-center space-x-4">
                      {/* Avatar on the left */}
                      <div className="flex-shrink-0">
                        <AvatarGenerator
                          name={playerName.trim() || "Player"}
                          size={80}
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
                            className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Group Selection */}
                  {groups.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Grup Seçimi
                      </label>
                      <div className="space-y-2">
                        {groups.map((group) => (
                          <div
                            key={group._id}
                            className="flex items-center justify-between py-2"
                          >
                            <span className="text-gray-800">{group.name}</span>
                            <button
                              type="button"
                              onClick={() => selectGroup(group._id)}
                              className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                                selectedGroup === group._id
                                  ? "bg-blue-500 border-blue-500"
                                  : "bg-white border-blue-500"
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
                </>
              ) : (
                <>
                  {/* Group Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grup Adı
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Grup adını girin"
                      className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || isCreating}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                    !isFormValid || isCreating
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {isCreating ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
