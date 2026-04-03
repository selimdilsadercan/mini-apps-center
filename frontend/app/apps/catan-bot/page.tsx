"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowClockwise,
  Robot,
  Play,
  Eye,
  MapPin,
  Path,
  Lightning,
  Trophy,
  Pause,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────
type ResourceType = "wood" | "brick" | "sheep" | "wheat" | "ore" | "desert";

interface Port {
  id: string;
  type: ResourceType | "generic";
  v1Id: string;
  v2Id: string;
  x: number;
  y: number;
  angle: number;
}

interface HexTile {
  q: number;
  r: number;
  s: number;
  resource: ResourceType;
  number: number | null;
  id: string;
}

interface Vertex {
  id: string;
  x: number;
  y: number;
  adjacentHexIds: string[];
  score: number;
  building: { type: "settlement" | "city"; player: number } | null;
  port: Port | null;
}

interface Edge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  v1Id: string;
  v2Id: string;
  road: number | null;
}

// ─── Constants ───────────────────────────────────────────
const HEX_SIZE = 52;
const SQRT3 = Math.sqrt(3);

const RESOURCE_CONFIG: Record<
  ResourceType,
  { fill: string; stroke: string; emoji: string; label: string }
> = {
  wood: { fill: "#1B5E20", stroke: "#2E7D32", emoji: "🌲", label: "Kereste" },
  brick: { fill: "#BF360C", stroke: "#E64A19", emoji: "🧱", label: "Tuğla" },
  sheep: { fill: "#558B2F", stroke: "#7CB342", emoji: "🐑", label: "Yün" },
  wheat: { fill: "#F57F17", stroke: "#FBC02D", emoji: "🌾", label: "Buğday" },
  ore: { fill: "#37474F", stroke: "#546E7A", emoji: "⛰️", label: "Maden" },
  desert: { fill: "#C8A951", stroke: "#D4B963", emoji: "🏜️", label: "Çöl" },
};

const PLAYER_COLORS = ["#E53935", "#1E88E5", "#FF8F00", "#43A047"];
const PLAYER_NAMES = ["Kırmızı Bot", "Mavi Bot", "Turuncu Bot", "Yeşil Bot"];

// ─── Hex Math ────────────────────────────────────────────
function hexToPixel(q: number, r: number) {
  return {
    x: HEX_SIZE * (SQRT3 * q + (SQRT3 / 2) * r),
    y: HEX_SIZE * ((3 / 2) * r),
  };
}

function hexCornerPx(cx: number, cy: number, i: number) {
  const angle = (Math.PI / 180) * (60 * i - 30);
  return {
    x: cx + HEX_SIZE * Math.cos(angle),
    y: cy + HEX_SIZE * Math.sin(angle),
  };
}

function hexPolygonPoints(cx: number, cy: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const c = hexCornerPx(cx, cy, i);
    return `${c.x},${c.y}`;
  }).join(" ");
}

// ─── Board Generation ────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getHexDist(
  h1: { q: number; r: number },
  h2: { q: number; r: number },
) {
  return (
    (Math.abs(h1.q - h2.q) +
      Math.abs(h1.q + h1.r - h2.q - h2.r) +
      Math.abs(h1.r - h2.r)) /
    2
  );
}

function generateBoard(): HexTile[] {
  const coords: [number, number, number][] = [];
  for (let q = -2; q <= 2; q++) {
    for (let r = -2; r <= 2; r++) {
      const s = -q - r;
      if (Math.abs(s) <= 2) coords.push([q, r, s]);
    }
  }

  const pool: ResourceType[] = shuffle([
    ...Array(4).fill("wood"),
    ...Array(3).fill("brick"),
    ...Array(4).fill("sheep"),
    ...Array(4).fill("wheat"),
    ...Array(3).fill("ore"),
    "desert",
  ] as ResourceType[]);

  const baseNums = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

  let attempts = 0;
  let finalHexes: HexTile[] = [];

  while (attempts < 500) {
    const nums = shuffle([...baseNums]);
    let ni = 0;

    const tempHexes = coords.map(([q, r, s], idx) => {
      const res = pool[idx];
      return {
        q,
        r,
        s,
        resource: res,
        number: res === "desert" ? null : nums[ni++],
        id: `${q},${r},${s}`,
      };
    });

    // Check if any 6 or 8 is adjacent to another 6 or 8
    const reds = tempHexes.filter((h) => h.number === 6 || h.number === 8);
    let hasConflict = false;
    for (let i = 0; i < reds.length; i++) {
      for (let j = i + 1; j < reds.length; j++) {
        if (getHexDist(reds[i], reds[j]) === 1) {
          hasConflict = true;
          break;
        }
      }
      if (hasConflict) break;
    }

    if (!hasConflict) {
      finalHexes = tempHexes;
      break;
    }
    attempts++;
  }

  return finalHexes;
}

