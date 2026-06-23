"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import {
  Cards,
  Check,
  Sparkle,
  CaretLeft,
  CheckCircle,
  Clock,
  ShieldCheck,
  Star
} from "@phosphor-icons/react";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { stamp_card } from "@/lib/client";

const client = createBrowserClient();

function StampContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [stampCampaign, setStampCampaign] = useState<stamp_card.UserOwnedBusiness | null>(null);

  // Activation Form State
  const [stampLimit, setStampLimit] = useState("8");
  const [rewardTitle, setRewardTitle] = useState("1 Hediye Kahve");
  const [pinCode, setPinCode] = useState("1234");
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (isUserLoaded && user && id) {
      loadData();
    }
  }, [isUserLoaded, user, id]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const bizRes = await client.business.getBusiness(id);
      if (bizRes.business) {
        setBusinessName(bizRes.business.name);
      }

      const stampRes = await client.stamp_card.getUserData(user.id);
      const matchedStamp = (stampRes.my_businesses || []).find(
        (b) => b.id === id || b.name.toLowerCase() === bizRes.business?.name.toLowerCase()
      );

      if (matchedStamp) {
        setStampCampaign(matchedStamp);
      } else {
        setStampCampaign(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Sadakat kampanyası yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (pinCode.length !== 4) {
      toast.error("PIN kodu 4 hane olmalıdır.");
      return;
    }

    try {
      setActivating(true);
      const res = await client.stamp_card.createBusiness({
        businessId: id,
        stampLimit: parseInt(stampLimit) || 8,
        rewardTitle,
        pinCode
      });
      if (res.success) {
        toast.success("Sadakat kampanyası başarıyla aktifleştirildi!");
        await loadData();
      } else {
        toast.error("Kampanya başlatılamadı.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Kampanya aktifleştirilirken hata oluştu.");
    } finally {
      setActivating(false);
    }
  };


  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9] px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center">
          <h1 className="text-lg font-black text-stone-900 mb-2">Geçersiz Link</h1>
          <p className="text-sm text-stone-500">Stamp linkinde işletme ID bulunamadı.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9]">
        <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF9] text-stone-900 overflow-x-hidden relative font-sans">
      <Toaster position="top-center" />

      {/* Decorative blurred backgrounds */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-15%] w-[80vw] h-[80vw] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[70vw] h-[70vw] rounded-full bg-orange-500/5 blur-[120px]" />
      </div>

      <main className="flex-1 px-4 py-8 pb-32 max-w-md mx-auto w-full relative z-10">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(`/dashboard/business?id=${id}`)}
            className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 transition-all bg-white border border-stone-200/80 backdrop-blur-xl px-3.5 py-2.5 rounded-2xl shadow-sm active:scale-95 text-xs font-black uppercase tracking-widest cursor-pointer"
          >
            <CaretLeft size={14} weight="bold" />
            <span>İşletme Detayı</span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-black text-stone-900 flex items-center gap-2">
            <Cards size={24} className="text-amber-500" />
            Sadakat Kartı
          </h1>
          <p className="text-stone-450 text-[10px] uppercase font-black tracking-wider mt-1">{businessName}</p>
        </div>

        {!stampCampaign ? (
          /* Activation View */
          <div className="bg-white p-6 rounded-[2.2rem] border border-stone-200/80 shadow-sm space-y-6">
            <div className="text-center py-2">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Cards size={24} weight="fill" />
              </div>
              <h3 className="text-sm font-black text-stone-850 uppercase tracking-wide">Sadakat Kampanyası Başlat</h3>
              <p className="text-[10px] text-stone-450 mt-1 leading-normal font-medium max-w-[240px] mx-auto">
                Müşterileriniz için dijital kaşe kartı tanımlayın ve hediye ödülleriyle sadakati artırın.
              </p>
            </div>

            <form onSubmit={handleActivateCampaign} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Kaşe Limiti</label>
                <select
                  value={stampLimit}
                  onChange={(e) => setStampLimit(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-850 outline-none focus:border-amber-500"
                >
                  <option value="5">5 Kaşe</option>
                  <option value="8">8 Kaşe</option>
                  <option value="10">10 Kaşe</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Ödül Başlığı</label>
                <input
                  required
                  placeholder="1 Hediye Filtre Kahve"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-800 focus:border-amber-500 focus:bg-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Onay PIN Kodu (4 Hane)</label>
                <input
                  required
                  maxLength={4}
                  placeholder="1234"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs font-bold text-stone-855 focus:border-amber-500 focus:bg-white outline-none font-mono text-center tracking-widest"
                />
              </div>

              <button
                disabled={activating}
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                {activating ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={16} weight="bold" />
                    <span>Kampanyayı Başlat</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Active Dashboard View */
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-[2.2rem] border border-stone-200/80 shadow-sm space-y-4">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">KAŞE LİMİTİ</p>
                  <p className="text-sm font-black text-stone-850">{stampCampaign.stamp_limit} Adet</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">ÖDÜL KUPONU</p>
                  <p className="text-xs font-black text-amber-600 truncate uppercase">{stampCampaign.reward_title}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-wider mb-0.5">ONAY PIN KODU</p>
                  <span className="font-mono text-sm font-black bg-stone-100 px-3 py-1.5 rounded-xl text-amber-650 block text-center">
                    {stampCampaign.pin_code}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-650 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-xl">
                    <Check size={12} weight="bold" />
                    Kampanya Aktif
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/40 rounded-[2rem] border border-amber-300/30 p-5 space-y-3">
              <h4 className="text-xs font-black text-amber-850 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkle size={16} weight="fill" />
                Nasıl Kaşe Basılır?
              </h4>
              <p className="text-[10px] text-stone-600 leading-normal font-medium">
                Müşterileriniz kaşe talep ettiğinde, yukarıdaki 4 haneli PIN kodunu müşterinin cihazındaki Stamp Wallet alanına girerek kaşe işlemini tamamlayabilirsiniz.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


export default function StampCardManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9]">
          <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin" />
        </div>
      }
    >
      <StampContent />
    </Suspense>
  );
}
