"use client";

import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  Cards,
  CaretRight,
  GraduationCap,
  ChatTeardropDots,
  SquaresFour
} from "@phosphor-icons/react";
import { useBusiness } from "./layout";

export default function BusinessDetailPage() {
  const { user } = useUser();
  const { id, business, loading, stampCampaign } = useBusiness();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight mb-1">
                Hoş Geldin, <span className="text-red-500">{user?.firstName || "Yönetici"}</span>! 👋
              </h2>
              <p className="text-stone-500 text-sm font-medium">
                {business?.name} işletmen için tüm araçlar burada.
              </p>
            </div>
          </div>
        </section>

        {/* Placeholder for future dashboard content */}
        <div className="py-20 text-center border-2 border-dashed border-stone-100 rounded-[3rem] bg-stone-50/30">
          <div className="w-16 h-16 bg-white rounded-2xl border border-stone-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <SquaresFour size={32} className="text-stone-300" weight="bold" />
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Dashboard İçeriği Çok Yakında</p>
          <p className="text-stone-300 text-[10px] mt-1">İşletmenize ait özet veriler ve raporlar burada görünecek.</p>
        </div>

      </div>
    </div>
  );
}