// ─── Vertex & Edge Computation ───────────────────────────
function vKey(x: number, y: number) {
  return `${Math.round(x)},${Math.round(y)}`;
}

function computeGraph(hexes: HexTile[]) {
  const vMap = new Map<string, Vertex>();
  const eMap = new Map<string, Edge>();

  for (const hex of hexes) {
    const { x: cx, y: cy } = hexToPixel(hex.q, hex.r);
    const corners = Array.from({ length: 6 }, (_, i) => hexCornerPx(cx, cy, i));

    for (let i = 0; i < 6; i++) {
      const c = corners[i];
      const key = vKey(c.x, c.y);

      if (!vMap.has(key)) {
        vMap.set(key, {
          id: key,
          x: c.x,
          y: c.y,
          adjacentHexIds: [hex.id],
          score: 0,
          building: null,
          port: null,
        });
      } else {
        const v = vMap.get(key)!;
        if (!v.adjacentHexIds.includes(hex.id)) v.adjacentHexIds.push(hex.id);
      }

      const next = corners[(i + 1) % 6];
      const nk = vKey(next.x, next.y);
      const ek = key < nk ? `${key}|${nk}` : `${nk}|${key}`;

      if (!eMap.has(ek)) {
        eMap.set(ek, {
          id: ek,
          x1: c.x,
          y1: c.y,
          x2: next.x,
          y2: next.y,
          v1Id: key,
          v2Id: nk,
          road: null,
        });
      }
    }
  }

  const vertices = Array.from(vMap.values());
  const edges = Array.from(eMap.values());

  // Identify perimeter edges (edges belonging to only 1 hex)
  const borderEdges = edges.filter((e) => {
    const v1 = vMap.get(e.v1Id)!;
    const v2 = vMap.get(e.v2Id)!;
    // A border edge connects two vertices that share the same single hex
    const commonHexes = v1.adjacentHexIds.filter((id) =>
      v2.adjacentHexIds.includes(id),
    );
    return commonHexes.length === 1;
  });

  // Assign ports to specific border edges (9 ports total)
  const portPool: (ResourceType | "generic")[] = shuffle([
    "wood",
    "brick",
    "sheep",
    "wheat",
    "ore",
    "generic",
    "generic",
    "generic",
    "generic",
  ]);

  // Sort border edges around the circle to distribute ports
  borderEdges.sort((a, b) => {
    const angA = Math.atan2((a.y1 + a.y2) / 2, (a.x1 + a.x2) / 2);
    const angB = Math.atan2((b.y1 + b.y2) / 2, (b.x1 + b.x2) / 2);
    return angA - angB;
  });

  // Manually pick 9 edges and their ideal angles
  const portIndices = [0, 3, 7, 10, 13, 17, 20, 23, 27];
  const portAngles = [180, 240, 240, 300, 0, 0, 60, 120, 120];

  const ports: Port[] = [];
  for (let i = 0; i < portPool.length; i++) {
    const edge = borderEdges[portIndices[i] % borderEdges.length];
    const midX = (edge.x1 + edge.x2) / 2;
    const midY = (edge.y1 + edge.y2) / 2;
    const angleDeg = portAngles[i];
    const angleRad = (angleDeg * Math.PI) / 180;

    const port: Port = {
      id: `port-${i}`,
      type: portPool[i],
      v1Id: edge.v1Id,
      v2Id: edge.v2Id,
      x: midX + Math.cos(angleRad) * 18,
      y: midY + Math.sin(angleRad) * 18,
      angle: angleDeg,
    };
    ports.push(port);

    vMap.get(edge.v1Id)!.port = port;
    vMap.get(edge.v2Id)!.port = port;
  }

  return { vertices, edges, ports, borderEdges };
}

