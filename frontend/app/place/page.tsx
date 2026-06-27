"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Globe, 
  InstagramLogo, 
  TwitterLogo, 
  FacebookLogo, 
  WhatsappLogo, 
  Phone, 
  Envelope, 
  MapPin, 
  ArrowSquareOut,
  ChefHat,
  Cards,
  Megaphone,
  Coffee,
  GameController,
  ChatTeardropDots,
  PaperPlaneTilt,
  Users,
  SealCheck,
  Microphone
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { business_page } from "@/lib/client";
import { BUSINESS_APPS, navigateToMiniApp } from "@/lib/apps";

const client = createBrowserClient();

const ICON_MAP: Record<string, any> = {
  Globe,
  Instagram: InstagramLogo,
  Twitter: TwitterLogo,
  Facebook: FacebookLogo,
  Whatsapp: WhatsappLogo,
  Phone,
  Envelope,
  MapPin,
  ChefHat,
  Cards,
  Megaphone,
  Coffee,
  GameController,
  ChatTeardropDots,
  PaperPlaneTilt,
  Users,
  Microphone: Microphone
};

const SOCIAL_CONFIG = [
  { key: "instagram", label: "Instagram", icon: InstagramLogo },
  { key: "twitter", label: "Twitter / X", icon: TwitterLogo },
  { key: "facebook", label: "Facebook", icon: FacebookLogo },
  { key: "whatsapp", label: "WhatsApp", icon: WhatsappLogo },
  { key: "website", label: "Web Sitesi", icon: Globe },
  { key: "phone", label: "Telefon", icon: Phone },
  { key: "address", label: "Google Maps", icon: MapPin },
];

const PROMOTABLE_APPS = [
  { id: "game-companion", name: "Yazboz", description: "Dijital Skor Tablosu", color: "#228BE6", url: "https://yazboz.allminiapps.com" },
  { id: "iskambil", name: "İskambil", description: "Oyun Kuralları Rehberi", color: "#e03131", url: "https://cardgames.allminiapps.com" },
  { id: "suggest", name: "Suggest", description: "Arkadaşlarına Öner", color: "#6366f1", url: "https://suggest.allminiapps.com" },
  { id: "kim-gelir", name: "Ne Yapsak?", description: "Etkinlik Planla", color: "#FF5252", url: "https://kimgelir.allminiapps.com" },
  { id: "workplaces", name: "Workplaces", description: "Çalışma Alanı Keşfet", color: "#6F4E37", url: "https://workplaces.allminiapps.com" },
  { id: "standups", name: "Standups", description: "Stand-up Keşfet", color: "#FFD43B", url: "https://standups.allminiapps.com" },
];

export default function PublicBusinessPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin"></div>
      </div>
    }>
      <PublicBusinessPageContent />
    </Suspense>
  );
}

function PublicBusinessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("slug") || searchParams.get("biz");
  const isPreview = searchParams.get("preview") === "true";

  const [business, setBusiness] = useState<any>(null);
  const [links, setLinks] = useState<business_page.Link[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLinkClick = (e: React.MouseEvent, link: business_page.Link) => {
    // Try to find the app by ID first, then by URL
    let businessApp = link.app_id ? BUSINESS_APPS.find(a => a.id === link.app_id) : null;
    
    if (!businessApp) {
      // Try to match by URL if it's one of our promotable apps
      const promoApp = PROMOTABLE_APPS.find(p => p.url === link.url);
      if (promoApp) {
        businessApp = BUSINESS_APPS.find(a => a.id === promoApp.id) || null;
      }
    }
    
    if (businessApp) {
      e.preventDefault();
      navigateToMiniApp(businessApp, router);
    }
  };

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await client.business.getBusinessBySlug(slug);
        let bizData = res.business;
        
        if (!bizData && slug) {
          const fallbackRes = await client.business.getBusiness(slug);
          bizData = fallbackRes.business;
        }

        if (bizData) {
          setBusiness(bizData);
          try {
            const linksRes = await client.business_page.getLinks(bizData.id);
            setLinks(linksRes.links || []);
          } catch (linksErr) {
            console.error("Error fetching links:", linksErr);
          }
        }
      } catch (err) {
        console.error("Error fetching business data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    if (isPreview) {
      const interval = setInterval(fetchData, 2000);
      return () => clearInterval(interval);
    }
  }, [slug, isPreview]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-8 text-center">
        <p className="text-stone-400 font-bold">Mekan bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white flex flex-col items-center ${isPreview ? 'overflow-hidden' : ''}`}>
      <div className="w-full max-w-md flex flex-col items-center min-h-screen relative">
        
        {/* Profile Header */}
        <div className="w-full px-6 pt-12 pb-4 flex flex-col items-center shrink-0">
          <div className="w-24 h-24 rounded-3xl bg-stone-50 border border-stone-100 shadow-sm overflow-hidden mb-4 relative group">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-3xl font-black text-white"
                style={{ backgroundColor: business.theme_color || "#10B981" }}
              >
                {business.name?.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <h2 className="text-base font-black text-stone-900 tracking-tight text-center">{business.name}</h2>
            <SealCheck size={16} weight="fill" className="text-emerald-500" />
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-2.5 mt-3 mb-1">
            {SOCIAL_CONFIG.map(social => {
              const existingLink = links.find(l => l.is_enabled && l.title === social.label);
              if (!existingLink) return null;
              
              const IconComp = social.icon;
              return (
                <a 
                  key={social.key} 
                  href={existingLink.url}
                  className="w-7 h-7 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 shadow-sm active:scale-95 transition-transform"
                >
                  <IconComp size={14} weight="fill" />
                </a>
              );
            })}
          </div>

          {business.description && (
            <p className="text-[10px] font-medium text-stone-400 mt-1 text-center px-8 line-clamp-2">{business.description}</p>
          )}
        </div>

        {/* Links Section */}
        <div className="w-full px-6 space-y-3 mt-4">
          {/* Regular Links */}
          {links.filter(l => 
            l.is_enabled && 
            !PROMOTABLE_APPS.some(p => p.url === l.url) && 
            !SOCIAL_CONFIG.some(s => l.title === s.label)
          ).map(link => {
            const IconComp = ICON_MAP[link.icon || "Link"] || Globe;
            const businessApp = link.app_id ? BUSINESS_APPS.find(a => a.id === link.app_id) : null;
            const isApp = !!businessApp;
            const appColor = businessApp?.color || "#10B981";
            
            return (
              <a 
                key={link.id}
                href={link.url}
                onClick={(e) => handleLinkClick(e, link)}
                className={`w-full py-2.5 px-4 bg-stone-50 border border-stone-100 rounded-2xl flex items-center relative group active:scale-[0.98] transition-all ${isApp ? "bg-white shadow-sm border-stone-200" : ""}`}
              >
                <div 
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden ${!isApp ? "bg-stone-100 text-stone-400" : ""}`}
                  style={isApp ? { backgroundColor: appColor } : {}}
                >
                  {isApp && <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />}
                  <IconComp size={14} weight="fill" color={isApp ? "white" : undefined} className="relative z-10" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-[11px] font-black text-stone-800 truncate leading-tight">
                    {(link.subtitle || link.title)?.replace("Sadakat Kartı", "Müdavim Kartı")}
                  </p>
                  {link.subtitle && (
                    <p className="text-[9px] font-bold text-stone-400 truncate leading-tight mt-0.5">
                      {link.title?.replace("Sadakat Kartı", "Müdavim Kartı")}
                    </p>
                  )}
                </div>
                {!isApp && <ArrowSquareOut size={12} weight="bold" className="text-stone-300 ml-2" />}
              </a>
            );
          })}

          {/* Promoted Apps Section */}
          {links.some(l => l.is_enabled && PROMOTABLE_APPS.some(p => p.url === l.url)) && (
            <div className="flex flex-wrap justify-center gap-x-1 gap-y-2 w-full mt-8">
              {links.filter(l => l.is_enabled && PROMOTABLE_APPS.some(p => p.url === l.url)).map(link => {
                const promoApp = PROMOTABLE_APPS.find(p => p.url === link.url);
                const IconComp = ICON_MAP[link.icon || "Link"] || Globe;
                const appColor = promoApp?.color || "#10B981";
                
                return (
                  <a 
                    key={link.id}
                    href={link.url}
                    onClick={(e) => handleLinkClick(e, link)}
                    className="bg-transparent flex flex-col items-center text-center group py-2 w-[22%] active:scale-95 transition-transform"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden mb-2"
                      style={{ backgroundColor: appColor }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
                      <IconComp size={14} weight="fill" color="white" className="relative z-10" />
                    </div>
                    <div className="w-full">
                      <p className="text-[8px] font-black text-stone-800 truncate leading-tight mb-0.5">
                        {(link.subtitle || link.title)?.replace("Sadakat Kartı", "Müdavim Kartı")}
                      </p>
                      <p className="text-[6px] font-bold text-stone-400 leading-tight whitespace-pre-line line-clamp-2">
                        {link.subtitle ? link.title?.replace("Sadakat Kartı", "Müdavim Kartı") : ""}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 pb-8 flex flex-col items-center px-6 w-full">
          <div className="w-full bg-stone-50 rounded-3xl p-5 flex flex-col items-center text-center mb-8 border border-stone-100">
            <h4 className="text-[10px] font-black text-stone-900 uppercase tracking-wider mb-1.5">Everything ile daha fazlasını keşfet</h4>
            <p className="text-[8px] font-medium text-stone-400 leading-relaxed mb-4 px-2">
              Favori mekanlarını kaydet, arkadaşlarına öner ve yakındaki etkinlikleri gör.
            </p>
            <div className="flex items-center gap-2">
              <a 
                href="https://apps.apple.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-stone-200/30 text-stone-400 px-3 py-1.5 rounded-xl transition-all active:scale-95"
              >
                <svg viewBox="0 0 384 512" className="w-3 h-3">
                  <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </svg>
                <span className="text-[8px] font-black uppercase tracking-tighter">App Store</span>
              </a>
              <a 
                href="https://play.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-stone-200/30 text-stone-400 px-3 py-1.5 rounded-xl transition-all active:scale-95"
              >
                <svg viewBox="0 0 512 512" className="w-3 h-3">
                  <path fill="currentColor" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l220.7-221.3 60.1 60.1L104.6 499z" />
                </svg>
                <span className="text-[8px] font-black uppercase tracking-tighter">Google Play</span>
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-40 mb-4">
            <span className="text-[10px] font-black tracking-tight uppercase text-stone-900">EVERYTHING</span>
          </div>
        </div>
      </div>
    </div>
  );
}
