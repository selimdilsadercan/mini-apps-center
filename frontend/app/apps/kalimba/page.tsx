"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, ArrowClockwise, Plus, MusicNotes, YoutubeLogo, Trash } from "@phosphor-icons/react";
import { getAppRootUrl } from "@/lib/apps";

// types
interface SongInstrument {
  type: string;
  keys: number;
  tuning: string;
}

interface SongNotation {
  system: string;
  baseOctaveExample: string;
  upperOctaveExample: string;
  simultaneousNotes: string;
  readingDirection: string;
}

interface SongSource {
  type: string;
  url: string;
}

interface SongMeasure {
  events: string[][];
}

interface SongSection {
  id: string;
  repeat?: number;
  events?: string[][];
  measures?: SongMeasure[];
}

interface SongData {
  id: string;
  title: string;
  artist: string;
  instrument: SongInstrument;
  notation: SongNotation;
  source: SongSource;
  sections: SongSection[];
}

// 17-key C Major Kalimba tines from left to right (Standard layout)
const TINE_LAYOUT = [
  { note: "2''", name: "D6", freq: 1174.66, label: "2''", index: 16 },
  { note: "7'", name: "B5", freq: 987.77, label: "7'", index: 14 },
  { note: "5'", name: "G5", freq: 783.99, label: "5'", index: 12 },
  { note: "3'", name: "E5", freq: 659.25, label: "3'", index: 10 },
  { note: "1'", name: "C5", freq: 523.25, label: "1'", index: 8 },
  { note: "6", name: "A4", freq: 440.00, label: "6", index: 6 },
  { note: "4", name: "F4", freq: 349.23, label: "4", index: 4 },
  { note: "2", name: "D4", freq: 293.66, label: "2", index: 2 },
  { note: "1", name: "C4", freq: 261.63, label: "1", index: 1 }, // Center
  { note: "3", name: "E4", freq: 329.63, label: "3", index: 3 },
  { note: "5", name: "G4", freq: 392.00, label: "5", index: 5 },
  { note: "7", name: "B4", freq: 493.88, label: "7", index: 7 },
  { note: "2'", name: "D5", freq: 587.33, label: "2'", index: 9 },
  { note: "4'", name: "F5", freq: 698.46, label: "4'", index: 11 },
  { note: "6'", name: "A5", freq: 880.00, label: "6'", index: 13 },
  { note: "1''", name: "C6", freq: 1046.50, label: "1''", index: 15 },
  { note: "3''", name: "E6", freq: 1318.51, label: "3''", index: 17 },
];

// Map note strings directly to frequencies for faster lookups
const NOTE_TO_FREQ = TINE_LAYOUT.reduce<Record<string, number>>((acc, tine) => {
  acc[tine.note] = tine.freq;
  return acc;
}, {});

