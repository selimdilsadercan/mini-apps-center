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
        className="bg-app-surface rounded-lg w-full max-w-md shadow-xl"
        style={{ boxShadow: "0 0 8px 5px #297dff0a" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-border">
          <h2 className="text-xl font-bold text-app-text text-app-text">
            Yeni Oyun Ekle
          </h2>
          <button
            onClick={handleClose}
            className="text-app-muted  hover:text-app-muted  transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-app-text mb-2">
              Oyun Adı
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Oyun adını girin..."
              className="w-full px-3 py-2 border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-app-text"
              required
              autoFocus
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-app-surface-muted text-app-text py-2 px-4 rounded-lg hover:bg-app-border/30 transition-colors font-medium"
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
