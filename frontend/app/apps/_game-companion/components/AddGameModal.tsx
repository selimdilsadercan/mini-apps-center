"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGame: (gameName: string) => void;
}

export default function AddGameModal({
  isOpen,
  onClose,
  onAddGame,
}: AddGameModalProps) {
  const [gameName, setGameName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameName.trim()) {
      onAddGame(gameName.trim());
      setGameName("");
      onClose();
    }
  };

  const handleClose = () => {
    setGameName("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#00000080] flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-[var(--card-background)] rounded-lg w-full max-w-md shadow-xl"
        style={{ boxShadow: "0 0 8px 5px #297dff0a" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black dark:text-gray-200">
            Yeni Oyun Ekle
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-black mb-2">
              Oyun Adı
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Oyun adını girin..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              required
              autoFocus
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-300 text-black py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
