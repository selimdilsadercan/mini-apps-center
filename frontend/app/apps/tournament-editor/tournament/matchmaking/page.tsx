"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Users, 
  ArrowsLeftRight, 
  Check, 
  CircleNotch,
  User,
  FloppyDisk,
  Warning,
  Pencil
} from "@phosphor-icons/react";
import PlayerSetupModal from "@/components/apps/tournament/PlayerSetupModal";
import Client, { Local } from "@/lib/client";
import { toast } from "react-hot-toast";

import { useUser } from "@clerk/clerk-react";

const client = new Client(Local);

export default function MatchmakingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded: userLoaded } = useUser();
  const slug = searchParams.get("slug");

  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ matchId: string; slotIdx: number } | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);

  useEffect(() => {
    if (slug && userLoaded) {
      fetchData();
    }
  }, [slug, userLoaded]);

  const fetchData = async () => {
    if (!slug || !userLoaded) return;
    setLoading(true);
    try {
      const tData = await client.tournament.getTournamentDetails(slug as string, { 
        userId: user?.id 
      });
      setTournament(tData);

      const mData = await client.tournament.getTournamentMatches(slug as string);
      const currentRound = tData.current_league_round || 1;
      const roundMatches = mData.matches.filter(
        (m: any) => m.round === currentRound && m.phase === "league",
      );
      setMatches(roundMatches);
    } catch (err) {
      console.error(err);
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (matchId: string, slotIdx: number) => {
    if (!selectedPlayer) {
      setSelectedPlayer({ matchId, slotIdx });
      return;
    }

    if (selectedPlayer.matchId === matchId && selectedPlayer.slotIdx === slotIdx) {
      setSelectedPlayer(null);
      return;
    }

    // SWAP LOGIC
    const newMatches = JSON.parse(JSON.stringify(matches));
    const matchA = newMatches.find((m: any) => m.id === selectedPlayer.matchId);
    const matchB = newMatches.find((m: any) => m.id === matchId);

    if (matchA && matchB) {
      const s1 = selectedPlayer.slotIdx + 1;
      const s2 = slotIdx + 1;

      // Player IDs
      const pIdA = matchA[`player${s1}_id`];
      const pIdB = matchB[`player${s2}_id`];

      // Usernames
      const uA = matchA[`username${s1}`];
      const uB = matchB[`username${s2}`];

      // Avatars
      const aA = matchA[`avatar${s1}`];
      const aB = matchB[`avatar${s2}`];

      // Swap
      matchA[`player${s1}_id`] = pIdB;
      matchA[`username${s1}`] = uB;
      matchA[`avatar${s1}`] = aB;

      matchB[`player${s2}_id`] = pIdA;
      matchB[`username${s2}`] = uA;
      matchB[`avatar${s2}`] = aA;

      setMatches(newMatches);
      toast.success("Yerleri değiştirildi!");
    }

    setSelectedPlayer(null);
  };

  const handleEditPlayer = (e: React.MouseEvent, pId: string, username: string, avatar: string) => {
    e.stopPropagation();
    setEditingPlayer({ id: pId, username, avatar });
    setIsSetupOpen(true);
  };

  const handleSave = async () => {
    if (!slug || !tournament) return;
    setSaving(true);
    try {
      const currentRound = tournament.current_league_round || 1;
      const payload = matches.map(m => ({
        match_id: m.id,
        player1_id: m.player1_id,
        player2_id: m.player2_id,
        player3_id: m.player3_id,
        player4_id: m.player4_id
      }));

      await client.tournament.saveManualMatches(slug as string, { 
        round: currentRound, 
        matches: payload 
      });
      toast.success("Eşleşmeler başarıyla kaydedildi!");
      router.push(`/apps/tournament-editor/tournament?slug=${slug}`);
    } catch (err) {
      console.error(err);
      toast.error("Kaydedilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-4 text-blue-500">
      <CircleNotch size={48} className="animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Düzenleyici Hazırlanıyor...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()} 
              className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10 group"
            >
              <ArrowLeft size={24} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <ArrowsLeftRight size={20} className="text-blue-500" weight="bold" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Eşleşme Editörü</span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter uppercase">{tournament?.name}</h1>
              <p className="text-slate-500 text-sm font-medium mt-1">Tur {tournament?.current_league_round} • Oyuncuları masalara sürükleyebilir veya yerlerini değiştirebilirsiniz.</p>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 transition-all flex items-center gap-3 active:scale-95"
          >
            {saving ? <CircleNotch size={20} className="animate-spin" /> : <FloppyDisk size={20} weight="bold" />}
            DEĞİŞİKLİKLERİ KAYDET
          </button>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match, mIdx) => (
              <div key={match.id} className="bg-[#121216] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-4 py-1.5 rounded-full">Masa {mIdx + 1}</span>
                  <Users size={20} className="text-slate-700" />
                </div>

                <div className="space-y-3">
                  {[0, 1, 2, 3].slice(0, tournament?.players_per_match || 2).map((slotIdx) => {
                    const pId = match[`player${slotIdx + 1}_id`];
                    const username = match[`username${slotIdx + 1}`];
                    const avatar = match[`avatar${slotIdx + 1}`];
                    const isSelected = selectedPlayer?.matchId === match.id && selectedPlayer?.slotIdx === slotIdx;

                    return (
                      <div 
                        key={slotIdx}
                        onClick={() => handleSlotClick(match.id, slotIdx)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                          isSelected 
                            ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/20' 
                            : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border shrink-0 ${pId ? 'bg-slate-800 border-white/10' : 'bg-transparent border-dashed border-white/5'}`}>
                            {avatar ? (
                              <img src={avatar} className="w-full h-full object-contain" />
                            ) : pId ? (
                              <User size={20} className="text-slate-600" />
                            ) : (
                              <div className="w-2 h-2 bg-white/10 rounded-full" />
                            )}
                          </div>
                          <div className="flex flex-col items-start">
                            <span className={`text-xs font-black uppercase tracking-tight ${pId ? 'text-white' : 'text-slate-700 italic'}`}>
                              {username || 'Boş Slot'}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500">Pozisyon {slotIdx + 1}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {pId && (
                            <button
                              onClick={(e) => handleEditPlayer(e, pId, username, avatar)}
                              className="p-2 bg-white/5 rounded-xl text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Pencil size={16} weight="bold" />
                            </button>
                          )}
                          {isSelected && (
                            <div className="bg-blue-500 text-white p-1 rounded-lg">
                              <ArrowsLeftRight size={14} weight="bold" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 p-8 bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] flex items-center gap-6">
          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
            <Warning size={24} weight="bold" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-1">Nasıl Kullanılır?</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Yerini değiştirmek istediğiniz ilk oyuncunun üzerine tıklayın, ardından hedef oyuncuya veya boş slota tıklayın. Oyuncular anında yer değiştirecektir. 
              İşleminiz bittiğinde sağ üstteki <strong className="text-white">KAYDET</strong> butonuyla turnuvaya dönebilirsiniz.
            </p>
          </div>
        </div>
      </div>

      <PlayerSetupModal
        isOpen={isSetupOpen}
        onClose={() => {
          setIsSetupOpen(false);
          setEditingPlayer(null);
        }}
        onSuccess={fetchData}
        tournamentSlug={slug as string}
        client={client}
        initialData={editingPlayer}
      />
    </div>
  );
}
