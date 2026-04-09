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
  Lightning,
  ChartBar,
  CirclesThreePlus,
  Info,
  Gear,
  Trophy,
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

interface ScoreBreakdown {
  total: number;
  pips: number;
  multiplier: number;
  synergyMult: number;
  baseBonus: number;
  portBonus: number;
  strategyBonus: number; // New: Bonus based on player's current hand/needs
}

interface Vertex {
  id: string;
  x: number;
  y: number;
  adjacentHexIds: string[];
  score: number;
  scoreBreakdown?: ScoreBreakdown;
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

interface BoardSettings {
  allowAdjacentRed: boolean;
  allowAdjacentSameNum: boolean;
  allowAdjacentSameRes: boolean;
  allowAdjacentSmallNum: boolean;
  showDebugInfo: boolean;
}

// ─── Constants ───────────────────────────────────────────
const HEX_SIZE = 52;
const SQRT3 = Math.sqrt(3);

const RESOURCE_CONFIG: Record<
  ResourceType,
  { fill: string; stroke: string; emoji: string; label: string }
> = {
  wood: { fill: "#1B5E20", stroke: "#2E7D32", emoji: "🌲", label: "Wood" },
  brick: { fill: "#BF360C", stroke: "#E64A19", emoji: "🧱", label: "Brick" },
  sheep: { fill: "#558B2F", stroke: "#7CB342", emoji: "🐑", label: "Sheep" },
  wheat: { fill: "#F57F17", stroke: "#FBC02D", emoji: "🌾", label: "Wheat" },
  ore: { fill: "#37474F", stroke: "#546E7A", emoji: "⛰️", label: "Ore" },
  desert: { fill: "#C8A951", stroke: "#D4B963", emoji: "🏜️", label: "Desert" },
};

const PLAYER_COLORS = ["#E53935", "#1E88E5", "#FF8F00", "#43A047"];
const PLAYER_NAMES = ["Red Bot", "Blue Bot", "Orange Bot", "Green Bot"];

// ─── Hex Math ────────────────────────────────────────────
function hexToPixel(q: number, r: number) {
  return { x: HEX_SIZE * (SQRT3 * q + (SQRT3 / 2) * r), y: HEX_SIZE * ((3 / 2) * r) };
}

function hexCornerPx(cx: number, cy: number, i: number) {
  const angle = (Math.PI / 180) * (60 * i - 30);
  return { x: cx + HEX_SIZE * Math.cos(angle), y: cy + HEX_SIZE * Math.sin(angle) };
}

function hexPolygonPoints(cx: number, cy: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const c = hexCornerPx(cx, cy, i);
    return `${c.x},${c.y}`;
  }).join(" ");
}

