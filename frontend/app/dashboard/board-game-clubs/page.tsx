"use client";

import { useState } from "react";
import { useBoardGameClubs } from "./context";
import { toast } from "react-hot-toast";
import { createClubAction } from "@/app/apps/board-game-clubs/actions";
import ClubDetailClient from "@/app/apps/board-game-clubs/[clubId]/ClubDetailClient";
import { useUser } from "@clerk/clerk-react";
import { CircleNotch, GameController, Plus } from "@phosphor-icons/react";

export default function BusinessBoardGameClubsPage() {
  const { id: businessId, business, club, loading, refreshData } = useBoardGameClubs();
  const { user } = useUser();
  const [creating, setCreating] = useState(false);

  const handleCreateClub = async () => {
    if (!business || !user) return;
    try {
      setCreating(true);
      const res = await createClubAction({
        name: business.name,
        description: business.description || "",
        logoUrl: business.logo_url || "",
        ownerId: user.id,
        businessId: businessId
      });
      if (res.data) {
        await refreshData();
        toast.success("Oyun kütüphanesi oluşturuldu!");
      } else {
        toast.error("Kütüphane oluşturulamadı.");
      }
    } catch (err) {
      toast.error("Bir hata oluştu.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <CircleNotch size={40} className="animate-spin text-[#D4A830]" />
          <p className="text-stone-500 text-sm font-bold">Kütüphane yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <div className="w-20 h-20 bg-[#D4A830]/5 rounded-[2.5rem] flex items-center justify-center mb-6 border border-[#D4A830]/10 shadow-sm">
          <GameController size={40} weight="fill" className="text-[#D4A830]" />
        </div>
        <h2 className="text-2xl font-black text-stone-900 tracking-tight mb-2">Oyun Kütüphanesi</h2>
        <p className="text-stone-500 text-sm max-w-md mb-8 leading-relaxed">
          İşletmenizdeki kutu oyunlarını yönetmek, müşterilerinize sunmak ve kütüphanenizi dijitalleştirmek için hemen başlayın.
        </p>
        <button
          onClick={handleCreateClub}
          disabled={creating}
          className="flex items-center gap-2 px-8 py-4 bg-[#D4A830] hover:bg-[#B88F28] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#D4A830]/20 active:scale-95 disabled:opacity-50"
        >
          {creating ? <CircleNotch size={18} className="animate-spin" /> : <Plus size={18} weight="bold" />}
          Kütüphaneyi Aktif Et
        </button>
      </div>
    );
  }

  return <ClubDetailClient clubId={club.id} hideHeader={true} />;
}
