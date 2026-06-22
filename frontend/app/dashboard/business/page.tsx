"use client";

import { Suspense, useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChefHat,
  Cards,
  CaretLeft,
  CaretRight,
  GraduationCap,
  ChatTeardropDots
} from "@phosphor-icons/react";
import { Toaster, toast } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { stamp_card } from "@/lib/client";

const client = createBrowserClient();

function BusinessDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [businessDesc, setBusinessDesc] = useState("");
  const [businessLogo, setBusinessLogo] = useState("");

  // ─── Stamp Card State ───
  const [stampCampaign, setStampCampaign] = useState<stamp_card.UserOwnedBusiness | null>(null);

  // Fetch business details
  useEffect(() => {
    if (isUserLoaded && user && id) {
      loadBusinessDetails();
    }
  }, [isUserLoaded, user, id]);

  const loadBusinessDetails = async () => {
    if (!user) return;
    try {
      setLoading(true);
      let name = "";
      let desc = "";
      let logo = "";

      const bizRes = await client.business.getBusiness(id);
      if (bizRes.business) {
        name = bizRes.business.name;
        desc = bizRes.business.description || "";
        logo = bizRes.business.logo_url || "";
      }

      // Check if they have a stamp card campaign
      const stampRes = await client.stamp_card.getUserData(user.id);
      const matchedStamp = (stampRes.my_businesses || []).find(
        (b) => b.id === id || (b.name && name && b.name.toLowerCase() === name.toLowerCase())
      );

      if (matchedStamp) {
        setStampCampaign(matchedStamp);
      } else {
        setStampCampaign(null);
      }

      setBusinessName(name || "İşletme Profili");
      setBusinessDesc(desc || "İşletme detayları");
      setBusinessLogo(logo || "");
    } catch (err) {
      console.error(err);
      toast.error("İşletme detayları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };


  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9] px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center">
          <h1 className="text-lg font-black text-stone-900 mb-2">Geçersiz Link</h1>
          <p className="text-sm text-stone-500">İşletme linkinde ID bulunamadı.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9]">
        <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF9] text-stone-900 overflow-x-hidden relative font-sans">
      <Toaster position="top-center" />

      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-15%] w-[80vw] h-[80vw] rounded-full bg-red-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[70vw] h-[70vw] rounded-full bg-amber-500/5 blur-[120px]" />
      </div>

      <main className="flex-1 px-4 py-8 pb-32 max-w-md mx-auto w-full relative z-10">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 transition-all bg-white border border-stone-200/80 backdrop-blur-xl px-3.5 py-2.5 rounded-2xl shadow-sm active:scale-95 text-xs font-black uppercase tracking-widest cursor-pointer"
          >
            <CaretLeft size={14} weight="bold" />
            <span>İşletmelerim</span>
          </button>
        </div>

        {/* Business Header Card */}
        <div className="bg-white p-5 rounded-[2.2rem] border border-stone-200/80 shadow-sm flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-150 flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">
            {businessLogo ? (
              <img src={businessLogo} alt={businessName} className="w-full h-full object-cover" />
            ) : (
              businessName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="font-black text-lg text-stone-900 leading-tight">{businessName}</h1>
            <p className="text-xs text-stone-400 mt-1 leading-normal font-medium">{businessDesc || "İşletme profili düzenleme."}</p>
          </div>
        </div>

        {/* Admin Panels */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">
            Yönetici Panelleri
          </h2>

          {/* CARD 1: DIGITAL MENU */}
          <div
            onClick={() => router.push(`/dashboard/digital-menu?id=${id}`)}
            className="bg-white p-5 rounded-[2.2rem] border border-stone-200/80 hover:border-red-300 transition-all cursor-pointer flex items-center justify-between group shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-[1.2rem] bg-red-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-500/10">
                <ChefHat size={24} weight="fill" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-stone-900 text-sm">Dijital Menü</h3>
                <p className="text-stone-450 text-[11px] font-medium leading-tight mt-1 line-clamp-1">
                  Menü ürünlerini ve garson çağrılarını yönet!
                </p>
              </div>
            </div>
            <CaretRight size={18} weight="bold" className="text-stone-400 group-hover:text-red-500 transition-colors ml-2" />
          </div>

          {/* CARD 2: STAMP CARD */}
          <div
            onClick={() => router.push(`/dashboard/stamp?id=${id}`)}
            className="bg-white p-5 rounded-[2.2rem] border border-stone-200/80 hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between group shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-[1.2rem] bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/10">
                <Cards size={24} weight="fill" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-stone-900 text-sm">Sadakat Kartı (Stamp)</h3>
                <p className="text-stone-450 text-[11px] font-medium leading-tight mt-1 line-clamp-1">
                  {stampCampaign ? "Müşteri kaşe kampanyasını ve PIN kodunu yönet." : "Sadakat kampanyasını kurun ve aktifleştirin."}
                </p>
              </div>
            </div>
            <CaretRight size={18} weight="bold" className="text-stone-400 group-hover:text-amber-500 transition-colors ml-2" />
          </div>

          {/* CARD 3: TUTOR PLACE */}
          <div
            onClick={() => router.push("/apps/tutor-crm")}
            className="bg-white p-5 rounded-[2.2rem] border border-stone-200/80 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between group shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/10">
                <GraduationCap size={24} weight="fill" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-stone-900 text-sm">Tutor Place</h3>
                <p className="text-stone-450 text-[11px] font-medium leading-tight mt-1 line-clamp-1">
                  Öğrenci CRM panelini ve ödeme takip sistemini aç.
                </p>
              </div>
            </div>
            <CaretRight size={18} weight="bold" className="text-stone-400 group-hover:text-indigo-500 transition-colors ml-2" />
          </div>

          {/* CARD 4: FEEDBACK BOARD */}
          <div
            onClick={() => router.push(`/dashboard/feedback-board?id=${id}`)}
            className="bg-white p-5 rounded-[2.2rem] border border-stone-200/80 hover:border-violet-300 transition-all cursor-pointer flex items-center justify-between group shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-[1.2rem] bg-violet-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-violet-600/10">
                <ChatTeardropDots size={24} weight="fill" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-stone-900 text-sm">Feedback Board</h3>
                <p className="text-stone-450 text-[11px] font-medium leading-tight mt-1 line-clamp-1">
                  Müşteri önerilerini ve oylamalarını takip et!
                </p>
              </div>
            </div>
            <CaretRight size={18} weight="bold" className="text-stone-400 group-hover:text-violet-600 transition-colors ml-2" />
          </div>
        </div>
      </main>

    </div>
  );
}


export default function BusinessDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9]">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin" />
        </div>
      }
    >
      <BusinessDetailContent />
    </Suspense>
  );
}
