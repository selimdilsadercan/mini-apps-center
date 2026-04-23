import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { X, Trophy, CheckCircle, CircleNotch, Crown } from "@phosphor-icons/react";
import { User as UserIcon } from "lucide-react";

interface ScoreUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  match: any;
  playersPerMatch: number;
  client: any;
}

export default function ScoreUpdateModal({
  isOpen,
  onClose,
  onSuccess,
  match,
  playersPerMatch,
  client
}: ScoreUpdateModalProps) {
  const [scores, setScores] = useState<{ [id: string]: number | string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedPlayers = useMemo(() => {
    if (!match) return [];
    const pList = [
      { id: match.player1_id, username: match.username1, avatar: match.avatar1 },
      { id: match.player2_id, username: match.username2, avatar: match.avatar2 },
      { id: match.player3_id, username: match.username3, avatar: match.avatar3 },
      { id: match.player4_id, username: match.username4, avatar: match.avatar4 },
    ].filter(p => p.id);

    return [...pList].sort((a, b) => {
      const scoreA = Number(scores[a.id!]) || 0;
      const scoreB = Number(scores[b.id!]) || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.id!.localeCompare(b.id!);
    });
  }, [match, scores]);

  useEffect(() => {
    if (isOpen && match) {
      setScores(match.scores || {});
    }
  }, [isOpen, match]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !match) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Boş değerleri 0'a çevir
      const finalScores: { [id: string]: number } = {};
      for (const key in scores) {
        finalScores[key] = Number(scores[key]) || 0;
      }
      await client.tournament.updateMatchScore({ matchId: match.id, scores: finalScores });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Skor güncellenirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#121216] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden z-10"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                      <Trophy size={24} weight="bold" />
                   </div>
                   <div>
                      <h2 className="text-xl font-black uppercase tracking-tight text-white">Skor Girişi</h2>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Maç sonucunu belirle</p>
                   </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <form 
                onSubmit={handleSubmit} 
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
                className="space-y-6"
              >
                <LayoutGroup>
                  <div className="flex flex-col gap-3">
                    {sortedPlayers.map((player, idx) => {
                      const isLeader = idx === 0 && (Number(scores[player.id!]) || 0) > 0;

                      return (
                        <motion.div
                          key={player.id}
                          layoutId={`score-card-${player.id}`}
                          transition={{
                            layout: {
                              type: "spring",
                              stiffness: 350,
                              damping: 30,
                            }
                          }}
                          className={`p-4 rounded-2xl border transition-colors duration-300 ${
                            isLeader 
                              ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.2)]' 
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className={`w-10 h-10 rounded-full bg-slate-800 border flex items-center justify-center overflow-hidden shrink-0 transition-colors duration-300 ${isLeader ? 'border-blue-500/50' : 'border-white/10'}`}>
                                     {player.avatar ? <img src={player.avatar} className="w-full h-full object-contain" /> : <UserIcon size={18} className="text-slate-600" />}
                                  </div>
                                  {isLeader && (
                                    <motion.div 
                                      initial={{ scale: 0, rotate: -45 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      exit={{ scale: 0 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-black border-2 border-[#121216]"
                                    >
                                      <Crown size={12} weight="fill" />
                                    </motion.div>
                                  )}
                                </div>
                                <div>
                                  <span className={`font-bold transition-colors duration-300 ${isLeader ? 'text-blue-400' : 'text-slate-200'}`}>{player.username}</span>
                                  {isLeader && <p className="text-[8px] font-black uppercase text-blue-500/50 tracking-widest leading-none">Lider</p>}
                                </div>
                            </div>
                            <div>
                              <style>{`
                                input.score-input::-webkit-outer-spin-button,
                                input.score-input::-webkit-inner-spin-button {
                                  -webkit-appearance: none;
                                  margin: 0;
                                }
                                input.score-input[type=number] {
                                  -moz-appearance: textfield;
                                }
                              `}</style>
                              <input
                                type="number"
                                value={scores[player.id!] === 0 ? "0" : (scores[player.id!] || "")}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setScores({ ...scores, [player.id!]: val === "" ? "" : parseInt(val) || 0 });
                                }}
                                placeholder="0"
                                className={`score-input w-20 rounded-xl py-3 px-4 text-center font-black text-xl focus:outline-none transition-colors duration-300 appearance-none border ${
                                  isLeader 
                                    ? 'bg-blue-500/20 border-blue-500/50 text-white focus:border-blue-400' 
                                    : 'bg-white/5 border-white/10 text-white focus:border-blue-500'
                                }`}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </LayoutGroup>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98]"
                >
                  {isSubmitting ? <CircleNotch size={20} className="animate-spin" /> : <CheckCircle size={20} weight="bold" />}
                  Skorları Kaydet
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
