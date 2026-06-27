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
  Star,
  Plus,
  Trash,
  Coins,
  Storefront
} from "@phosphor-icons/react";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { getAppRootUrl } from "@/lib/apps";
import { stamp_card } from "@/lib/client";

const client = createBrowserClient();

function StampContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [stampCampaign, setStampCampaign] = useState<stamp_card.UserOwnedBusiness | null>(null);

  // Activation Form State
  const [cardType, setCardType] = useState<'stamp' | 'token'>('stamp');
  const [stampLimit, setStampLimit] = useState("8");
  const [rewardTitle, setRewardTitle] = useState("1 Hediye Kahve");
  const [pinCode, setPinCode] = useState("1234");
  const [selectedTheme, setSelectedTheme] = useState("silver");
  const [marketItems, setMarketItems] = useState<{ id: string, name: string, price: number, icon: string }[]>([]);
  const [activating, setActivating] = useState(false);
  const [isEditing, setIsEditMode] = useState(false);

  const themes = [
    { id: "silver", name: "Gümüş", bg: "bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300", text: "text-slate-900", accent: "bg-slate-900/10" },
    { id: "titanium", name: "Titanyum", bg: "bg-gradient-to-br from-zinc-300 via-slate-200 to-zinc-400", text: "text-zinc-900", accent: "bg-zinc-900/10" },
    { id: "white", name: "Beyaz", bg: "bg-gradient-to-br from-white via-slate-50 to-slate-100", text: "text-slate-900", accent: "bg-slate-900/5" },
    { id: "gold", name: "Altın", bg: "bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-400", text: "text-amber-950", accent: "bg-amber-950/10" },
    { id: "copper", name: "Bakır", bg: "bg-gradient-to-br from-orange-300 via-orange-100 to-orange-400", text: "text-orange-950", accent: "bg-orange-950/10" },
    { id: "rose", name: "Rose", bg: "bg-gradient-to-br from-rose-200 via-rose-100 to-rose-300", text: "text-rose-950", accent: "bg-rose-950/10" },
    { id: "midnight", name: "Gece", bg: "bg-gradient-to-br from-zinc-800 via-zinc-900 to-black", text: "text-zinc-100", accent: "bg-white/10" },
    { id: "carbon", name: "Karbon", bg: "bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900", text: "text-neutral-100", accent: "bg-white/10" },
    { id: "emerald", name: "Zümrüt", bg: "bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950", text: "text-emerald-50", accent: "bg-white/10" },
    { id: "ocean", name: "Okyanus", bg: "bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-950", text: "text-blue-50", accent: "bg-white/10" },
    { id: "amethyst", name: "Ametist", bg: "bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900", text: "text-purple-50", accent: "bg-white/10" },
    { id: "sunset", name: "Günbatımı", bg: "bg-gradient-to-br from-orange-400 via-rose-400 to-purple-500", text: "text-white", accent: "bg-white/20" },
  ];

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
        setBusinessLogo(bizRes.business.logo_url || null);
      }

      const stampRes = await client.stamp_card.getUserData(user.id);
      const matchedStamp = (stampRes.my_businesses || []).find(
        (b) => b.id === id || b.name.toLowerCase() === bizRes.business?.name.toLowerCase()
      );

      if (matchedStamp) {
        setStampCampaign(matchedStamp);
        setCardType(matchedStamp.type as 'stamp' | 'token' || 'stamp');
        setStampLimit(matchedStamp.stamp_limit.toString());
        setRewardTitle(matchedStamp.reward_title);
        setPinCode(matchedStamp.pin_code);
        setSelectedTheme(matchedStamp.theme || "silver");
        setMarketItems(matchedStamp.market_items || []);
      } else {
        setStampCampaign(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Müdavim kampanyası yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (pinCode.length !== 4) {
      toast.error("PIN kodu 4 hane olmalıdır.");
      return;
    }

    try {
      setActivating(true);
      const payload = {
        businessId: id,
        stampLimit: parseInt(stampLimit) || 8,
        rewardTitle,
        pinCode,
        theme: selectedTheme,
        type: cardType,
        marketItems: marketItems
      };

      const res = stampCampaign 
        ? await client.stamp_card.updateBusiness(payload)
        : await client.stamp_card.createBusiness(payload);

      if (res.success) {
        toast.success(stampCampaign ? "Kampanya güncellendi!" : "Müdavim kampanyası başarıyla aktifleştirildi!");
        setIsEditMode(false);
        await loadData();
      } else {
        toast.error("İşlem başarısız oldu.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Kaydedilirken hata oluştu.");
    } finally {
      setActivating(false);
    }
  };

  const addMarketItem = () => {
    setMarketItems(prev => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), name: "", price: 10, icon: "🎁" }
    ]);
  };

  const updateMarketItem = (id: string, field: string, value: any) => {
    setMarketItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeMarketItem = (id: string) => {
    setMarketItems(prev => prev.filter(item => item.id !== id));
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
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => {
              window.location.href = getAppRootUrl();
            }}
            className="group flex items-center gap-2 text-slate-600 text-xs font-bold hover:text-slate-900 transition-all bg-white px-3.5 py-2.5 rounded-xl border border-slate-200/80 active:scale-95 shadow-sm shadow-slate-100"
          >
            <CaretLeft size={16} weight="bold" className="text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Geri</span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-10 flex items-center gap-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
            <Cards size={24} weight="fill" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none uppercase">
              Müdavim <span className="text-amber-600">Kartı</span>
            </h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5">{businessName}</p>
          </div>
        </div>

        {!stampCampaign || isEditing ? (
          /* Activation / Edit View */
          <div className="space-y-6">
            {/* Card Preview */}
            <div className="px-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">KART ÖNİZLEME</p>
              {(() => {
                const theme = themes.find(t => t.id === selectedTheme) || themes[0];
                return (
                  <div className={`relative aspect-[1.6/1] w-full rounded-[2rem] overflow-hidden border shadow-xl transition-all duration-500 ${theme.bg} border-white/20`}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/10 pointer-events-none" />
                    <div className={`relative h-full p-6 flex flex-col justify-between ${theme.text}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${theme.accent} backdrop-blur-md border border-white/30 flex items-center justify-center overflow-hidden`}>
                          {businessLogo ? (
                            <img src={businessLogo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className={`font-black text-xs ${theme.text}`}>{businessName.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <h3 className={`font-black text-sm tracking-tight leading-tight ${theme.text}`}>{businessName}</h3>
                          <p className={`text-[10px] opacity-70 font-bold uppercase tracking-wider ${theme.text}`}>
                            {cardType === 'token' ? 'Jeton Cüzdanı' : rewardTitle}
                          </p>
                        </div>
                      </div>

                      {cardType === 'token' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-lg border border-amber-300">
                            <Coins size={16} weight="fill" className="text-amber-900" />
                          </div>
                          <div className="flex flex-col -space-y-1">
                            <span className={`text-xl font-black tracking-tighter ${theme.text}`}>45</span>
                            <span className={`text-[7px] font-bold opacity-50 uppercase tracking-[0.2em] ${theme.text}`}>JETON</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-end justify-between">
                          <div className="grid grid-cols-5 gap-1.5">
                            {Array.from({ length: parseInt(stampLimit) || 8 }).map((_, i) => (
                              <div key={i} className={`w-4 h-4 rounded-full border ${i < 3 ? 'bg-[#C4FF00] border-[#C4FF00]' : 'bg-black/5 border-black/10'}`} />
                            ))}
                          </div>
                          <div className={`text-[10px] font-black opacity-50 uppercase tracking-widest ${theme.text}`}>3/{stampLimit}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="text-center py-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  {stampCampaign ? 'Kampanyayı Düzenle' : 'Müdavim Kampanyası Başlat'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium max-w-[240px] mx-auto">
                  Müşterileriniz için dijital kaşe kartı tanımlayın ve hediye ödülleriyle sadakati artırın.
                </p>
              </div>

              <form onSubmit={handleSaveCampaign} className="space-y-6">
                {/* Card Type Selection */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider px-1">Kart Tipi</label>
                  <div className="flex gap-2 p-1">
                    <button
                      type="button"
                      onClick={() => setCardType('stamp')}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        cardType === 'stamp' ? 'border-amber-500 bg-amber-50/30' : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <Cards size={20} weight={cardType === 'stamp' ? 'fill' : 'bold'} className={cardType === 'stamp' ? 'text-amber-600' : 'text-slate-400'} />
                      <span className={`text-[10px] font-black uppercase ${cardType === 'stamp' ? 'text-amber-600' : 'text-slate-400'}`}>Kaşe Kartı</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardType('token')}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        cardType === 'token' ? 'border-amber-500 bg-amber-50/30' : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <Coins size={20} weight={cardType === 'token' ? 'fill' : 'bold'} className={cardType === 'token' ? 'text-amber-600' : 'text-slate-400'} />
                      <span className={`text-[10px] font-black uppercase ${cardType === 'token' ? 'text-amber-600' : 'text-slate-400'}`}>Jeton Kartı</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider px-1">Kart Teması</label>
                  <div className="grid grid-cols-3 gap-2 p-1">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTheme(t.id)}
                        className={`h-12 rounded-xl border-2 transition-all relative overflow-hidden ${
                          selectedTheme === t.id ? 'border-amber-500 scale-[1.02] shadow-md' : 'border-transparent opacity-70 grayscale-[0.5]'
                        } ${t.bg}`}
                      >
                        <span className={`text-[8px] font-black uppercase tracking-tighter ${t.text}`}>
                          {t.name}
                        </span>
                        {selectedTheme === t.id && (
                          <div className="absolute top-1 right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
                            <Check size={8} weight="bold" className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {cardType === 'stamp' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider px-1">Kaşe Limiti</label>
                      <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border-2 border-slate-100">
                        {["6", "8", "10", "12"].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setStampLimit(num)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                              stampLimit === num ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider px-1">Ödül Başlığı</label>
                      <input
                        required
                        placeholder="1 Hediye Filtre Kahve"
                        value={rewardTitle}
                        onChange={(e) => setRewardTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-900 focus:border-amber-500 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Market Ürünleri</label>
                      <button
                        type="button"
                        onClick={addMarketItem}
                        className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase"
                      >
                        <Plus size={12} weight="bold" />
                        Ürün Ekle
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {marketItems.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                          <Storefront size={24} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Henüz ürün eklenmedi</p>
                        </div>
                      ) : (
                        marketItems.map((item) => (
                          <div key={item.id} className="flex gap-2 items-start p-3 bg-slate-50 rounded-2xl border-2 border-slate-100">
                            <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-lg shadow-sm">
                              <input
                                type="text"
                                value={item.icon}
                                onChange={(e) => updateMarketItem(item.id, 'icon', e.target.value)}
                                className="w-full text-center bg-transparent outline-none"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateMarketItem(item.id, 'name', e.target.value)}
                                placeholder="Ürün adı"
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-amber-500"
                              />
                              <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                  <Coins size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-600" />
                                  <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => updateMarketItem(item.id, 'price', parseInt(e.target.value))}
                                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-black outline-none focus:border-amber-500"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeMarketItem(item.id)}
                                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider px-1">Onay PIN Kodu (4 Hane)</label>
                  <input
                    required
                    maxLength={4}
                    placeholder="1234"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-900 focus:border-amber-500 focus:bg-white outline-none font-mono text-center tracking-widest transition-all"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="flex-1 bg-stone-100 text-stone-600 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                      Vazgeç
                    </button>
                  )}
                  <button
                    disabled={activating}
                    type="submit"
                    className="flex-[2] bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    {activating ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle size={16} weight="bold" />
                        <span>{stampCampaign ? 'Değişiklikleri Kaydet' : 'Kampanyayı Başlat'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Active Dashboard View */
          <div className="space-y-6">
            {/* Card Preview */}
            <div className="px-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">KART ÖNİZLEME</p>
              {(() => {
                const theme = themes.find(t => t.id === (stampCampaign.theme || 'silver')) || themes[0];
                return (
                  <div className={`relative aspect-[1.6/1] w-full rounded-[2rem] overflow-hidden border shadow-xl transition-all duration-500 ${theme.bg} border-white/20`}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/10 pointer-events-none" />
                    <div className={`relative h-full p-6 flex flex-col justify-between ${theme.text}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${theme.accent} backdrop-blur-md border border-white/30 flex items-center justify-center overflow-hidden`}>
                          {businessLogo ? (
                            <img src={businessLogo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-black text-xs">{businessName.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-black text-sm tracking-tight leading-tight">{businessName}</h3>
                          <p className="text-[10px] opacity-70 font-bold uppercase tracking-wider">
                            {stampCampaign.type === 'token' ? 'Jeton Cüzdanı' : stampCampaign.reward_title}
                          </p>
                        </div>
                      </div>

                      {stampCampaign.type === 'token' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-lg border border-amber-300">
                            <Coins size={16} weight="fill" className="text-amber-900" />
                          </div>
                          <div className="flex flex-col -space-y-1">
                            <span className={`text-xl font-black tracking-tighter ${theme.text}`}>45</span>
                            <span className={`text-[7px] font-bold opacity-50 uppercase tracking-[0.2em] ${theme.text}`}>JETON</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-end justify-between">
                          <div className="grid grid-cols-5 gap-1.5">
                            {Array.from({ length: stampCampaign.stamp_limit || 8 }).map((_, i) => (
                              <div key={i} className={`w-4 h-4 rounded-full border ${i < 3 ? 'bg-[#C4FF00] border-[#C4FF00]' : 'bg-black/5 border-black/10'}`} />
                            ))}
                          </div>
                          <div className={`text-[10px] font-black opacity-50 uppercase tracking-widest ${theme.text}`}>3/{stampCampaign.stamp_limit}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KAMPANYA AYARLARI</p>
                <button 
                  onClick={() => setIsEditMode(true)}
                  className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <Sparkle size={12} weight="fill" />
                  DÜZENLE
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">KART TİPİ</p>
                  <p className="text-sm font-black text-slate-900 uppercase">{stampCampaign.type === 'token' ? 'Jeton Kartı' : 'Kaşe Kartı'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ONAY PIN KODU</p>
                  <p className="text-sm font-mono font-black text-amber-600">{stampCampaign.pin_code}</p>
                </div>
              </div>

              {stampCampaign.type === 'token' ? (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">MARKET ÜRÜNLERİ</p>
                  <div className="space-y-2">
                    {(stampCampaign.market_items || []).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.icon}</span>
                          <span className="text-[11px] font-bold text-slate-900">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Coins size={12} weight="fill" className="text-amber-500" />
                          <span className="text-[11px] font-black text-slate-900">{item.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">KAŞE LİMİTİ</p>
                    <p className="text-sm font-black text-slate-900">{stampCampaign.stamp_limit} Adet</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ÖDÜL KUPONU</p>
                    <p className="text-xs font-black text-slate-900 uppercase">{stampCampaign.reward_title}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50/50 rounded-[2rem] border border-amber-100 p-6 space-y-3">
              <h4 className="text-xs font-black text-amber-800 uppercase tracking-wide flex items-center gap-2">
                <Sparkle size={18} weight="fill" className="text-amber-500" />
                Nasıl Kaşe Basılır?
              </h4>
              <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                Müşterileriniz kaşe talep ettiğinde, yukarıdaki 4 haneli PIN kodunu müşterinin cihazındaki Müdavim Kartı alanına girerek kaşe işlemini tamamlayabilirsiniz.
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