// Default/Preloaded song: Avatar's Love
const DEFAULT_SONGS: SongData[] = [
  {
    id: "avatars-love",
    title: "Avatar's Love",
    artist: "Jeremy Zuckerman",
    instrument: {
      type: "kalimba",
      keys: 17,
      tuning: "C"
    },
    notation: {
      system: "numbered",
      baseOctaveExample: "1",
      upperOctaveExample: "1'",
      simultaneousNotes: "Bir event içinde birden fazla nota bulunması",
      readingDirection: "left-to-right"
    },
    source: {
      type: "youtube",
      url: "https://www.youtube.com/watch?v=16M4lpZY3UI"
    },
    sections: [
      {
        id: "section-1",
        events: [
          ["1"],
          ["3"],
          ["5", "7"],
          ["2"],
          ["4"],
          ["6", "1'"],
          ["3"],
          ["5"],
          ["7", "2'"],
          ["4"],
          ["6"],
          ["2'", "4'"],
          ["3'"]
        ]
      },
      {
        id: "section-2",
        repeat: 4,
        events: [
          ["1'"],
          ["7"],
          ["5"],
          ["3"]
        ]
      },
      {
        id: "section-3",
        measures: [
          {
            events: [
              ["4"],
              ["3"],
              ["4"],
              ["1"]
            ]
          },
          {
            events: [
              ["4"],
              ["3"],
              ["4"],
              ["3"],
              ["1"]
            ]
          },
          {
            events: [
              ["4"],
              ["3"],
              ["4"],
              ["1"]
            ]
          },
          {
            events: [
              ["4"],
              ["3"],
              ["4"],
              ["3"],
              ["1"]
            ]
          }
        ]
      },
      {
        id: "section-4",
        repeat: 4,
        events: [
          ["1'"],
          ["7"],
          ["5"],
          ["3"]
        ]
      },
      {
        id: "section-5",
        measures: [
          {
            events: [
              ["4"],
              ["3"],
              ["4"],
              ["1"]
            ]
          },
          {
            events: [
              ["4"],
              ["3"],
              ["4"],
              ["3"],
              ["1"]
            ]
          },
          {
            events: [
              ["4"],
              ["3"],
              ["4"],
              ["1"]
            ]
          },
          {
            events: [
              ["4"],
              ["3"],
              ["4"],
              ["5"],
              ["6"],
              ["7"]
            ]
          }
        ]
      },
      {
        id: "section-6",
        repeat: 4,
        events: [
          ["1'"],
          ["7"],
          ["5"],
          ["3"]
        ]
      },
      {
        id: "section-7",
        measures: [
          {
            events: [
              ["4"],
              ["3"],
              ["4"],
              ["1"]
            ]
          },
          {
            events: [
              ["4"],
              ["3"],
              ["4"],
              ["3"],
              ["1"]
            ]
          },
          {
            events: [
              ["4"],
              ["3"],
              ["4"],
              ["1"]
            ]
          },
          {
            events: [
              ["4"],
              ["3"],
              ["4"],
              ["3"],
              ["1"]
            ]
          }
        ]
      },
      {
        id: "section-8",
        repeat: 4,
        events: [
          ["1'"],
          ["1"],
          ["7"],
          ["1"],
          ["5"],
          ["1"],
          ["3"],
          ["1"]
        ]
      },
      {
        id: "section-9",
        measures: [
          {
            events: [
              ["4"],
              ["1"],
              ["3"],
              ["1"],
              ["4"],
              ["1"],
              ["5"],
              ["1"]
            ]
          },
          {
            events: [
              ["6"],
              ["1"],
              ["5"],
              ["1"],
              ["6"],
              ["1"],
              ["7"],
              ["1"]
            ]
          },
          {
            events: [
              ["1'"],
              ["1"],
              ["7"],
              ["1"],
              ["1'"],
              ["1"],
              ["2'"],
              ["2"]
            ]
          }
        ]
      },
      {
        id: "section-10",
        events: [
          ["3'", "1"],
          ["2'", "2"],
          ["3'", "3"],
          ["5'", "5"],
          ["5'", "5"],
          ["5'", "5"],
          ["2'", "2"],
          ["3'", "3"],
          ["7'", "7"]
        ]
      },
      {
        id: "section-11",
        events: [
          ["6", "1"],
          ["7"],
          ["1'", "3"],
          ["2'"],
          ["1'", "3'", "1"],
          ["3", "5", "7"]
        ]
      },
      {
        id: "section-12",
        events: [
          ["4'", "2'", "6"],
          ["5'", "3'", "3"],
          ["3'", "1'", "1"],
          ["2'", "7"],
          ["7", "5"],
          ["1", "3", "5"],
          ["1'"]
        ]
      }
    ]
  }
];

