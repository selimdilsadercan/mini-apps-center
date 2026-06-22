"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { Drawer } from "vaul";

import { useUser as useClerkUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";

const client = createBrowserClient();

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "player" | "group"; // Kept for API compatibility, unused in UI
  groups?: Array<{
    _id: string;
    name: string;
    description?: string;
  }>;
  onPlayerCreated?: (player: any) => void;
}

export default function CreateModal({ isOpen, onClose, onPlayerCreated }: CreateModalProps) {
  const { user: clerkUser } = useClerkUser();
  const [playerName, setPlayerName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !clerkUser) return;
    
    setIsCreating(true);

    try {
      const name = playerName.trim();
      const initial = name.charAt(0).toUpperCase();
      const res = await client.yazboz.createPlayer({
        userId: clerkUser.id,
        name,
        initial,
      });

      if (res.player) {
        // Map _id for frontend compatibility
        const mappedPlayer = {
          ...res.player,
          _id: res.player.id,
        };
        onPlayerCreated?.(mappedPlayer);
      }

      setPlayerName("");
      onClose();
    } catch (error) {
      console.error("Error creating player:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid = playerName.trim().length > 0;

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/45 z-[60]" />
        <Drawer.Content
          className="h-fit fixed bottom-0 left-0 right-0 outline-none rounded-t-3xl z-[70]"
          style={{ backgroundColor: "var(--card-background)" }}
        >
          <div className="px-6 pb-6">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-8 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <Drawer.Title className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Kişi Oluştur
              </Drawer.Title>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kişi Adı
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Kişi adını girin"
                  className="w-full px-4 py-3 border border-blue-300 dark:border-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800"
                  required
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-gray-350 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || isCreating}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    !isFormValid || isCreating
                      ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-450 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
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
