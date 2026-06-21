"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

const localeData = {
  tr: {
    continueWithGoogle: "Google ile devam et",
    continueWithApple: "Apple ile devam et",
    termsStart: "Devam ederek,",
    termsOfService: "Kullanım Şartları",
    termsMiddle: "ve",
    privacyPolicy: "Gizlilik Politikası",
    termsEnd: "koşullarını kabul etmiş olursunuz.",
    tagline: "Günün yardımcı araçları",
    slides: [
      {
        title: "Düzinelerce Mini Uygulama",
        description: "Hava durumundan bütçe yönetimine, yemek tariflerinden oyunlara her şey tek bir süper uygulamada!"
      },
      {
        title: "Kişiselleştirilebilir Ana Ekran",
        description: "Günlük kullandığın modülleri ana ekranına ekle, kendine özel kontrol panelini oluştur."
      },
      {
        title: "Tek Hesap, Bulut Senkronizasyonu",
        description: "Tek bir üyelikle tüm cihazlarında verilerini güvenle eşitle ve kaldığın yerden devam et."
      },
      {
        title: "Ortak Odalar & Sosyal",
        description: "Arkadaşlarını ekle, listelerini paylaş ve mini oyunlarda birlikte eğlen."
      },
      {
        title: "Gelişim Panelim",
        description: "Tasarruf meydan okumalarını takip et, hedefler belirle ve alışkanlıklarını yönet."
      },
      {
        title: "Sürekli Güncellenen İçerik",
        description: "Düzenli olarak eklenen yeni modüllerle günlük hayatını kolaylaştırmaya devam et!"
      }
    ]
  },
  en: {
    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple",
    termsStart: "By continuing, you agree to our",
    termsOfService: "Terms of Service",
    termsMiddle: "and",
    privacyPolicy: "Privacy Policy",
    termsEnd: ".",
    tagline: "Daily utility tools",
    slides: [
      {
        title: "Dozens of Mini Apps",
        description: "Weather, budget tracking, recipes, and games all in one single super application!"
      },
      {
        title: "Customizable Home Screen",
        description: "Add daily modules to your dashboard and design your personal layout."
      },
      {
        title: "One Account, Cloud Sync",
        description: "Synchronize your data across web and mobile securely and pick up where you left off."
      },
      {
        title: "Shared Rooms & Social",
        description: "Add friends, share your lists, and have fun together in mini games."
      },
      {
        title: "Progress Dashboard",
        description: "Track saving challenges, set goals, and manage your daily habits."
      },
      {
        title: "Continuously Updated",
        description: "New modules and features added regularly to support your daily routines!"
      }
    ]
  }
};