function getHexName(q: number, r: number): string {
  const rowMap: Record<number, string> = { "-2": "A", "-1": "B", "0": "C", "1": "D", "2": "E" };
  const row = rowMap[r] || "?";
  const colOffset = Math.max(-2, -2 - r);
  const col = q - colOffset + 1;
  return `${row}${col}`;
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

function getHexDist(h1: { q: number; r: number }, h2: { q: number; r: number }) {
  return (Math.abs(h1.q - h2.q) + Math.abs(h1.q + h1.r - h2.q - h2.r) + Math.abs(h1.r - h2.r)) / 2;
}

function generateBoard(settings: BoardSettings): HexTile[] {
  const coords: [number, number, number][] = [];
  for (let q = -2; q <= 2; q++) {
    for (let r = -2; r <= 2; r++) {
      const s = -q - r;
      if (Math.abs(s) <= 2) coords.push([q, r, s]);
    }
  }

  const pool: ResourceType[] = shuffle([
    ...Array(4).fill("wood"), ...Array(3).fill("brick"),
    ...Array(4).fill("sheep"), ...Array(4).fill("wheat"),
    ...Array(3).fill("ore"), "desert",
  ] as ResourceType[]);

  const baseNums = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
  let attempts = 0;
  let finalHexes: HexTile[] = [];

  while (attempts < 1000) {
    const nums = shuffle([...baseNums]);
    let ni = 0;
    const tempHexes = coords.map(([q, r, s], idx) => {
      const res = pool[idx];
      return { q, r, s, resource: res, number: res === "desert" ? null : nums[ni++], id: `${q},${r},${s}` };
    });

    let conflict = false;
    for (let i = 0; i < tempHexes.length; i++) {
      for (let j = i + 1; j < tempHexes.length; j++) {
        if (getHexDist(tempHexes[i], tempHexes[j]) === 1) {
          const h1 = tempHexes[i]; const h2 = tempHexes[j];
          if (!settings.allowAdjacentRed && (h1.number === 6 || h1.number === 8) && (h2.number === 6 || h2.number === 8)) { conflict = true; break; }
          if (!settings.allowAdjacentSmallNum && (h1.number === 2 || h1.number === 12) && (h2.number === 2 || h2.number === 12)) { conflict = true; break; }
          if (!settings.allowAdjacentSameNum && h1.number !== null && h1.number === h2.number) { conflict = true; break; }
          if (!settings.allowAdjacentSameRes && h1.resource === h2.resource && h1.resource !== "desert") { conflict = true; break; }
        }
      }
      if (conflict) break;
    }
    if (!conflict) { finalHexes = tempHexes; break; }
    attempts++;
  }
  return finalHexes.length > 0 ? finalHexes : generateBoard({ ...settings, allowAdjacentSameRes: true });
}

// ─── Vertex & Edge Computation ───────────────────────────
function vKey(x: number, y: number) { return `${Math.round(x)},${Math.round(y)}`; }

function computeGraph(hexes: HexTile[]) {
  const vMap = new Map<string, Vertex>();
  const eMap = new Map<string, Edge>();
  for (const hex of hexes) {
    const { x: cx, y: cy } = hexToPixel(hex.q, hex.r);
    const corners = Array.from({ length: 6 }, (_, i) => hexCornerPx(cx, cy, i));
    for (let i = 0; i < 6; i++) {
      const c = corners[i]; const key = vKey(c.x, c.y);
      if (!vMap.has(key)) {
        vMap.set(key, { id: key, x: c.x, y: c.y, adjacentHexIds: [hex.id], score: 0, building: null, port: null });
      } else {
        const v = vMap.get(key)!;
        if (!v.adjacentHexIds.includes(hex.id)) v.adjacentHexIds.push(hex.id);
      }
      const next = corners[(i + 1) % 6]; const nk = vKey(next.x, next.y);
      const ek = key < nk ? `${key}|${nk}` : `${nk}|${key}`;
      if (!eMap.has(ek)) {
        eMap.set(ek, { id: ek, x1: c.x, y1: c.y, x2: next.x, y2: next.y, v1Id: key, v2Id: nk, road: null });
      }
    }
  }
  const vertices = Array.from(vMap.values());
  const edges = Array.from(eMap.values());
  const borderEdges = edges.filter((e) => {
    const v1 = vMap.get(e.v1Id)!; const v2 = vMap.get(e.v2Id)!;
    return v1.adjacentHexIds.filter((id) => v2.adjacentHexIds.includes(id)).length === 1;
  });
  const portPool = shuffle(["wood", "brick", "sheep", "wheat", "ore", "generic", "generic", "generic", "generic"] as (ResourceType | "generic")[]);
  borderEdges.sort((a, b) => Math.atan2((a.y1 + a.y2) / 2, (a.x1 + a.x2) / 2) - Math.atan2((b.y1 + b.y2) / 2, (b.x1 + b.x2) / 2));
  const portIndices = [0, 3, 7, 10, 13, 17, 20, 23, 27];
  const portAngles = [180, 240, 240, 300, 0, 0, 60, 120, 120];
  const ports: Port[] = [];
  for (let i = 0; i < portPool.length; i++) {
    const edge = borderEdges[portIndices[i]];
    if (!edge) continue;
    const midX = (edge.x1 + edge.x2) / 2; const midY = (edge.y1 + edge.y2) / 2;
    const rad = (portAngles[i] * Math.PI) / 180;
    const port: Port = { id: `port-${i}`, type: portPool[i], v1Id: edge.v1Id, v2Id: edge.v2Id, x: midX + Math.cos(rad) * 18, y: midY + Math.sin(rad) * 18, angle: portAngles[i] };
    ports.push(port); vMap.get(edge.v1Id)!.port = port; vMap.get(edge.v2Id)!.port = port;
  }
  return { vertices, edges, ports, borderEdges };
}

// ─── Scoring ─────────────────────────────────────────────
function pipCount(n: number | null): number { return n === null ? 0 : 6 - Math.abs(n - 7); }

function getScoreBreakdown(v: Vertex, hexes: HexTile[], playerIndex: number, currentVertices: Vertex[]): ScoreBreakdown {
  const adj = v.adjacentHexIds.map(id => hexes.find(h => h.id === id)!).filter(Boolean);
  if (adj.length === 0) return { total: 0, pips: 0, multiplier: 1, synergyMult: 1, baseBonus: 0, portBonus: 0, strategyBonus: 0 };
  
  let pips = 0;
  for (const h of adj) pips += pipCount(h.number);
  const resSet = new Set(adj.map(h => h.resource).filter(r => r !== "desert"));
  const hasRes = (type: any) => resSet.has(type);

  // 1. Core Synergy (Wood+Brick or Wheat+Ore+Sheep)
  let synergyMult = 1.0;
  if (hasRes("wood") && hasRes("brick")) synergyMult = 1.5;
  if (hasRes("wheat") && hasRes("ore") && hasRes("sheep")) synergyMult = 1.5;

  const mult = resSet.size >= 3 ? 1.5 : resSet.size >= 2 ? 1.2 : 1.0;
  
  // 2. Base Resource Value
  let base = 0;
  if (hasRes("brick")) base += 1.0; if (hasRes("wood")) base += 1.0;
  if (hasRes("wheat")) base += 0.8; if (hasRes("ore")) base += 0.8; if (hasRes("sheep")) base += 0.5;
  
  // 3. Port Bonus
  let portB = 0;
  if (v.port) {
    if (v.port.type === "generic") portB += 1.5;
    else if (hasRes(v.port.type)) portB += 3.0;
    else portB += 1.0;
  }
  
  // 4. Strategic Needs Bonus (Bot Personality & Needs)
  let strategyBonus = 0;
  const existingOwned = currentVertices.filter(vx => vx.building?.player === playerIndex);
  
  if (existingOwned.length > 0) {
    const ownedResources = new Set<string>();
    existingOwned.forEach(vx => {
        vx.adjacentHexIds.map(id => hexes.find(h => h.id === id)!).filter(Boolean).forEach(h => {
           if (h.resource !== "desert") ownedResources.add(h.resource);
        });
    });

    // Bonus for diversity: If bot is missing a resource, provide a huge boost to locations that have it
    resSet.forEach(r => {
        if (!ownedResources.has(r)) strategyBonus += 2.0; // Bonus per new resource type found
        else strategyBonus -= 0.5; // Diminishing returns for already owned resources
    });

    // Special turn order strategy (last player gets a small boost for picks)
    if (playerIndex === 3) strategyBonus += 1.5;
  }
  
  const baseScore = pips * mult + base + portB + strategyBonus;
  const total = Math.round(baseScore * synergyMult * 10) / 10;

  return { total, pips, multiplier: mult, synergyMult, baseBonus: base, portBonus: portB, strategyBonus };
}

function scoreColor(score: number, maxScore: number): string {
  if (maxScore === 0) return "rgba(255,255,255,0.15)";
  const t = score / maxScore;
  if (t > 0.75) return "#22C55E"; if (t > 0.5) return "#84CC16"; if (t > 0.25) return "#FACC15";
  return "#EF4444";
}

// ─── Main Component ──────────────────────────────────────
export default function CatanBot() {
  const router = useRouter();
  const [settings, setSettings] = useState<BoardSettings>({ allowAdjacentRed: false, allowAdjacentSameNum: true, allowAdjacentSameRes: true, allowAdjacentSmallNum: true, showDebugInfo: false });
  const [hexes, setHexes] = useState<HexTile[]>([]);
  const [vertices, setVertices] = useState<Vertex[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [borderEdges, setBorderEdges] = useState<Edge[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [showScores, setShowScores] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [logs, setLogs] = useState<string[]>(["System Ready."]);
  const [selectedVertex, setSelectedVertex] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'analyze' | 'place'>('analyze');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Recalculate all scores whenever vertices or currentPlayer changes
  useEffect(() => {
    if (hexes.length > 0) {
      setVertices(prev => prev.map(vtx => {
         const breakdown = getScoreBreakdown(vtx, hexes, currentPlayer, prev);
         return { ...vtx, scoreBreakdown: breakdown, score: breakdown.total };
      }));
    }
  }, [currentPlayer, hexes.length]);

  useEffect(() => {
    const sh = localStorage.getItem("catan_hexes");
    const ss = localStorage.getItem("catan_settings");
    if (ss) setSettings(JSON.parse(ss));
    if (sh) {
      const h = JSON.parse(sh);
      const { vertices: v, edges: e, ports: p, borderEdges: be } = computeGraph(h);
      setHexes(h); setEdges(e); setBorderEdges(be); setPorts(p);
      setVertices(v.map(vtx => {
          const breakdown = getScoreBreakdown(vtx, h, 0, v);
          return { ...vtx, scoreBreakdown: breakdown, score: breakdown.total };
      }));
    } else { resetBoard(); }
    setIsInitialized(true);
  }, []);

  const resetBoard = useCallback(() => {
    const h = generateBoard(settings);
    const { vertices: v, edges: e, ports: p, borderEdges: be } = computeGraph(h);
    localStorage.setItem("catan_hexes", JSON.stringify(h));
    localStorage.setItem("catan_settings", JSON.stringify(settings));
    setHexes(h); setEdges(e); setBorderEdges(be); setPorts(p);
    setVertices(v.map(vtx => {
        const bd = getScoreBreakdown(vtx, h, 0, v);
        return { ...vtx, scoreBreakdown: bd, score: bd.total };
    }));
    setShowScores(false); setLogs(["World Regenerated."]);
  }, [settings]);

  const resetMoves = useCallback(() => {
    setVertices(prev => prev.map(v => ({ ...v, building: null })));
    setCurrentPlayer(0);
    setSelectedVertex(null);
    setLogs(["Moves reset. It's Red Bot's turn."]);
  }, []);

  useEffect(() => { if (isInitialized) localStorage.setItem("catan_settings", JSON.stringify(settings)); }, [settings, isInitialized]);

  const addLog = (msg: string) => setLogs(p => [msg, ...p].slice(0, 12));
  const maxScore = useMemo(() => Math.max(...vertices.map(v => v.score), 1), [vertices]);

  const handleVertexClick = (vId: string) => {
    // If clicking the same vertex, toggle it off
    if (selectedVertex === vId) {
      setSelectedVertex(null);
      return;
    }
    
    setSelectedVertex(vId); // Otherwise select it
    if (activeMode !== 'place' || isRunning) return;
    const vIdx = vertices.findIndex((v) => v.id === vId);
    if (vIdx === -1 || vertices[vIdx].building) return;

    if (edges.some(e => (e.v1Id === vId || e.v2Id === vId) && vertices.find(vt => vt.id === (e.v1Id === vId ? e.v2Id : e.v1Id))?.building)) {
      addLog("Error: Too close placement!"); return;
    }

    const newVertices = [...vertices];
    newVertices[vIdx] = { ...newVertices[vIdx], building: { type: "settlement", player: currentPlayer } };
    setVertices(newVertices);
    addLog(`${PLAYER_NAMES[currentPlayer]} settled.`);
    setCurrentPlayer((prev) => (prev + 1) % 4);
  };

  const selectedInfo = useMemo(() => {
    if (!selectedVertex) return null;
    const v = vertices.find(vt => vt.id === selectedVertex);
    if (!v) return null;
    return { vertex: v, hexes: v.adjacentHexIds.map(id => hexes.find(h => h.id === id)!).filter(Boolean), breakdown: v.scoreBreakdown };
  }, [selectedVertex, vertices, hexes]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0F1E] text-white">
      <header className="flex items-center justify-between px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-5 max-w-7xl mx-auto w-full">
          <button onClick={() => router.back()} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><ArrowLeft size={22} weight="bold" /></button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><Robot size={28} weight="fill" className="text-amber-400" /> CatanBot</h1>
            <span className="text-[10px] uppercase tracking-widest text-amber-400/60 font-bold">Smart Algorithm Visualizer</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <div className="bg-[#111827] rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
              <svg viewBox="-260 -230 520 460" className="w-full h-auto relative z-10">
                <defs><radialGradient id="ocean" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.2" /><stop offset="100%" stopColor="#0A0F1E" stopOpacity="0" /></radialGradient></defs>
                <circle cx="0" cy="0" r="230" fill="url(#ocean)" />
                {hexes.map(hex => {
                  const { x, y } = hexToPixel(hex.q, hex.r);
                  const cfg = RESOURCE_CONFIG[hex.resource];
                  return (
                    <g key={hex.id}>
                      <polygon points={hexPolygonPoints(x, y)} fill={cfg.fill} stroke={cfg.stroke} strokeWidth="1.5" opacity="0.9" />
                      {settings.showDebugInfo && <text x={x - 22} y={y - 25} fontSize="6" fontWeight="900" fill="white" opacity="0.4">{getHexName(hex.q, hex.r)}</text>}
                      <text x={x} y={hex.number !== null ? y - 10 : y} textAnchor="middle" dominantBaseline="central" fontSize="18">{cfg.emoji}</text>
                      {hex.number !== null && (
                        <g>
                          <circle cx={x} cy={y + 14} r={12} fill="#FFF8E1" stroke={hex.number === 6 || hex.number === 8 ? "#D32F2F" : "#795548"} strokeWidth="1" />
                          <text x={x} y={y + 14} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="900" fill={hex.number === 6 || hex.number === 8 ? "#D32F2F" : "#3E2723"}>{hex.number}</text>
                          <text x={x} y={y + 24} textAnchor="middle" fontSize="5" fill={hex.number === 6 || hex.number === 8 ? "#D32F2F" : "#795548"}>{"•".repeat(pipCount(hex.number))}</text>
                        </g>
                      )}
                    </g>
                  );
                })}
                {edges.map(e => <line key={e.id} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={e.road !== null ? PLAYER_COLORS[e.road] : "rgba(255,255,255,0.06)"} strokeWidth={e.road !== null ? 6 : 1} strokeLinecap="round" />)}
                {vertices.map((v) => {
                  const isSelected = selectedVertex === v.id;
                  const show = showScores || isSelected || v.building;
                  if (!show && v.adjacentHexIds.length < 2) return null;
                  return (
                    <g key={v.id} onClick={() => handleVertexClick(v.id)} style={{ cursor: "pointer" }}>
                      {showScores && !v.building && v.adjacentHexIds.length >= 2 && (
                        <g>
                          <circle cx={v.x} cy={v.y} r={6 + (v.score / maxScore) * 8} fill={scoreColor(v.score, maxScore)} opacity="0.7" />
                          <text x={v.x} y={v.y} textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="black" fill="white" style={{ pointerEvents: 'none', filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.8))' }}>{v.score.toFixed(1)}</text>
                        </g>
                      )}
                      {(show || v.adjacentHexIds.length >= 2) && (
                        <circle cx={v.x} cy={v.y} r={v.building ? 8 : (isSelected ? 6 : 4)} fill={v.building ? PLAYER_COLORS[v.building.player] : (isSelected ? "white" : "rgba(255,255,255,0.2)")} stroke={isSelected ? "rgba(255,255,255,0.5)" : "none"} strokeWidth={isSelected ? 4 : 0} />
                      )}
                    </g>
                  );
                })}
                {ports.map((port) => {
                  const rotation = port.angle + 90; const cfg = port.type === "generic" ? null : RESOURCE_CONFIG[port.type as ResourceType];
                  return (
                    <g key={port.id} transform={`translate(${port.x}, ${port.y}) rotate(${rotation})`}>
                      <rect x="-20" y="-10" width="40" height="20" rx="4" fill="#1F2937" stroke="#374151" strokeWidth="1" />
                      <g transform={rotation > 90 && rotation < 270 ? "rotate(180)" : ""}>
                        <text x="-8" y="0" textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="bold" fill="#9CA3AF">{port.type === "generic" ? "3:1" : "2:1"}</text>
                        <text x="10" y="1" textAnchor="middle" dominantBaseline="central" fontSize="10">{cfg ? cfg.emoji : "❓"}</text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={resetBoard} className="flex-1 bg-white/5 hover:bg-white/10 py-5 px-6 rounded-2xl font-black uppercase text-[10px] border border-white/5 transition-all flex items-center justify-center gap-3 whitespace-nowrap"><ArrowClockwise size={18} /> New Map</button>
              <button onClick={resetMoves} className="flex-1 bg-white/5 hover:bg-white/10 py-5 px-6 rounded-2xl font-black uppercase text-[10px] border border-white/5 transition-all flex items-center justify-center gap-3 whitespace-nowrap"><MapPin size={18} /> Reset Moves</button>
              <button onClick={() => setShowScores(!showScores)} className={`flex-1 py-5 px-6 rounded-2xl font-black uppercase text-[10px] border transition-all flex items-center justify-center gap-3 whitespace-nowrap ${showScores ? "bg-amber-500 border-amber-400 text-amber-950 hover:bg-amber-400" : "bg-white/5 border-white/5 text-white hover:bg-white/10"}`}><Eye size={18} /> {showScores ? "Hide" : "Analyze"}</button>
              <div className="flex-[2] bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center px-8 min-w-[200px]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLAYER_COLORS[currentPlayer] }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{PLAYER_NAMES[currentPlayer]} Analysis Mode</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#111827] p-1 rounded-2xl border border-white/5 flex shadow-xl">
              <button onClick={() => setActiveMode('analyze')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeMode === 'analyze' ? 'bg-amber-500 text-amber-950' : 'text-gray-500 hover:text-white'}`}><Eye size={16} /> Analyze</button>
              <button onClick={() => setActiveMode('place')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeMode === 'place' ? 'bg-amber-500 text-amber-950' : 'text-gray-500 hover:text-white'}`}><Robot size={16} /> Placement</button>
            </div>

            <div className="bg-[#111827] rounded-3xl p-6 border border-white/5 shadow-2xl relative">
              <div className="flex justify-between mb-6">
                <div className="flex items-center gap-3"><Trophy size={18} weight="fill" className="text-amber-400" /><h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Bot Profiles</h3></div>
                <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tighter ${activeMode === 'place' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>{activeMode === 'place' ? 'Placement Active' : 'Analysis Only'}</div>
              </div>
              <div className="space-y-3">
                {[0, 1, 2, 3].map((pIdx) => {
                  const botS = vertices.filter(v => v.building?.player === pIdx);
                  const totalP = botS.reduce((sum, v) => sum + v.score, 0);
                  const active = currentPlayer === pIdx;
                  return (
                    <div 
                      key={pIdx} 
                      onClick={() => setCurrentPlayer(pIdx)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer hover:bg-white/10 ${active ? 'bg-white/5 border-amber-500/50 shadow-lg shadow-amber-500/5' : 'bg-transparent border-transparent opacity-50 grayscale hover:opacity-100 hover:grayscale-0'}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PLAYER_COLORS[pIdx] }} />
                          <span className="text-[10px] font-black uppercase text-white">{PLAYER_NAMES[pIdx]}</span>
                        </div>
                        {active && <div className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-amber-500 text-amber-950 rounded tracking-tighter">Watching</div>}
                        <span className="text-[11px] font-black text-amber-400">{totalP.toFixed(1)} pts</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {botS.map((s, si) => (
                           <div key={si} className="px-2 py-0.5 bg-black/40 rounded text-[8px] font-bold text-gray-400 border border-white/5">
                             {s.score.toFixed(1)}
                           </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#111827] rounded-3xl p-6 border border-white/5 shadow-2xl min-h-[180px]">
              <div className="flex items-center gap-3 mb-6">
                <Info size={18} weight="fill" className="text-blue-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Vertex Analysis ({PLAYER_NAMES[currentPlayer]})</h3>
              </div>
              {selectedInfo && selectedInfo.breakdown ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black uppercase text-gray-600 tracking-tighter">Total Strategy Score</span>
                    <span className="text-4xl font-black text-amber-400">{selectedInfo.breakdown.total.toFixed(1)}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 text-[10px]">
                      <div className="flex items-center gap-2 text-gray-400 uppercase font-bold"><ChartBar size={14} /> Dice Power</div>
                      <span className="font-black text-white">{selectedInfo.breakdown.pips}</span>
                    </div>

                    <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 text-[10px]">
                      <div className="flex items-center gap-2 text-gray-400 uppercase font-bold"><Lightning size={14} /> Resource Value</div>
                      <span className="font-black text-white">+{selectedInfo.breakdown.baseBonus.toFixed(1)}</span>
                    </div>

                    {selectedInfo.breakdown.portBonus > 0 && (
                      <div className="flex justify-between items-center bg-blue-400/10 border border-blue-400/20 rounded-xl p-3 text-[10px]">
                        <div className="flex items-center gap-2 text-blue-400 uppercase font-bold"><MapPin size={14} /> Port Advantage</div>
                        <span className="font-black text-blue-400">+{selectedInfo.breakdown.portBonus.toFixed(1)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 text-[10px]">
                      <div className="flex items-center gap-2 text-gray-400 uppercase font-bold"><CirclesThreePlus size={14} /> Diversity Multiplier</div>
                      <span className="font-black text-white">x{selectedInfo.breakdown.multiplier.toFixed(1)}</span>
                    </div>

                    {selectedInfo.breakdown.strategyBonus !== 0 && (
                      <div className="flex justify-between items-center bg-purple-400/10 border border-purple-400/20 rounded-xl p-3 text-[10px]">
                        <div className="flex items-center gap-2 text-purple-400 uppercase font-bold"><Robot size={14} /> Strategic Needs</div>
                        <span className="font-black text-purple-400">{selectedInfo.breakdown.strategyBonus > 0 ? '+' : ''}{selectedInfo.breakdown.strategyBonus.toFixed(1)}</span>
                      </div>
                    )}

                    {selectedInfo.breakdown.synergyMult > 1 && (
                      <div className="flex justify-between items-center bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 text-[10px]">
                        <div className="flex items-center gap-2 text-amber-400 uppercase font-bold"><Lightning size={14} weight="fill" /> Synergy Multiplier</div>
                        <span className="font-black text-amber-400">x{selectedInfo.breakdown.synergyMult.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center opacity-30 italic text-[10px] uppercase font-black tracking-widest text-center px-8">Tap or click a point to analyze</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 bg-[#111827] rounded-3xl p-10 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Robot size={120} weight="fill" /></div>
          <div className="flex items-center gap-4 mb-10"><div className="p-3 bg-amber-500/20 rounded-2xl"><Lightning size={24} weight="fill" className="text-amber-400" /></div><div><h3 className="text-xl font-black uppercase tracking-tight">Dynamic Strategy Algorithm</h3><p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Bot-Based Personalized Scoring</p></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4 font-mono text-[11px]"><div className="text-white font-black uppercase">1. Strategic Needs</div><p className="text-gray-500">Bot gets +2.0 bonus for each missing resource type. Existing resources lose value (-0.5).</p></div>
            <div className="space-y-4 font-mono text-[11px]"><div className="text-white font-black uppercase">2. Turn Order Bonus</div><p className="text-gray-500">The last-placed bot (4th) starts with +1.5 base points to compensate for the disadvantage.</p></div>
            <div className="space-y-4 font-mono text-[11px]"><div className="text-white font-black uppercase">3. Synergy x1.5</div><p className="text-gray-500">Expansion pair (Wood-Brick) or City trio (Ore-Wheat-Sheep) doubles the multiplier.</p></div>
            <div className="space-y-4 font-mono text-[11px]"><div className="text-white font-black uppercase">4. Dice Evolution</div><p className="text-gray-500">Scores are calculated in real-time based on the current bot's turn. Each bot invests in its own future.</p></div>
          </div>
        </div>
      </main>
    </div>
  );
}
