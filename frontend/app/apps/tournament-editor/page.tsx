"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Plus,
  Sword,
  Users,
  CaretRight,
  CircleNotch,
  ArrowLeft,
  MagnifyingGlass
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import CreateTournamentModal from "@/components/apps/tournament/CreateTournamentModal";
import { useUser } from "@clerk/clerk-react";

const client = createBrowserClient();

export default function TournamentListPage() {
  const router = useRouter();
  const { user } = useUser();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchListData();
  }, []);

  const fetchListData = async () => {
    setLoading(true);
    try {
      const data = await client.tournament.getTournaments();
      setTournaments(data.tournaments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push("/")} 
              className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10 group"
              title="Ana Sayfaya Dön"
            >
              <ArrowLeft size={24} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center border border-yellow-500/20 shadow-[0_0_20px_rgba(250,176,5,0.1)]">
                  <Trophy size={24} weight="fill" className="text-yellow-500" />
                </div>
                <h1 className="text-3xl font-black tracking-tighter uppercase">
                  Turnuva Merkezi
                </h1>
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                Tüm aktif ve gelecek turnuvaları yönet
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 uppercase text-xs tracking-widest"
          >
            <Plus size={20} weight="bold" />
            Turnuva Oluştur
          </button>
        </header>

        <div className="relative mb-10 group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
            <MagnifyingGlass size={20} weight="bold" />
          </div>
          <input
            type="text"
            placeholder="TURNUVA ARA..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold tracking-widest focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-20">
              <CircleNotch size={32} className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          ) : tournaments.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full py-24 flex flex-col items-center text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]"
            >
              <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                <Trophy size={48} weight="duotone" className="text-slate-700" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Henüz Turnuva Yok</h3>
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest max-w-xs leading-relaxed">
                Efsanevi bir turnuva başlatmak için <br/> yukarıdaki butona tıkla
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreateOpen(true)}
                className="mt-10 px-8 py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-white/10"
              >
                İLK TURNUVANI OLUŞTUR
              </motion.button>
            </motion.div>
          ) : (
            tournaments.map((t, idx) => (
              <motion.div
                key={t.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => router.push(`/apps/tournament-editor/tournament?slug=${t.slug}`)}
                className="group relative bg-[#121216] rounded-3xl border border-white/5 p-6 hover:border-blue-500/30 transition-all cursor-pointer shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CaretRight size={24} weight="bold" className="text-blue-500" />
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl border border-white/10 group-hover:border-blue-500/20 transition-colors shadow-inner">
                    {t.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight group-hover:text-blue-400 transition-colors">
                      {t.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                          t.status === "active"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {t.status === "active" ? "AKTİF" : "BEKLEMEDE"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.03]">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Users size={14} weight="bold" />
                      <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                        Katılımcı
                      </span>
                    </div>
                    <p className="text-lg font-black tracking-tighter leading-none">
                      {t.participants_count} / {t.capacity}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.03]">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Sword size={14} weight="bold" />
                      <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                        Tür
                      </span>
                    </div>
                    <p className="text-[10px] font-black tracking-wider uppercase truncate leading-none mt-1.5">
                      {t.format === "league_knockout" ? "LİG + ELEME" : "ELEME"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <CreateTournamentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchListData}
        client={client}
        adminUserId={user?.id || ""}
      />
    </div>
  );
}
