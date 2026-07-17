"use client";

import { X } from "@phosphor-icons/react";
import { GraphNode } from "../types";

interface NodeDetailPanelProps {
  node: GraphNode | null;
  onClose: () => void;
  connectedNodes: GraphNode[];
}

export default function NodeDetailPanel({
  node,
  onClose,
  connectedNodes,
}: NodeDetailPanelProps) {
  if (!node) return null;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "film":
        return "Film";
      case "director":
        return "Yönetmen";
      case "actor":
        return "Oyuncu";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "film":
        return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
      case "director":
        return "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30";
      case "actor":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      default:
        return "bg-app-surface-muted text-app-muted border-app-border";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "film":
        return "🎬";
      case "director":
        return "🎥";
      case "actor":
        return "⭐";
      default:
        return "📍";
    }
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-72 sm:w-80 bg-app-surface/95 backdrop-blur-xl border border-app-border rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10">
      <div className="p-5 border-b border-app-border">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-2xl shrink-0">{getTypeIcon(node.type)}</div>
            <div className="min-w-0">
              <span
                className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wide rounded-full border ${getTypeColor(node.type)} mb-1`}
              >
                {getTypeLabel(node.type)}
              </span>
              <h3 className="text-base font-black text-app-text leading-tight truncate">
                {node.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-app-surface-muted rounded-lg transition-colors text-app-muted hover:text-app-text shrink-0"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <h4 className="text-[10px] font-black text-app-muted uppercase tracking-widest mb-3">
          Bağlantılar ({connectedNodes.length})
        </h4>

        {connectedNodes.length === 0 ? (
          <p className="text-app-muted text-sm">Henüz bağlantı yok</p>
        ) : (
          <div className="space-y-2">
            {connectedNodes.map((connected) => (
              <div
                key={connected.id}
                className="p-3 bg-app-surface-muted rounded-xl border border-app-border hover:border-app-muted transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getTypeIcon(connected.type)}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-app-text truncate">
                      {connected.name}
                    </p>
                    <p className="text-[10px] text-app-muted uppercase tracking-wide font-black">
                      {getTypeLabel(connected.type)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-app-border bg-app-surface-muted/50">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-black text-app-text">
              {connectedNodes.length}
            </p>
            <p className="text-[10px] text-app-muted uppercase tracking-widest font-black">
              Bağlantı
            </p>
          </div>
          <div>
            <p className="text-2xl font-black text-app-text">
              {connectedNodes.filter((n) => n.type === "film").length}
            </p>
            <p className="text-[10px] text-app-muted uppercase tracking-widest font-black">
              Film
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
