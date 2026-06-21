"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { GraphData, GraphNode } from "../types";

interface FilmGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
}

export default function FilmGraph({ data, onNodeClick }: FilmGraphProps) {
  const graphRef = useRef<ForceGraphMethods<GraphNode, object> | undefined>(
    undefined,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Container boyutunu takip et
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Graph yüklendiğinde zoom ayarla
  useEffect(() => {
    if (graphRef.current && data.nodes.length > 0) {
      setTimeout(() => {
        graphRef.current?.zoomToFit(400, 20);
      }, 500);
    }
  }, [data]);

  // Node boyutunu hesapla
  const getNodeVal = useCallback((node: GraphNode) => {
    return node.val || (node.type === "film" ? 8 : 5);
  }, []);

  // Node rengini belirle
  const getNodeColor = useCallback((node: GraphNode) => {
    switch (node.type) {
      case "film":
        return "#ef4444";
      case "director":
        return "#22c55e";
      case "actor":
        return "#3b82f6";
      default:
        return "#9ca3af";
    }
  }, []);

  // Link rengini belirle
  const getLinkColor = useCallback((link: unknown) => {
    const linkObj = link as { role?: string };
    return linkObj.role === "director"
      ? "rgba(34, 197, 94, 0.4)"
      : "rgba(59, 130, 246, 0.3)";
  }, []);

  // Image cache
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Node çizim fonksiyonu
  const drawNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const size = getNodeVal(node) * 1.5;
      const x = node.x || 0;
      const y = node.y || 0;

      // Resim varsa ve yüklendiyse çiz
      if (node.imgUrl) {
        let img = imgCache.current.get(node.imgUrl);
        if (!img) {
          img = new Image();
          img.src = node.imgUrl;
          img.onload = () => {
            // Re-render tetiklemek için bir state gerekebilir ama canvas render döngüsü genelde halleder
          };
          imgCache.current.set(node.imgUrl, img);
        }

        if (img.complete && img.naturalWidth !== 0) {
          ctx.save();
          if (node.type === "film") {
            // Film posteri (Dikdörtgen)
            const w = size * 1.2;
            const h = size * 1.8;

            // Border/Shadow
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 10 / globalScale;
            ctx.fillStyle = "#111";
            ctx.fillRect(x - w / 2, y - h / 2, w, h);

            ctx.beginPath();
            ctx.rect(x - w / 2, y - h / 2, w, h);
            ctx.clip();
            ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
          } else {
            // Kişi (Daire)
            const r = size;

            // Outer Ring
            ctx.beginPath();
            ctx.arc(x, y, r + 1, 0, 2 * Math.PI, false);
            ctx.fillStyle = getNodeColor(node);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI, false);
            ctx.clip();
            ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
          }
          ctx.restore();
        } else {
          // Resim yüklenene kadar veya yoksa renkli daire
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI, false);
          ctx.fillStyle = getNodeColor(node);
          ctx.fill();
        }
      } else {
        // Resim yoksa standart daire
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI, false);
        ctx.fillStyle = getNodeColor(node);
        ctx.fill();
      }

      // Seçili node efekti
      // @ts-ignore
      if (node.id === node.selectedId) {
        ctx.beginPath();
        ctx.arc(x, y, size + 2, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      }
    },
    [getNodeColor, getNodeVal],
  );

  // Node etiketini çiz
  const drawNodeLabel = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const fontSize = Math.max(10 / globalScale, 2.5);
      const size = getNodeVal(node) * 1.5;
      const yOffset =
        node.type === "film" ? size * 1.1 : size + 5 / globalScale;

      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // Arka plan
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth + 4, fontSize + 2];

      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(
        node.x! - bckgDimensions[0] / 2,
        node.y! + yOffset,
        bckgDimensions[0],
        bckgDimensions[1],
      );

      // Metin
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, node.x!, node.y! + yOffset + 1);
    },
    [getNodeVal],
  );

  if (data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-zinc-500">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-lg text-white">Loading data...</p>
          Populating movie connections
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-zinc-950 overflow-hidden"
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="transparent"
        nodeVal={getNodeVal}
        nodeLabel={(node) =>
          `${node.name} (${node.type === "film" ? "Movie" : node.type === "director" ? "Director" : "Actor"})`
        }
        linkColor={getLinkColor}
        linkWidth={1.5}
        linkDirectionalParticles={1}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.003}
        onNodeClick={(node) => onNodeClick?.(node as GraphNode)}
        nodeCanvasObject={drawNode}
        nodeCanvasObjectMode={() => "replace"}
        onRenderFramePre={(ctx, globalScale) => {
          // Etiketleri düğümlerin üzerine çizmek için custom render logic
          data.nodes.forEach((node) => drawNodeLabel(node, ctx, globalScale));
        }}
        cooldownTicks={100}
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.2}
      />
    </div>
  );
}
