"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  Users,
  Sword,
  ArrowLeft,
  Gear,
  CircleNotch,
} from "@phosphor-icons/react";
import { User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Client, { Local } from "@/lib/client";

const client = new Client(Local);

function TournamentDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"standings" | "bracket">("standings");

  useEffect(() => {
    if (slug) {
      fetchDetailData();
    } else {
      router.push("/apps/tournament-editor");
    }
  }, [slug]);

  const fetchDetailData = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const tData = await client.tournament.getTournamentDetails({ slug: slug as string });
      setTournament(tData);
      // @ts-ignore
      const mData = await client.tournament.getTournamentMatches({ slug: slug as string });
      setMatches(mData.matches);
      // @ts-ignore
      const sData = await client.tournament.getStandings({ slug: slug as string });
      setStandings(sData.participants);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <CircleNotch size={48} className="animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push("/apps/tournament-editor")} 
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10"
            >
              <ArrowLeft size={24} weight="bold" />
            </button>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                {tournament?.name}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Users size={16} weight="bold" /> {tournament?.participants_count} Katılımcı
                </span>
                <span className="text-slate-800 tracking-normal">•</span>
                <span className="flex items-center gap-1.5 text-purple-400">
                  <Sword size={16} weight="bold" /> {tournament?.format === 'league_knockout' ? 'Lig + Eleme' : 'Eleme'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                tournament?.status === 'active' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
             }`}>
                {tournament?.status === 'active' ? '● Canlı' : 'Beklemede'}
             </span>
             <button className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10 text-slate-400">
               <Gear size={22} weight="bold" />
             </button>
          </div>
        </header>

        <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl w-fit mb-8 border border-white/5">
           <button 
             onClick={() => setActiveTab('standings')} 
             className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'standings' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
           >
             Puan Durumu
           </button>
           <button 
             onClick={() => setActiveTab('bracket')} 
             className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bracket' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
           >
             Bracket
           </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'standings' ? (
            <motion.div 
              key="standings"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="space-y-8"
            >
              <div className="bg-[#121216] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl shadow-black/40">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       <tr>
                          <th className="px-8 py-5 w-20 text-center italic">#</th>
                          <th className="px-8 py-5">Oyuncu</th>
                          <th className="px-8 py-5 text-center">Puan</th>
                          <th className="px-8 py-5 text-center">AV</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                       {standings.map((p, idx) => (
                         <tr key={p.id} className="group hover:bg-white/[0.01] transition-colors">
                            <td className={`px-8 py-6 text-center font-black italic text-lg ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-600'}`}>
                              {idx + 1}
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                                     <UserIcon className="w-5 h-5 text-slate-600" />
                                  </div>
                                  <span className="font-bold text-slate-200">{p.username}</span>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-center font-black text-blue-500 text-xl">{p.points}</td>
                            <td className="px-8 py-6 text-center font-mono text-xs text-yellow-500/60">{p.average > 0 ? `+${p.average}` : p.average}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              {/* Son Maçlar Bölümü - Optional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {matches.filter(m => m.phase === 'league').slice(-2).map(match => (
                    <div key={match.id} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex items-center justify-between">
                       <span className="font-bold text-sm">{match.username1}</span>
                       <div className="flex items-center gap-3 font-black text-lg text-slate-500">
                          <span className={match.winner_id === match.player1_id ? 'text-blue-500' : ''}>{match.score1}</span>
                          <span className="text-slate-800">-</span>
                          <span className={match.winner_id === match.player2_id ? 'text-blue-500' : ''}>{match.score2}</span>
                       </div>
                       <span className="font-bold text-sm text-right">{match.username2}</span>
                    </div>
                 ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
               key="bracket"
               initial={{ opacity: 0, scale: 0.98 }} 
               animate={{ opacity: 1, scale: 1 }} 
               className="py-32 text-center flex flex-col items-center gap-6 bg-white/[0.02] rounded-[4rem] border border-dashed border-white/10"
            >
               <Sword size={48} className="text-slate-800" />
               <div>
                 <p className="text-slate-500 font-black uppercase italic tracking-widest text-sm">Bracket yapısı heniz aktif değil</p>
                 <p className="text-slate-700 text-xs mt-2 uppercase tracking-[0.2em]">Lig aşamasının bitmesi bekleniyor</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TournamentDetailPage() {
  return (
    <Suspense fallback={null}>
      <TournamentDetailContent />
    </Suspense>
  );
}