export default function SignInPage() {
  const router = useRouter();
  const { isAuthenticated, loading, signIn } = useAuthContext();
  const { locale } = useLanguage();
  const [pendingProvider, setPendingProvider] = useState<"google" | "apple" | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const TOTAL_SLIDES = 6;
  const t = localeData[locale as "tr" | "en"] || localeData.tr;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
    }, 4500);
    return () => clearInterval(timer);
  }, [currentSlide]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setPendingProvider("google");
    try {
      await signIn("google");
    } finally {
      setPendingProvider(null);
    }
  };

  const handleAppleLogin = async () => {
    setPendingProvider("apple");
    try {
      await signIn("apple");
    } finally {
      setPendingProvider(null);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % TOTAL_SLIDES);
    } else if (isRightSwipe) {
      setCurrentSlide((prev) => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="min-h-[100dvh] bg-[#0F172B] flex flex-col justify-between p-6 overflow-hidden relative selection:bg-emerald-500/30">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Section - Branding */}
      <div className="z-10 flex flex-col items-center mt-3">
        {/* Official Brand Logo */}
        <div className="flex text-3xl font-black text-white tracking-tight logo-container select-none">
          <span className="inline-block px-2.5 py-1.5 bg-white text-black rounded-lg text-sm sm:text-base font-black logo-letter">E</span>
          <span className="inline-block px-2.5 py-1.5 bg-white text-black rounded-lg text-sm sm:text-base font-black mx-0.5 logo-letter">V</span>
          <span className="inline-block px-2.5 py-1.5 bg-white text-black rounded-lg text-sm sm:text-base font-black logo-letter">E</span>
          <span className="inline-block px-2.5 py-1.5 bg-white text-black rounded-lg text-sm sm:text-base font-black mx-0.5 logo-letter">R</span>
          <span className="inline-block px-2.5 py-1.5 bg-white text-black rounded-lg text-sm sm:text-base font-black logo-letter">Y</span>
          <span className="inline-block px-2.5 py-1.5 bg-white text-black rounded-lg text-sm sm:text-base font-black mx-0.5 logo-letter">T</span>
          <span className="inline-block px-2.5 py-1.5 bg-white text-black rounded-lg text-sm sm:text-base font-black logo-letter">H</span>
          <span className="inline-block px-2.5 py-1.5 bg-white text-black rounded-lg text-sm sm:text-base font-black mx-0.5 logo-letter">I</span>
          <span className="inline-block px-2.5 py-1.5 bg-slate-400 text-black rounded-lg text-sm sm:text-base font-black logo-letter">N</span>
          <span className="inline-block px-2.5 py-1.5 bg-emerald-500 text-black rounded-lg text-sm sm:text-base font-black mx-0.5 logo-letter">G</span>
        </div>
      </div>

      {/* Middle Section - Dynamic Carousel Card */}
      <div 
        className="flex-1 flex items-center justify-center z-10 w-full max-w-sm mx-auto my-1"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative w-full aspect-[0.98] max-h-[300px] flex items-center justify-center">
          {/* SLIDE 0 — Düzinelerce Mini Uygulama */}
          {(() => {
            const idx = 0;    
            const isActive = currentSlide === idx;
            const isPrev = currentSlide === (idx + 1) % TOTAL_SLIDES;
            const tc = isActive ? "translate-x-0 opacity-100 scale-100" : isPrev ? "-translate-x-full opacity-0 scale-95 pointer-events-none" : "translate-x-full opacity-0 scale-95 pointer-events-none";
            const slide = t.slides[idx];

            return (
              <div className={`absolute inset-0 transition-all duration-700 ease-in-out flex flex-col items-center justify-between p-4 bg-slate-800/90 rounded-3xl border border-slate-700/60 shadow-2xl ${tc} ${isActive ? "z-20" : "z-0"}`}>
                <div className="text-center px-2 select-none">
                  <h3 className="text-sm font-bold text-emerald-400 mb-1">{slide.title}</h3>
                  <p className="text-xs text-slate-200 leading-snug max-w-[280px] mx-auto text-balance">
                    {slide.description}
                  </p>
                </div>

                <div className="w-full flex-1 flex flex-col gap-2 justify-center mt-2">
                  {[
                    { icon: "⛅", name: locale === "tr" ? "Hava Durumu" : "Weather", color: "from-sky-400 to-blue-500" },
                    { icon: "🥫", name: locale === "tr" ? "Kiler" : "Pantry", color: "from-amber-500 to-orange-600" },
                    { icon: "🐖", name: locale === "tr" ? "Birikim" : "Savings", color: "from-emerald-400 to-emerald-600" },
                    { icon: "🎯", name: locale === "tr" ? "Tasarruf" : "Budget", color: "from-rose-500 to-red-650" },
                  ].map((g, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-900/60 rounded-2xl px-3 py-1.5 border border-slate-700/40">
                      <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-sm shrink-0 shadow`}>{g.icon}</div>
                      <span className="flex-1 text-white text-xs font-bold">{g.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* SLIDE 1 — Kişiselleştirilebilir Ana Ekran */}
          {(() => {
            const idx = 1;
            const isActive = currentSlide === idx;
            const isPrev = currentSlide === (idx + 1) % TOTAL_SLIDES;
            const tc = isActive ? "translate-x-0 opacity-100 scale-100" : isPrev ? "-translate-x-full opacity-0 scale-95 pointer-events-none" : "translate-x-full opacity-0 scale-95 pointer-events-none";
            const slide = t.slides[idx];

            return (
              <div className={`absolute inset-0 transition-all duration-700 ease-in-out flex flex-col items-center justify-between p-4 bg-slate-800/90 rounded-3xl border border-slate-700/60 shadow-2xl ${tc} ${isActive ? "z-20" : "z-0"}`}>
                <div className="text-center px-2 select-none">
                  <h3 className="text-sm font-bold text-emerald-400 mb-1">{slide.title}</h3>
                  <p className="text-xs text-slate-200 leading-snug max-w-[280px] mx-auto text-balance">
                    {slide.description}
                  </p>
                </div>

                <div className="w-full flex-1 flex flex-col gap-2 justify-center mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: locale === "tr" ? "Hava Durumu" : "Weather", active: true },
                      { name: locale === "tr" ? "Kiler" : "Pantry", active: true },
                      { name: locale === "tr" ? "Yemekhane" : "Cafeteria", active: false },
                      { name: locale === "tr" ? "Pomodoro" : "Pomodoro", active: true },
                    ].map((app, i) => (
                      <div key={i} className={`p-3 rounded-2xl border text-center transition-all ${
                        app.active ? "bg-emerald-500/10 border-emerald-500/30 text-white" : "bg-slate-900/40 border-slate-800/50 text-slate-500"
                      }`}>
                        <div className="text-xs font-bold truncate">{app.name}</div>
                        <div className="text-[10px] mt-1 font-semibold">{app.active ? (locale === "tr" ? "Eklendi" : "Added") : (locale === "tr" ? "Kaldırıldı" : "Removed")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SLIDE 2 — Tek Hesap, Bulut Senkronizasyonu */}
          {(() => {
            const idx = 2;
            const isActive = currentSlide === idx;
            const isPrev = currentSlide === (idx + 1) % TOTAL_SLIDES;
            const tc = isActive ? "translate-x-0 opacity-100 scale-100" : isPrev ? "-translate-x-full opacity-0 scale-95 pointer-events-none" : "translate-x-full opacity-0 scale-95 pointer-events-none";
            const slide = t.slides[idx];

            return (
              <div className={`absolute inset-0 transition-all duration-700 ease-in-out flex flex-col items-center justify-between p-4 bg-slate-800/90 rounded-3xl border border-slate-700/60 shadow-2xl ${tc} ${isActive ? "z-20" : "z-0"}`}>
                <div className="text-center px-2 select-none">
                  <h3 className="text-sm font-bold text-emerald-400 mb-1">{slide.title}</h3>
                  <p className="text-xs text-slate-200 leading-snug max-w-[280px] mx-auto text-balance">
                    {slide.description}
                  </p>
                </div>

                <div className="w-full flex-1 flex flex-col gap-4 justify-center items-center mt-2">
                  <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-lg border border-slate-700">📱</div>
                      <span className="text-[10px] text-slate-400 font-bold">{locale === "tr" ? "Mobil" : "Mobile"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-450 animate-pulse">
                      <span>──</span>
                      <span>🔄</span>
                      <span>──</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-lg border border-slate-700">💻</div>
                      <span className="text-[10px] text-slate-400 font-bold">{locale === "tr" ? "Tarayıcı" : "Browser"}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SLIDE 3 — Ortak Odalar & Sosyal */}
          {(() => {
            const idx = 3;
            const isActive = currentSlide === idx;
            const isPrev = currentSlide === (idx + 1) % TOTAL_SLIDES;
            const tc = isActive ? "translate-x-0 opacity-100 scale-100" : isPrev ? "-translate-x-full opacity-0 scale-95 pointer-events-none" : "translate-x-full opacity-0 scale-95 pointer-events-none";
            const slide = t.slides[idx];

            return (
              <div className={`absolute inset-0 transition-all duration-700 ease-in-out flex flex-col items-center justify-between p-4 bg-slate-800/90 rounded-3xl border border-slate-700/60 shadow-2xl ${tc} ${isActive ? "z-20" : "z-0"}`}>
                <div className="text-center px-2 select-none">
                  <h3 className="text-sm font-bold text-emerald-400 mb-1">{slide.title}</h3>
                  <p className="text-xs text-slate-200 leading-snug max-w-[280px] mx-auto text-balance">
                    {slide.description}
                  </p>
                </div>

                <div className="w-full flex-1 flex flex-col gap-2 justify-center mt-2">
                  <div className="bg-slate-900/60 rounded-2xl p-3 border border-slate-700/40">
                    <div className="flex items-center gap-2 mb-2">
                      {["U", "S", "M"].map((l, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white bg-gradient-to-br ${["from-emerald-400 to-emerald-600", "from-blue-400 to-blue-600", "from-purple-400 to-purple-600"][i]}`}>{l}</div>
                      ))}
                      <div className="w-6 h-6 rounded-full border border-dashed border-slate-600 flex items-center justify-center">
                        <span className="text-slate-500 text-xs">+</span>
                      </div>
                      <span className="text-[10px] text-slate-400 ml-auto">{locale === "tr" ? "Aktif Arkadaşlar" : "Active Friends"}</span>
                    </div>
                    <div className="text-[10px] text-slate-350">{locale === "tr" ? "Son Aktivite: Kiler güncellendi" : "Last Activity: Pantry updated"}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SLIDE 4 — Gelişim Panelim */}
          {(() => {
            const idx = 4;
            const isActive = currentSlide === idx;
            const isPrev = currentSlide === (idx + 1) % TOTAL_SLIDES;
            const tc = isActive ? "translate-x-0 opacity-100 scale-100" : isPrev ? "-translate-x-full opacity-0 scale-95 pointer-events-none" : "translate-x-full opacity-0 scale-95 pointer-events-none";
            const slide = t.slides[idx];

            return (
              <div className={`absolute inset-0 transition-all duration-700 ease-in-out flex flex-col items-center justify-between p-4 bg-slate-800/90 rounded-3xl border border-slate-700/60 shadow-2xl ${tc} ${isActive ? "z-20" : "z-0"}`}>
                <div className="text-center px-2 select-none">
                  <h3 className="text-sm font-bold text-emerald-400 mb-1">{slide.title}</h3>
                  <p className="text-xs text-slate-200 leading-snug max-w-[280px] mx-auto text-balance">
                    {slide.description}
                  </p>
                </div>

                <div className="w-full flex-1 flex flex-col gap-2.5 justify-center mt-2">
                  {[
                    { name: locale === "tr" ? "Yeni Telefon Hedefi" : "New Phone Target", progress: "80%", color: "from-blue-500 to-cyan-500" },
                    { name: locale === "tr" ? "Kitap Okuma Alışkanlığı" : "Book Reading Streak", progress: "60%", color: "from-emerald-500 to-teal-500" },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-900/60 rounded-2xl px-3 py-2 border border-slate-700/40">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white text-xs font-bold truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{item.progress}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full bg-gradient-to-r ${item.color}`}
                          style={{ width: item.progress }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* SLIDE 5 — Sürekli Güncellenen İçerik */}
          {(() => {
            const idx = 5;
            const isActive = currentSlide === idx;
            const isPrev = currentSlide === 0;
            const tc = isActive ? "translate-x-0 opacity-100 scale-100" : isPrev ? "-translate-x-full opacity-0 scale-95 pointer-events-none" : "translate-x-full opacity-0 scale-95 pointer-events-none";
            const slide = t.slides[idx];

            return (
              <div className={`absolute inset-0 transition-all duration-700 ease-in-out flex flex-col items-center justify-between p-4 bg-slate-800/90 rounded-3xl border border-slate-700/60 shadow-2xl ${tc} ${isActive ? "z-20" : "z-0"}`}>
                <div className="text-center px-2 select-none">
                  <h3 className="text-sm font-bold text-emerald-400 mb-1">{slide.title}</h3>
                  <p className="text-xs text-slate-200 leading-snug max-w-[280px] mx-auto text-balance">
                    {slide.description}
                  </p>
                </div>

                <div className="w-full flex-1 flex flex-col justify-center mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: "🎮", label: locale === "tr" ? "Yeni Oyunlar" : "New Games", color: "from-amber-400 to-orange-500" },
                      { icon: "📈", label: locale === "tr" ? "İstatistikler" : "Statistics", color: "from-pink-400 to-rose-500" },
                      { icon: "🛠️", label: locale === "tr" ? "Pratik Araçlar" : "Quick Tools", color: "from-blue-400 to-cyan-500" },
                      { icon: "🔔", label: locale === "tr" ? "Bildirimler" : "Notifications", color: "from-orange-400 to-amber-500" },
                    ].map((b, i) => (
                      <div key={i} className="rounded-2xl p-2.5 bg-slate-900/60 border border-slate-700/40 flex flex-col items-center justify-center gap-1 text-center">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${b.color} flex items-center justify-center text-lg`}>{b.icon}</div>
                        <span className="text-[10px] font-bold text-white truncate w-full">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Carousel Indicators */}
          <div className="absolute -bottom-5 left-0 right-0 flex justify-center gap-1.5 z-30">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? "w-5 bg-white" : "w-1 bg-white/30"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Login Options */}
      <div className="w-full max-w-sm mx-auto z-10 space-y-5 mb-4">
        <div className="space-y-2">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading || pendingProvider !== null}
            className="w-full flex items-center justify-center gap-3 bg-slate-800/85 hover:bg-slate-750 text-white font-bold py-3.5 px-4 rounded-2xl transition-all duration-200 border border-slate-700/50 hover:border-slate-600/60 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            {pendingProvider === "google" ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm tracking-tight">{t.continueWithGoogle}</span>
              </>
            )}
          </button>

          {/* Apple Login */}
          <button
            onClick={handleAppleLogin}
            disabled={loading || pendingProvider !== null}
            className="w-full flex items-center justify-center gap-3 bg-slate-800/85 hover:bg-slate-750 text-white font-bold py-3.5 px-4 rounded-2xl transition-all duration-200 border border-slate-700/50 hover:border-slate-600/60 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            {pendingProvider === "apple" ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mb-0.5" viewBox="0 0 384 512" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4.1 190.1 4.1 270.7c0 45.4 17.1 113 54 165.5 19.3 27.2 41.2 55 70.8 55s40.2-22.1 76-22.1c35.2 0 45.1 22.1 75.1 22.1s52-25.1 70.3-52.1c25.4-36.5 35.8-71.8 36-73.4-.6-.4-69.6-26.4-69.8-106.1zm-82.5-171.7c17.1-20.7 28.5-49.4 25.3-78-24.8 1.1-54.7 16.5-72.5 37.5-16.1 18.9-30.2 48.8-26.4 76.5 27.7 2.1 56.5-15.3 73.6-36z" />
                </svg>
                <span className="text-sm tracking-tight">{t.continueWithApple}</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info/Terms */}
        <p className="text-[11px] text-slate-500 text-center leading-relaxed text-balance px-4">
          {t.termsStart}{" "}
          <Link href="/terms" className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors font-semibold">
            {t.termsOfService}
          </Link>{" "}
          {t.termsMiddle}{" "}
          <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors font-semibold">
            {t.privacyPolicy}
          </Link>{" "}
          {t.termsEnd}
        </p>
      </div>
    </div>
  );
}