// ─── Scoring ─────────────────────────────────────────────
function pipCount(n: number | null): number {
  if (n === null) return 0;
  return 6 - Math.abs(n - 7);
}

function scoreVertex(v: Vertex, hexes: HexTile[]): number {
  const adj = v.adjacentHexIds
    .map((id) => hexes.find((h) => h.id === id)!)
    .filter(Boolean);
  if (adj.length === 0) return 0;

  let pips = 0;
  for (const h of adj) pips += pipCount(h.number);

  const unique = new Set(
    adj.map((h) => h.resource).filter((r) => r !== "desert"),
  );
  const divMul = unique.size >= 3 ? 1.5 : unique.size >= 2 ? 1.2 : 1.0;

  let bonus = 0;
  if (unique.has("brick")) bonus += 1;
  if (unique.has("wood")) bonus += 1;
  if (unique.has("wheat")) bonus += 0.8;
  if (unique.has("ore")) bonus += 0.8;
  if (unique.has("sheep")) bonus += 0.5;

  // Port Bonus
  if (v.port) {
    if (v.port.type === "generic") {
      bonus += 1.5; // 3:1 is always good
    } else {
      const pType = v.port.type as ResourceType;
      if (unique.has(pType)) {
        bonus += 3.0; // 2:1 is amazing if you produce that resource here
      } else {
        bonus += 0.5; // Still a port
      }
    }
  }

  return Math.round((pips * divMul + bonus) * 10) / 10;
}

function scoreColor(score: number, maxScore: number): string {
  if (maxScore === 0) return "rgba(255,255,255,0.15)";
  const t = score / maxScore;
  if (t > 0.75) return "#22C55E";
  if (t > 0.5) return "#84CC16";
  if (t > 0.25) return "#FACC15";
  return "#EF4444";
}

// ─── Main Component ──────────────────────────────────────
const DEBUG_MODE = false;

