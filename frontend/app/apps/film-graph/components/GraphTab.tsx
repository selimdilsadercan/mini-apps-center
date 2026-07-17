"use client";

import dynamic from "next/dynamic";
import { GraphData, GraphNode } from "../types";
import NodeDetailPanel from "./NodeDetailPanel";

const FilmGraph = dynamic(() => import("./FilmGraph"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500" />
    </div>
  ),
});

interface GraphTabProps {
  graphData: GraphData;
  selectedNode: GraphNode | null;
  connectedNodes: GraphNode[];
  onNodeClick: (node: GraphNode) => void;
  onClosePanel: () => void;
  filmCount: number;
}

export default function GraphTab({
  graphData,
  selectedNode,
  connectedNodes,
  onNodeClick,
  onClosePanel,
  filmCount,
}: GraphTabProps) {
  if (filmCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <p className="text-4xl mb-3">🕸️</p>
        <p className="text-sm font-bold text-app-text">Graph için film gerekli</p>
        <p className="text-xs text-app-muted mt-2 max-w-xs">
          Keşfet veya Listem sekmesinden film ekledikten sonra oyuncu ve yönetmen
          bağlantılarını burada gör.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[420px]">
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <p className="text-[10px] font-black text-app-muted uppercase tracking-widest bg-app-surface/90 border border-app-border px-2 py-1 rounded-lg backdrop-blur-sm">
          {graphData.nodes.length} node · {graphData.links.length} link
        </p>
      </div>

      <FilmGraph data={graphData} onNodeClick={onNodeClick} />

      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={onClosePanel}
          connectedNodes={connectedNodes}
        />
      )}
    </div>
  );
}