export default function KalimbaPage() {
  const [songs, setSongs] = useState<SongData[]>(DEFAULT_SONGS);
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [activeTines, setActiveTines] = useState<Record<string, boolean>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(-1);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const [bpm, setBpm] = useState(120);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const activeSong = songs[selectedSongIndex];
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);

  // Flattened events list for playback control
  interface FlatEvent {
    sectionIndex: number;
    eventIndex: number;
    notes: string[];
    sectionId: string;
    repeatIndex?: number;
    repeatTotal?: number;
  }

  const [flatEvents, setFlatEvents] = useState<FlatEvent[]>([]);

  // Load custom songs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("kalimba_custom_songs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSongs([...DEFAULT_SONGS, ...parsed]);
      } catch (e) {
        console.error("Failed to load saved songs", e);
      }
    }
  }, []);

  // Construct flat events list when the active song changes
  useEffect(() => {
    if (!activeSong) return;
    const list: FlatEvent[] = [];

    activeSong.sections.forEach((section, sIdx) => {
      const repeatCount = section.repeat || 1;
      
      for (let r = 0; r < repeatCount; r++) {
        if (section.events) {
          section.events.forEach((evt, eIdx) => {
            list.push({
              sectionIndex: sIdx,
              eventIndex: eIdx,
              notes: evt,
              sectionId: section.id,
              repeatIndex: section.repeat ? r + 1 : undefined,
              repeatTotal: section.repeat,
            });
          });
        } else if (section.measures) {
          let globalEventIdx = 0;
          section.measures.forEach((measure) => {
            measure.events.forEach((evt) => {
              list.push({
                sectionIndex: sIdx,
                eventIndex: globalEventIdx++,
                notes: evt,
                sectionId: section.id,
                repeatIndex: section.repeat ? r + 1 : undefined,
                repeatTotal: section.repeat,
              });
            });
          });
        }
      }
    });

    setFlatEvents(list);
    setCurrentEventIndex(-1);
    setCurrentSectionIndex(-1);
    setIsPlaying(false);
  }, [selectedSongIndex, songs]);

  // Audio Pluck Synthesizer
  const initAudio = () => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
      return ctx;
    }
    return audioContext;
  };

  const playNote = (note: string) => {
    const freq = NOTE_TO_FREQ[note];
    if (!freq) return;

    const ctx = initAudio();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Fundamental Warm Tone (Sine)
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.9);

    // High metallic tine ping / overtone
    const transientOsc = ctx.createOscillator();
    const transientGain = ctx.createGain();
    transientOsc.type = "sine";
    transientOsc.frequency.setValueAtTime(freq * 3.12, now); // inharmonic chime ratio

    transientGain.gain.setValueAtTime(0, now);
    transientGain.gain.linearRampToValueAtTime(0.25, now + 0.002);
    transientGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    transientOsc.connect(transientGain);
    transientGain.connect(ctx.destination);
    transientOsc.start(now);
    transientOsc.stop(now + 0.1);

    // Trigger visual animation feedback on tine
    setActiveTines((prev) => ({ ...prev, [note]: true }));
    setTimeout(() => {
      setActiveTines((prev) => ({ ...prev, [note]: false }));
    }, 150);
  };

  // Playback engine loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = (60 / bpm) * 1000;
      
      const playStep = () => {
        setCurrentEventIndex((prevIdx) => {
          const nextIdx = prevIdx + 1;
          if (nextIdx >= flatEvents.length) {
            setIsPlaying(false);
            return -1;
          }

          const currentEvent = flatEvents[nextIdx];
          setCurrentSectionIndex(currentEvent.sectionIndex);

          // Play all notes inside this event simultanously
          currentEvent.notes.forEach((note) => {
            playNote(note);
          });

          // Scroll active event into view
          const activeEl = document.getElementById(`event-node-${currentEvent.sectionId}-${currentEvent.eventIndex}`);
          if (activeEl) {
            activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          }

          return nextIdx;
        });

        playbackTimer.current = setTimeout(playStep, intervalMs);
      };

      playbackTimer.current = setTimeout(playStep, intervalMs);
    } else {
      if (playbackTimer.current) {
        clearTimeout(playbackTimer.current);
      }
    }

    return () => {
      if (playbackTimer.current) {
        clearTimeout(playbackTimer.current);
      }
    };
  }, [isPlaying, flatEvents, bpm]);

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!parsed.title || !parsed.sections) {
        setImportError("Geçersiz JSON yapısı. En azından 'title' ve 'sections' alanları bulunmalı.");
        return;
      }
      
      const newSong: SongData = {
        id: parsed.id || `custom-${Date.now()}`,
        title: parsed.title,
        artist: parsed.artist || "Bilinmeyen Sanatçı",
        instrument: parsed.instrument || { type: "kalimba", keys: 17, tuning: "C" },
        notation: parsed.notation || { system: "numbered" },
        source: parsed.source || { type: "custom", url: "" },
        sections: parsed.sections,
      };

      const updatedSongs = [...songs, newSong];
      setSongs(updatedSongs);
      
      const customSongsOnly = updatedSongs.filter(s => !DEFAULT_SONGS.some(ds => ds.id === s.id));
      localStorage.setItem("kalimba_custom_songs", JSON.stringify(customSongsOnly));

      setSelectedSongIndex(updatedSongs.length - 1);
      setImportModalOpen(false);
      setImportText("");
      setImportError("");
    } catch (e) {
      setImportError("Geçersiz JSON formatı. Lütfen kopyaladığınız içeriği kontrol edin.");
    }
  };

  const deleteSong = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const songToDelete = songs[indexToDelete];
    
    // Don't delete default preloaded songs
    if (DEFAULT_SONGS.some(s => s.id === songToDelete.id)) return;

    const updated = songs.filter((_, idx) => idx !== indexToDelete);
    setSongs(updated);

    const customSongsOnly = updated.filter(s => !DEFAULT_SONGS.some(ds => ds.id === s.id));
    localStorage.setItem("kalimba_custom_songs", JSON.stringify(customSongsOnly));

    if (selectedSongIndex >= updated.length) {
      setSelectedSongIndex(updated.length - 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-40">
      {/* Top Header */}
      <header className="px-6 py-4 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              window.location.href = getAppRootUrl();
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            ← Hub
          </button>
          <div className="flex items-center gap-2 text-amber-500">
            <MusicNotes size={22} weight="fill" />
            <h1 className="text-lg font-black uppercase tracking-wider text-slate-100">Kalimba</h1>
          </div>
        </div>

        <button
          onClick={() => setImportModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-xs font-black uppercase tracking-wider text-slate-950 transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus size={14} weight="bold" />
          JSON İçe Aktar
        </button>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Song Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
          {songs.map((song, idx) => {
            const isSelected = idx === selectedSongIndex;
            const isDefault = DEFAULT_SONGS.some((ds) => ds.id === song.id);
            return (
              <button
                key={song.id}
                onClick={() => {
                  setSelectedSongIndex(idx);
                  setIsPlaying(false);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border text-sm font-bold whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                  isSelected
                    ? "bg-amber-500/10 border-amber-500 text-amber-400"
                    : "bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>{song.title}</span>
                {!isDefault && (
                  <button
                    onClick={(e) => deleteSong(idx, e)}
                    className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title="Şarkıyı Sil"
                  >
                    <Trash size={14} />
                  </button>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Song Sheet Card */}
        {activeSong && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 md:p-6 space-y-6 relative overflow-hidden backdrop-blur-sm">
            {/* Song Meta info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">{activeSong.title}</h2>
                <p className="text-xs text-slate-400 mt-1 font-semibold">{activeSong.artist}</p>
                
                {/* Info Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-black uppercase text-slate-300">
                    Ayar: {activeSong.instrument.tuning} ({activeSong.instrument.keys} Tuş)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-black uppercase text-slate-300">
                    Sistem: {activeSong.notation.system === "numbered" ? "Sayısal (1-7)" : activeSong.notation.system}
                  </span>
                </div>
              </div>

              {/* Player Controls */}
              <div className="flex items-center gap-3 bg-slate-950/60 p-2 rounded-2xl border border-slate-850 shrink-0">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                    isPlaying ? "bg-amber-500 text-slate-950" : "bg-slate-800 hover:bg-slate-700 text-slate-100"
                  }`}
                  title={isPlaying ? "Durdur" : "Oynat"}
                >
                  {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" className="ml-0.5" />}
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentEventIndex(-1);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Başa Dön"
                >
                  <ArrowClockwise size={18} />
                </button>

                <div className="h-6 w-[1px] bg-slate-800 mx-1" />

                {/* BPM / Hız Ayarı */}
                <div className="flex flex-col px-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Hız (BPM)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="40"
                      max="240"
                      value={bpm}
                      onChange={(e) => setBpm(Number(e.target.value))}
                      className="w-20 accent-amber-500 cursor-pointer h-1 rounded-lg"
                    />
                    <span className="text-xs font-black tabular-nums text-slate-300 min-w-[24px]">{bpm}</span>
                  </div>
                </div>

                {activeSong.source?.url && (
                  <a
                    href={activeSong.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/20"
                    title="YouTube'da Dinle"
                  >
                    <YoutubeLogo size={18} weight="fill" />
                  </a>
                )}
              </div>
            </div>

            {/* Song Notation sheet grid */}
            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
              {activeSong.sections.map((section, sIdx) => {
                const isSectionActive = currentSectionIndex === sIdx;
                
                return (
                  <div
                    key={section.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSectionActive
                        ? "bg-amber-950/10 border-amber-500/40 shadow-sm"
                        : "bg-slate-900/20 border-slate-850"
                    }`}
                  >
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-3 border-b border-slate-800/40 pb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-500">
                        {section.id.replace("-", " ")}
                      </span>
                      {section.repeat && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase">
                          {section.repeat}x Tekrar
                        </span>
                      )}
                    </div>

                    {/* Section Notes Body */}
                    {section.measures ? (
                      /* Render Measures style notation */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {section.measures.map((measure, mIdx) => (
                          <div key={mIdx} className="p-3 bg-slate-950/40 border border-slate-905 rounded-xl flex items-center gap-2 overflow-x-auto">
                            <span className="text-[10px] text-slate-500 font-bold border-r border-slate-850 pr-2 shrink-0">
                              M{mIdx + 1}
                            </span>
                            <div className="flex items-center gap-3">
                              {measure.events.map((evt, eIdx) => {
                                // Calculate global index for highlight
                                const isNodeActive = isPlaying && flatEvents[currentEventIndex]?.sectionIndex === sIdx && flatEvents[currentEventIndex]?.eventIndex === eIdx;
                                return (
                                  <button
                                    key={eIdx}
                                    id={`event-node-${section.id}-${eIdx}`}
                                    onClick={() => evt.forEach(playNote)}
                                    className={`flex flex-col items-center justify-center p-2 min-w-[2.2rem] rounded-lg transition-all ${
                                      isNodeActive
                                        ? "bg-amber-500 text-slate-950 font-black scale-105 shadow-md shadow-amber-500/20"
                                        : "bg-slate-900 border border-slate-800 hover:border-slate-700"
                                    }`}
                                  >
                                    <div className="flex flex-col gap-0.5 text-xs font-bold leading-none">
                                      {evt.map((n, idx) => (
                                        <span key={idx}>{n}</span>
                                      ))}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Render simple sequential events list */
                      <div className="flex flex-wrap gap-2.5">
                        {section.events?.map((evt, eIdx) => {
                          const isNodeActive = isPlaying && flatEvents[currentEventIndex]?.sectionIndex === sIdx && flatEvents[currentEventIndex]?.eventIndex === eIdx;
                          return (
                            <button
                              key={eIdx}
                              id={`event-node-${section.id}-${eIdx}`}
                              onClick={() => evt.forEach(playNote)}
                              className={`flex flex-col items-center justify-center p-2 min-w-[2.2rem] rounded-lg transition-all ${
                                isNodeActive
                                  ? "bg-amber-500 text-slate-950 font-black scale-105 shadow-md shadow-amber-500/20"
                                  : "bg-slate-950/60 border border-slate-855 hover:border-slate-700"
                              }`}
                            >
                              <div className="flex flex-col gap-0.5 text-xs font-bold leading-none">
                                {evt.map((n, idx) => (
                                  <span key={idx}>{n}</span>
                                ))}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* 17-Key virtual Kalimba visualizer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur-lg border-t border-slate-900 z-10 shadow-2xl">
        <div className="max-w-2xl mx-auto">
          {/* Wood and Metal structure */}
          <div className="bg-gradient-to-b from-amber-900 via-amber-950 to-stone-950 rounded-3xl p-5 shadow-2xl relative border-t border-amber-800/40">
            {/* Sound Hole */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-slate-955/80 border border-amber-800/30 flex items-center justify-center shadow-inner">
              <span className="text-[9px] font-black uppercase text-amber-800/40 tracking-wider">C - Tuning</span>
            </div>

            {/* Metal Bar */}
            <div className="h-6 bg-gradient-to-b from-slate-300 via-slate-100 to-slate-400 rounded-md shadow-md border-b border-slate-500/30 mb-8 relative z-10 flex items-center justify-between px-6">
              <div className="w-1.5 h-1.5 rounded-full bg-stone-700" />
              <div className="w-1.5 h-1.5 rounded-full bg-stone-700" />
              <div className="w-1.5 h-1.5 rounded-full bg-stone-700" />
            </div>

            {/* Tines */}
            <div className="flex justify-between items-start gap-[1.5px] px-1 relative h-48">
              {TINE_LAYOUT.map((tine) => {
                // Calculate height of tine based on key index (alternating lengths, center C4 key 1 is longest)
                const heightPercent = 65 + (tine.index === 1 ? 30 : (17 - tine.index) * 1.5); // Center note is longest
                const isActive = activeTines[tine.note];

                return (
                  <button
                    key={tine.note}
                    onMouseDown={() => playNote(tine.note)}
                    style={{ height: `${heightPercent}%` }}
                    className={`flex-1 flex flex-col justify-end items-center pb-3 rounded-b-xl transition-all relative border-t-0 select-none ${
                      isActive
                        ? "bg-gradient-to-b from-slate-200 via-amber-200 to-amber-400 shadow-lg scale-y-102 brightness-110"
                        : "bg-gradient-to-b from-slate-400 via-slate-200 to-slate-400 hover:from-slate-350 hover:to-slate-350 active:from-slate-300"
                    } shadow-md border border-slate-500/20`}
                  >
                    {/* Tine Label */}
                    <div className="flex flex-col items-center select-none pointer-events-none">
                      <span className="text-[10px] font-black text-slate-800 leading-none">{tine.note}</span>
                      <span className="text-[8px] font-bold text-slate-500 mt-0.5 leading-none">{tine.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </footer>

      {/* JSON Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-100 uppercase tracking-tight">Yeni Şarkı İçe Aktar</h3>
              <button
                onClick={() => setImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 font-bold"
              >
                Kapat
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Kalimba notalarını içeren JSON kodunu aşağıdaki alana yapıştırın. Şarkınız cihazınızın tarayıcısına kaydedilecektir.
            </p>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{\n  "title": "Yeni Şarkı",\n  "artist": "Sanatçı",\n  "sections": [\n     ...\n  ]\n}'
              className="w-full h-64 p-3 bg-slate-955 border border-slate-800 rounded-2xl text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500/60"
            />

            {importError && (
              <p className="text-xs text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                {importError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-400 bg-slate-800 hover:bg-slate-700"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-950 bg-amber-500 hover:bg-amber-600"
              >
                İçe Aktar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