export default function CatanBot() {
  const router = useRouter();

  const [hexes, setHexes] = useState<HexTile[]>([]);
  const [vertices, setVertices] = useState<Vertex[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [borderEdges, setBorderEdges] = useState<Edge[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [showScores, setShowScores] = useState(false);
  const [scanningIdx, setScanningIdx] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [logs, setLogs] = useState<string[]>(["Sistem hazır. Tahta oluştur."]);
  const [hoveredVertex, setHoveredVertex] = useState<string | null>(null);
  const [phase, setPhase] = useState<
    "idle" | "analyzing" | "placing" | "road" | "done"
  >("idle");
  const [placementRound, setPlacementRound] = useState(0);

  const resetBoard = useCallback(() => {
    const h = generateBoard();
    const {
      vertices: v,
      edges: e,
      ports: p,
      borderEdges: be,
    } = computeGraph(h);
    const scored = v.map((vtx) => ({ ...vtx, score: scoreVertex(vtx, h) }));
    setHexes(h);
    setVertices(scored);
    setEdges(e);
    setBorderEdges(be);
    setPorts(p);
    setShowScores(false);
    setScanningIdx(null);
    setIsRunning(false);
    setCurrentPlayer(0);
    setPhase("idle");
    setPlacementRound(0);
    setLogs(["Yeni tahta oluşturuldu."]);
  }, []);

  useEffect(() => {
    resetBoard();
  }, [resetBoard]);

  const addLog = (msg: string) => setLogs((p) => [msg, ...p].slice(0, 12));

  const maxScore = useMemo(
    () => Math.max(...vertices.map((v) => v.score), 1),
    [vertices],
  );

  // adjacency check: no settlement within 1 edge distance
  const isValidPlacement = useCallback(
    (v: Vertex) => {
      if (v.building) return false;
      // distance rule: no adjacent vertex has a building
      for (const e of edges) {
        if (e.v1Id === v.id || e.v2Id === v.id) {
          const neighborId = e.v1Id === v.id ? e.v2Id : e.v1Id;
          const neighbor = vertices.find((vt) => vt.id === neighborId);
          if (neighbor?.building) return false;
        }
      }
      // must touch at least 2 hexes (avoid edge-of-board single-hex vertices)
      if (v.adjacentHexIds.length < 2) return false;
      return true;
    },
    [edges, vertices],
  );

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // ─── Bot Demo ────────────────────────────────────────
  const runBotDemo = async () => {
    if (isRunning) return;
    setIsRunning(true);

    // Catan initial placement: P0, P1, P2, P3, P3, P2, P1, P0 (snake draft)
    const order = [0, 1, 2, 3, 3, 2, 1, 0];
    let localVertices = [...vertices.map((v) => ({ ...v }))];
    let localEdges = [...edges.map((e) => ({ ...e }))];

    for (let round = 0; round < order.length; round++) {
      const player = order[round];
      setCurrentPlayer(player);
      setPlacementRound(round);
      setPhase("analyzing");
      addLog(`${PLAYER_NAMES[player]} analiz ediyor...`);

      // Score vertices considering current state
      const valid = localVertices
        .filter((v) => {
          if (v.building) return false;
          for (const e of localEdges) {
            if (e.v1Id === v.id || e.v2Id === v.id) {
              const nId = e.v1Id === v.id ? e.v2Id : e.v1Id;
              const n = localVertices.find((vt) => vt.id === nId);
              if (n?.building) return false;
            }
          }
          if (v.adjacentHexIds.length < 2) return false;
          return true;
        })
        .sort((a, b) => b.score - a.score);

      if (valid.length === 0) {
        addLog("Uygun pozisyon yok!");
        continue;
      }

      // Animate scanning top candidates
      const topN = Math.min(valid.length, 6);
      for (let i = 0; i < topN; i++) {
        setScanningIdx(localVertices.findIndex((v) => v.id === valid[i].id));
        setHoveredVertex(valid[i].id);
        await sleep(350);
      }

      // Place settlement
      const best = valid[0];
      setPhase("placing");
      addLog(`${PLAYER_NAMES[player]} yerleşim kurdu! Skor: ${best.score}`);

      const vIdx = localVertices.findIndex((v) => v.id === best.id);
      localVertices[vIdx] = {
        ...localVertices[vIdx],
        building: { type: "settlement", player },
      };
      setVertices([...localVertices]);
      setScanningIdx(null);
      setHoveredVertex(null);
      await sleep(400);

      // Place road from settlement
      setPhase("road");
      const connectedEdges = localEdges.filter(
        (e) => (e.v1Id === best.id || e.v2Id === best.id) && e.road === null,
      );
      if (connectedEdges.length > 0) {
        // Pick edge that leads toward highest-score unoccupied vertex
        const bestEdge = connectedEdges.reduce((be, e) => {
          const otherId = e.v1Id === best.id ? e.v2Id : e.v1Id;
          const other = localVertices.find((v) => v.id === otherId);
          const beOtherId = be.v1Id === best.id ? be.v2Id : be.v1Id;
          const beOther = localVertices.find((v) => v.id === beOtherId);
          return (other?.score ?? 0) > (beOther?.score ?? 0) ? e : be;
        });
        const eIdx = localEdges.findIndex((e) => e.id === bestEdge.id);
        localEdges[eIdx] = { ...localEdges[eIdx], road: player };
        setEdges([...localEdges]);
        addLog(`${PLAYER_NAMES[player]} yol inşa etti.`);
      }

      await sleep(600);
    }

    setPhase("done");
    setIsRunning(false);
    addLog("Yerleşim aşaması tamamlandı!");
  };

  // ─── Hovered vertex info ─────────────────────────────
  const hoveredInfo = useMemo(() => {
    if (!hoveredVertex) return null;
    const v = vertices.find((vt) => vt.id === hoveredVertex);
    if (!v) return null;
    const adj = v.adjacentHexIds
      .map((id) => hexes.find((h) => h.id === id)!)
      .filter(Boolean);
    return { vertex: v, hexes: adj };
  }, [hoveredVertex, vertices, hexes]);

  // ─── SVG viewBox ─────────────────────────────────────
  const viewBox = "-260 -230 520 460";

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0F1E] text-white overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-6 bg-[#0A0F1E] sticky top-0 z-40 border-b border-white/5">
        <div className="flex items-center gap-5 max-w-7xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft size={22} weight="bold" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
              <Robot size={28} weight="fill" className="text-amber-400" />
              CatanBot
            </h1>
            <span className="text-[10px] uppercase tracking-[0.3em] text-amber-400/60 font-bold">
              Settlement Algorithm Visualizer
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Board */}
          <div className="lg:col-span-8">
            <div className="bg-[#111827] rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative">
              {/* Ocean gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-transparent to-cyan-950/30 pointer-events-none" />

              <svg
                viewBox={viewBox}
                className="w-full h-auto max-h-[70vh] relative z-10"
                style={{ filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.3))" }}
              >
                <defs>
                  {/* Water pattern */}
                  <radialGradient id="ocean" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0A0F1E" stopOpacity="0" />
                  </radialGradient>
                  {/* Glow filter for active elements */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <circle cx="0" cy="0" r="230" fill="url(#ocean)" />

                {/* Harbors (Ports) */}
                {ports.map((port, i) => {
                  const cfg =
                    port.type === "generic"
                      ? null
                      : RESOURCE_CONFIG[port.type as ResourceType];
                  // Simplify rotation: labels are now consistently rotated relative to their manual angle
                  const rotation = port.angle + 90;

                  return (
                    <g
                      key={port.id}
                      transform={`translate(${port.x}, ${port.y}) rotate(${rotation})`}
                    >
                      {/* Port Label Background */}
                      <rect
                        x="-20"
                        y="-10"
                        width="40"
                        height="20"
                        rx="4"
                        fill="#1F2937"
                        stroke="#374151"
                        strokeWidth="1.2"
                        opacity="0.9"
                      />

                      {/* Port ID Badge - High visibility for debugging */}
                          x="0"
                          y="0"
                          fontSize="8"
                          fontWeight="900"
                          fill="#451A03"
                          textAnchor="middle"
                          dominantBaseline="central"
                        >
                          {i}
                        </text>
                      </g>

                      {/* Text flip logic only if it would be upside down globally */}
                      <g
                        transform={
                          rotation > 90 && rotation < 270 ? "rotate(180)" : ""
                        }
                      >
                        <text
                          x="-8"
                          y="0"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="7"
                          fontWeight="900"
                          fill="#9CA3AF"
                          className="uppercase font-sans"
                        >
                          {port.type === "generic" ? "3:1" : "2:1"}
                        </text>
                        <text
                          x="10"
                          y="1.5"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="10"
                        >
                          {port.type === "generic" ? "❓" : cfg?.emoji}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Edges (roads) */}
                {edges.map((e) => (
                  <line
                    key={e.id}
                    x1={e.x1}
                    y1={e.y1}
                    x2={e.x2}
                    y2={e.y2}
                    stroke={
                      e.road !== null
                        ? PLAYER_COLORS[e.road]
                        : "rgba(255,255,255,0.06)"
                    }
                    strokeWidth={e.road !== null ? 5 : 1}
                    strokeLinecap="round"
                    style={
                      e.road !== null
                        ? { filter: "url(#glow)", transition: "all 0.4s ease" }
                        : undefined
                    }
                  />
                ))}

                {/* Hex tiles */}
                {hexes.map((hex) => {
                  const { x, y } = hexToPixel(hex.q, hex.r);
                  const cfg = RESOURCE_CONFIG[hex.resource];
                  const isRedNum = hex.number === 6 || hex.number === 8;

                  return (
                    <g key={hex.id}>
                      {/* Hex shape */}
                      <polygon
                        points={hexPolygonPoints(x, y)}
                        fill={cfg.fill}
                        stroke={cfg.stroke}
                        strokeWidth="2"
                        opacity="0.92"
                      />
                      {/* Inner highlight */}
                      <polygon
                        points={hexPolygonPoints(x, y)}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="1"
                        transform={`translate(0, -1)`}
                      />

                      {/* Resource emoji */}
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fontSize="18"
                        dominantBaseline="central"
                      >
                        {cfg.emoji}
                      </text>

                      {/* Number token */}
                      {hex.number !== null && (
                        <g>
                          <circle
                            cx={x}
                            cy={y + 14}
                            r="13"
                            fill="#FFF8E1"
                            stroke={isRedNum ? "#D32F2F" : "#8D6E63"}
                            strokeWidth="1.5"
                          />
                          <text
                            x={x}
                            y={y + 14}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="12"
                            fontWeight="900"
                            fill={isRedNum ? "#D32F2F" : "#3E2723"}
                          >
                            {hex.number}
                          </text>
                          {/* Pip dots */}
                          <text
                            x={x}
                            y={y + 25}
                            textAnchor="middle"
                            fontSize="5"
                            fill={isRedNum ? "#D32F2F" : "#8D6E63"}
                          >
                            {"•".repeat(pipCount(hex.number))}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Vertices */}
                {vertices.map((v, idx) => {
                  const isHovered = hoveredVertex === v.id;
                  const isScanning = scanningIdx === idx;
                  const hasBuilding = v.building !== null;
                  const showDot =
                    showScores || isHovered || isScanning || hasBuilding;

                  return (
                    <g
                      key={v.id}
                      onMouseEnter={() => setHoveredVertex(v.id)}
                      onMouseLeave={() => setHoveredVertex(null)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Score circle (shown during analysis) */}
                      {showScores &&
                        !hasBuilding &&
                        v.adjacentHexIds.length >= 2 && (
                          <circle
                            cx={v.x}
                            cy={v.y}
                            r={6 + (v.score / maxScore) * 6}
                            fill={scoreColor(v.score, maxScore)}
                            opacity="0.7"
                          />
                        )}

                      {/* Scanning pulse */}
                      {isScanning && (
                        <>
                          <circle
                            cx={v.x}
                            cy={v.y}
                            r="14"
                            fill="none"
                            stroke={PLAYER_COLORS[currentPlayer]}
                            strokeWidth="2"
                            opacity="0.6"
                          >
                            <animate
                              attributeName="r"
                              from="10"
                              to="22"
                              dur="0.8s"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              from="0.6"
                              to="0"
                              dur="0.8s"
                              repeatCount="indefinite"
                            />
                          </circle>
                          <circle
                            cx={v.x}
                            cy={v.y}
                            r="8"
                            fill={PLAYER_COLORS[currentPlayer]}
                            opacity="0.8"
                            filter="url(#glow)"
                          />
                        </>
                      )}

                      {/* Building (settlement) */}
                      {hasBuilding && (
                        <g filter="url(#glow)">
                          {/* House shape */}
                          <polygon
                            points={`${v.x},${v.y - 10} ${v.x - 7},${v.y - 3} ${v.x - 7},${v.y + 6} ${v.x + 7},${v.y + 6} ${v.x + 7},${v.y - 3}`}
                            fill={PLAYER_COLORS[v.building!.player]}
                            stroke="white"
                            strokeWidth="1.5"
                          />
                        </g>
                      )}

                      {/* Hover dot */}
                      {isHovered && !hasBuilding && (
                        <circle
                          cx={v.x}
                          cy={v.y}
                          r="5"
                          fill="white"
                          opacity="0.8"
                          filter="url(#glow)"
                        />
                      )}

                      {/* Invisible hit area */}
                      <circle cx={v.x} cy={v.y} r="10" fill="transparent" />

                      {/* Score label on hover */}
                      {isHovered && v.adjacentHexIds.length >= 2 && (
                        <g>
                          <rect
                            x={v.x + 10}
                            y={v.y - 22}
                            width="40"
                            height="18"
                            rx="4"
                            fill="rgba(0,0,0,0.85)"
                          />
                          <text
                            x={v.x + 30}
                            y={v.y - 13}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="9"
                            fontWeight="bold"
                            fill="white"
                          >
                            {v.score}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Ports & Debug Indices (Top Layer) */}
                {ports.map((port, i) => {
                  const cfg =
                    port.type === "generic"
                      ? null
                      : RESOURCE_CONFIG[port.type as ResourceType];
                  const rotation = port.angle + 90;

                  return (
                    <g
                      key={port.id}
                      transform={`translate(${port.x}, ${port.y}) rotate(${rotation})`}
                    >
                      <rect
                        x="-20"
                        y="-10"
                        width="40"
                        height="20"
                        rx="4"
                        fill="#1F2937"
                        stroke="#374151"
                        strokeWidth="1.2"
                        opacity="0.9"
                      />
                      <g transform="translate(0, -18)">
                        <rect
                          x="-8"
                          y="-6"
                          width="16"
                          height="12"
                          rx="3"
                          fill="#F59E0B"
                          stroke="#78350F"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="0"
                          fontSize="8"
                          fontWeight="900"
                          fill="#451A03"
                          textAnchor="middle"
                          dominantBaseline="central"
                        >
                          {i}
                        </text>
                      </g>
                      <g
                        transform={
                          rotation > 90 && rotation < 270 ? "rotate(180)" : ""
                        }
                      >
                        <text
                          x="-8"
                          y="0"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="7"
                          fontWeight="900"
                          fill="#9CA3AF"
                          className="uppercase font-sans"
                        >
                          {port.type === "generic" ? "3:1" : "2:1"}
                        </text>
                        <text
                          x="10"
                          y="1.5"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="10"
                        >
                          {port.type === "generic" ? "❓" : cfg?.emoji}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Border Edge Indices (Debug Badge - Highest Layer) */}
                {DEBUG_MODE && borderEdges.map((edge, idx) => {
                  const midX = (edge.x1 + edge.x2) / 2;
                  const midY = (edge.y1 + edge.y2) / 2;
                  return (
                    <g key={`edge-idx-group-${idx}`}>
                      <circle
                        cx={midX}
                        cy={midY}
                        r="6"
                        fill="#000"
                        opacity="0.8"
                      />
                      <text
                        x={midX}
                        y={midY}
                        fontSize="7"
                        fontWeight="bold"
                        fill="#FFF"
                        textAnchor="middle"
                        dominantBaseline="central"
                        pointerEvents="none"
                      >
                        {idx}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Phase indicator overlay */}
              <AnimatePresence>
                {phase === "done" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                  >
                    <div className="bg-amber-600/90 backdrop-blur-md rounded-2xl px-10 py-8 text-center border border-amber-400/30 shadow-2xl">
                      <Trophy
                        size={40}
                        weight="fill"
                        className="mx-auto mb-4 text-amber-200"
                      />
                      <h3 className="text-xl font-black uppercase tracking-tight mb-2">
                        Yerleşim Tamamlandı
                      </h3>
                      <p className="text-amber-100 text-sm mb-6">
                        4 oyuncu başarıyla konumlandı.
                      </p>
                      <button
                        onClick={() => setPhase("idle")}
                        className="bg-white text-amber-700 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-50 transition-all cursor-pointer"
                      >
                        Tamam
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Legend bar */}
            <div className="mt-4 flex flex-wrap gap-3">
              {(
                Object.entries(RESOURCE_CONFIG) as [
                  ResourceType,
                  typeof RESOURCE_CONFIG.wood,
                ][]
              ).map(([key, cfg]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5 border border-white/5"
                >
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: cfg.fill }}
                  />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {cfg.emoji} {cfg.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Controls & Info */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Player status */}
            <div className="bg-[#111827] rounded-2xl p-6 border border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">
                Oyuncular
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {PLAYER_COLORS.map((color, i) => {
                  const settlements = vertices.filter(
                    (v) => v.building?.player === i,
                  ).length;
                  const roads = edges.filter((e) => e.road === i).length;
                  const isActive = currentPlayer === i && isRunning;

                  return (
                    <div
                      key={i}
                      className={`rounded-xl p-4 border transition-all ${
                        isActive
                          ? "bg-white/10 border-white/20 scale-[1.02]"
                          : "bg-white/[0.02] border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: color,
                            boxShadow: isActive ? `0 0 12px ${color}` : "none",
                          }}
                        />
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-300">
                          {PLAYER_NAMES[i]}
                        </span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-gray-500 font-bold">
                        <span>🏠 {settlements}</span>
                        <span>🛤️ {roads}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vertex Info (on hover) */}
            <AnimatePresence mode="wait">
              {hoveredInfo && (
                <motion.div
                  key={hoveredInfo.vertex.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[#111827] rounded-2xl p-6 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                      Köşe Analizi
                    </h3>
                    <span
                      className="text-lg font-black px-3 py-1 rounded-lg"
                      style={{
                        color: scoreColor(hoveredInfo.vertex.score, maxScore),
                        backgroundColor: `${scoreColor(hoveredInfo.vertex.score, maxScore)}15`,
                      }}
                    >
                      {hoveredInfo.vertex.score}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {hoveredInfo.hexes.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span>{RESOURCE_CONFIG[h.resource].emoji}</span>
                          <span className="text-xs font-bold text-gray-300">
                            {RESOURCE_CONFIG[h.resource].label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {h.number && (
                            <>
                              <span
                                className={`text-sm font-black ${
                                  h.number === 6 || h.number === 8
                                    ? "text-red-400"
                                    : "text-gray-400"
                                }`}
                              >
                                {h.number}
                              </span>
                              <span className="text-[9px] text-gray-600 font-mono">
                                ({pipCount(h.number)} pip)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 font-bold uppercase">
                      Toplam Pip
                    </span>
                    <span className="text-white font-black">
                      {hoveredInfo.hexes.reduce(
                        (s, h) => s + pipCount(h.number),
                        0,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] mt-1">
                    <span className="text-gray-500 font-bold uppercase">
                      Çeşitlilik
                    </span>
                    <span className="text-white font-black">
                      {
                        new Set(
                          hoveredInfo.hexes
                            .map((h) => h.resource)
                            .filter((r) => r !== "desert"),
                        ).size
                      }{" "}
                      kaynak
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Logs */}
            <div className="bg-[#111827] rounded-2xl p-6 border border-white/5 flex-1">
              <div className="flex items-center gap-3 mb-4 opacity-40">
                <span className="text-[10px] font-black tracking-[0.2em] uppercase">
                  Bot Logları
                </span>
                <div className="h-px bg-white/10 flex-1" />
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {logs.map((log, i) => (
                  <motion.div
                    key={`${i}-${log}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`text-[11px] font-mono ${
                      i === 0 ? "text-amber-400 font-bold" : "text-gray-600"
                    }`}
                  >
                    <span className="text-amber-900 mr-2 opacity-40 font-black">
                      ❯
                    </span>
                    {log}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={runBotDemo}
                disabled={isRunning}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 py-5 rounded-2xl font-black text-sm tracking-widest shadow-2xl shadow-amber-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause size={20} weight="fill" />
                    Çalışıyor...
                  </>
                ) : (
                  <>
                    <Play size={20} weight="fill" />
                    Bot Demo Başlat
                  </>
                )}
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowScores((p) => !p)}
                  disabled={isRunning}
                  className={`flex-1 py-4 rounded-2xl font-black text-xs tracking-wider border transition-all flex items-center justify-center gap-2 uppercase cursor-pointer ${
                    showScores
                      ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-400"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  <Eye size={18} weight={showScores ? "fill" : "bold"} />
                  Skorlar
                </button>

                <button
                  onClick={resetBoard}
                  disabled={isRunning}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl font-black text-xs tracking-wider transition-all flex items-center justify-center gap-2 uppercase text-gray-400 cursor-pointer"
                >
                  <ArrowClockwise size={18} weight="bold" />
                  Yeni Tahta
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Algorithm Explainer (bottom section) */}
        <div className="mt-10 bg-[#111827] rounded-2xl p-8 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <Lightning size={20} weight="fill" className="text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              Algoritma
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/[0.02] rounded-xl p-5 border border-white/5">
              <div className="text-amber-400 font-black text-xs uppercase tracking-wider mb-2">
                1. Pip Skoru
              </div>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Her köşeye komşu hex&apos;lerin zar olasılıkları toplanır. 6 ve
                8 en değerli (5 pip), 2 ve 12 en az değerli (1 pip).
              </p>
              <div className="mt-3 font-mono text-[10px] text-gray-600 bg-black/30 rounded-lg p-3">
                pip = 6 - |sayı - 7|
              </div>
            </div>

            <div className="bg-white/[0.02] rounded-xl p-5 border border-white/5">
              <div className="text-amber-400 font-black text-xs uppercase tracking-wider mb-2">
                2. Çeşitlilik Bonusu
              </div>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Farklı kaynak türleri çarpan olarak uygulanır. 3+ farklı kaynak
                ×1.5, 2 kaynak ×1.2, tek kaynak ×1.0.
              </p>
              <div className="mt-3 font-mono text-[10px] text-gray-600 bg-black/30 rounded-lg p-3">
                skor = pip × çeşitlilik
              </div>
            </div>

            <div className="bg-white/[0.02] rounded-xl p-5 border border-white/5">
              <div className="text-amber-400 font-black text-xs uppercase tracking-wider mb-2">
                3. Kaynak Önceliği
              </div>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                Tuğla + Kereste erken oyun için yüksek bonus (+1 her biri).
                Buğday + Maden geç oyun için (+0.8). Yün düşük (+0.5).
              </p>
              <div className="mt-3 font-mono text-[10px] text-gray-600 bg-black/30 rounded-lg p-3">
                bonus = Σ(kaynak_ağırlık)
              </div>
            </div>
          </div>
        </div>
      </main>
      <div className="h-16 sm:hidden" />
    </div>
  );
}
