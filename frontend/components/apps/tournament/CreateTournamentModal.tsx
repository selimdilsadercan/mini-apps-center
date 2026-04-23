"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Hash, Users, Sword, Loader2, Check } from "lucide-react";

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client: any;
  adminUserId: string;
}

export default function CreateTournamentModal({
  isOpen,
  onClose,
  onSuccess,
  client,
  adminUserId
}: CreateTournamentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    capacity: 16 as number | null,
    format: "league_knockout" as "league_knockout" | "knockout",
    leagueMatchCount: 3,
    advanceCount: 2,
    playersPerMatch: 2,
    icon: "🏆"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);

  useState(() => {
    client.tournament.getTournamentTemplates().then((res: any) => {
      setTemplates(res.templates);
    });
  });

  if (!isOpen) return null;

  const selectTemplate = (template: any) => {
    setFormData({
      ...formData,
      name: template.name,
      slug: generateSlug(template.name),
      capacity: template.capacity,
      format: template.format,
      playersPerMatch: template.players_per_match,
      leagueMatchCount: template.league_match_count,
      advanceCount: template.advance_count,
      icon: template.icon || "🏆"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || formData.capacity === null) {
      setError("İsim, Slug ve Kapasite zorunludur");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await client.tournament.createTournament({
        name: formData.name,
        slug: formData.slug,
        icon: formData.icon,
        capacity: formData.capacity,
        format: formData.format,
        leagueMatchCount: formData.leagueMatchCount,
        advanceCount: formData.advanceCount,
        playersPerMatch: formData.playersPerMatch,
        adminUserId
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Turnuva oluşturulurken hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = (name: string) => {
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "") + "-" + randomSuffix;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-[#0d0d12] w-full max-w-xl rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-10 overflow-y-auto">
            <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-blue-500/20">
                  <Trophy size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Yeni Turnuva</h2>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none mt-1">Efsaneni oluşturmaya başla</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-colors border border-white/5">
                <X size={24} />
              </button>
            </header>

            {/* Templates Section */}
            {templates.length > 0 && (
              <div className="mb-10">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-3">Hızlı Başlangıç Şablonları</label>
                 <div className="grid grid-cols-2 gap-3">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => selectTemplate(t)}
                        className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.05] hover:border-white/10 transition-all text-left group"
                      >
                         <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{t.icon}</span>
                            <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{t.name}</span>
                         </div>
                         <p className="text-[9px] text-slate-500 leading-tight uppercase font-black tracking-widest">{t.description}</p>
                      </button>
                    ))}
                 </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Turnuva İsmi</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">
                        <Trophy size={18} />
                    </div>
                    <input
                      autoFocus
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
                        setError("");
                      }}
                      placeholder="Örn: Pro League"
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] py-4 pl-14 pr-6 text-white font-bold focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Kapasite</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">
                        <Users size={18} />
                    </div>
                    <input
                      type="number"
                      min="2"
                      max="256"
                      value={formData.capacity === null ? "" : formData.capacity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, capacity: val === "" ? null : parseInt(val) });
                      }}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] py-4 pl-14 pr-6 text-white font-bold focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className="text-blue-500" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Maç Başına Oyuncu</label>
                </div>
                <div className="grid grid-cols-2 p-2 bg-white/[0.02] border border-white/5 rounded-[2rem] gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, playersPerMatch: 2 })}
                    className={`py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${
                      formData.playersPerMatch === 2 ? "bg-white/10 text-white shadow-xl border border-white/5" : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    2 Kişilik
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, playersPerMatch: 4 })}
                    className={`py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${
                      formData.playersPerMatch === 4 ? "bg-white/10 text-white shadow-xl border border-white/5" : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    4 Kişilik
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sword size={14} className="text-red-500" />
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Turnuva Formatı</label>
                </div>
                <div className="grid grid-cols-2 p-2 bg-white/[0.02] border border-white/5 rounded-[2rem] gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, format: "knockout" })}
                    className={`py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${
                      formData.format === "knockout" ? "bg-white/10 text-white shadow-xl border border-white/5" : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    Direkt Eleme
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, format: "league_knockout" })}
                    className={`py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${
                      formData.format === "league_knockout" ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" : "text-slate-600 hover:text-slate-400"
                    }`}
                  >
                    Lig + Eleme
                  </button>
                </div>
              </div>

              {formData.format === "league_knockout" && (
                <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Lig Maç Sayısı</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.leagueMatchCount}
                      onChange={(e) => setFormData({ ...formData, leagueMatchCount: parseInt(e.target.value) || 1 })}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] py-4 px-6 text-white font-bold focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Üst Tura Çıkacak</label>
                    <input
                      type="number"
                      min="2"
                      value={formData.advanceCount}
                      onChange={(e) => setFormData({ ...formData, advanceCount: parseInt(e.target.value) || 2 })}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] py-4 px-6 text-white font-bold focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black py-5 rounded-2xl font-black text-lg uppercase tracking-tighter shadow-xl shadow-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    Turnuvayı Başlat
                    <Check size={24} />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
