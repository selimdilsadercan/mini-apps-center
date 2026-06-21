"use client";

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
        return "Movie";
      case "director":
        return "Director";
      case "actor":
        return "Actor";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "film":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "director":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "actor":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "bg-zinc-500/20 text-zinc-400";
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
    <div className="absolute right-6 top-6 bottom-6 w-80 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{getTypeIcon(node.type)}</div>
            <div>
              <span
                className={`inline-block px-2 py-0.5 text-xs rounded-full border ${getTypeColor(node.type)} mb-1`}
              >
                {getTypeLabel(node.type)}
              </span>
              <h3 className="text-lg font-semibold text-white">{node.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Bağlantılar */}
      <div className="flex-1 overflow-y-auto p-6">
        <h4 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Connections ({connectedNodes.length})
        </h4>

        {connectedNodes.length === 0 ? (
          <p className="text-zinc-500 text-sm">No connections yet</p>
        ) : (
          <div className="space-y-2">
            {connectedNodes.map((connected) => (
              <div
                key={connected.id}
                className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getTypeIcon(connected.type)}</span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {connected.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {getTypeLabel(connected.type)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-800/30">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">
              {connectedNodes.length}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-tighter font-bold">Connections</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {connectedNodes.filter((n) => n.type === "film").length}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-tighter font-bold">Movies</p>
          </div>
        </div>
      </div>
    </div>
  );
}
