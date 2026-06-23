"use client";

import { useState, useEffect } from "react";
import { 
  Globe, 
  InstagramLogo, 
  TwitterLogo, 
  FacebookLogo, 
  WhatsappLogo, 
  Phone, 
  Envelope, 
  MapPin, 
  Link as LinkIcon,
  ArrowSquareOut,
  CaretLeft,
  ChefHat,
  Cards,
  Megaphone,
  Coffee,
  GameController,
  ChatTeardropDots,
  Clock
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { business_page, business } from "@/lib/client";
import { getAppRootUrl, BUSINESS_APPS, MiniApp } from "@/lib/apps";

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
  Link: LinkIcon,
  ChefHat,
  Cards,
  Megaphone,
  Coffee,
  GameController,
  ChatTeardropDots,
};

export default function BusinessPublicPage() {
  const [loading, setLoading] = useState(true);
  const [bizData, setBizData] = useState<business.Business | null>(null);
  const [links, setLinks] = useState<business_page.Link[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const bizId = params.get("biz");
      if (bizId) {
        fetchData(bizId);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchData = async (bizId: string) => {
    try {
      setLoading(true);
      const bizRes = await client.business.getBusiness(bizId);
      if (bizRes.business) {
        setBizData(bizRes.business);
      }

      const linksRes = await client.business_page.getLinks(bizId);
      setLinks(linksRes.links?.filter(l => l.is_enabled) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!bizData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] p-6 text-center">
        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm border border-stone-200 flex items-center justify-center mb-6">
          <Globe size={32} className="text-stone-300" />
        </div>
        <h1 className="text-xl font-black text-stone-900 tracking-tight mb-2">Sayfa Bulunamadı</h1>
        <p className="text-sm text-stone-500 max-w-xs leading-relaxed mb-8">
          Ulaşmaya çalıştığınız işletme sayfası mevcut değil veya taşınmış olabilir.
        </p>
        <button 
          onClick={() => window.location.href = getAppRootUrl()}
          className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-stone-900/20 active:scale-95 transition-all"
        >
          <CaretLeft size={16} weight="bold" />
          ANA SAYFAYA DÖN
        </button>
      </div>
    );
  }

  const themeColor = bizData.theme_color || "#10B981";
  const contact = bizData.contact_info || {};

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] opacity-[0.07] rounded-full"
          style={{ backgroundColor: themeColor }}
        />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-stone-100 blur-[100px] opacity-50 rounded-full" />
      </div>

      <main className="w-full max-w-md flex flex-col items-center">
        {/* Business Banner Card */}
        <div className="w-full px-6 pt-8 mb-4">
          <div className="w-full aspect-[2.5/1] relative overflow-hidden rounded-[2.5rem] border border-stone-100 shadow-md bg-stone-50">
            {bizData.header_url || bizData.logo_url ? (
              <img src={(bizData.header_url || bizData.logo_url) as string} alt={bizData.name} className="w-full h-full object-cover" />
            ) : (
              <div 
                className="w-full h-full flex flex-col items-center justify-center p-8 text-center relative"
                style={{ backgroundColor: themeColor }}
              >
                <div className="absolute inset-0 bg-black/10" />
                <h1 className="text-xl font-black text-white tracking-tight relative z-10 drop-shadow-md uppercase">
                  {bizData.name}
                </h1>
              </div>
            )}
          </div>
        </div>

        {/* Contact & Social Section */}
        {(contact.phone || contact.website || contact.address || contact.working_hours || contact.instagram || contact.facebook || contact.twitter) && (
          <div className="w-full px-6 mb-8">
            <div className="w-full bg-white border border-stone-100 rounded-[2.5rem] shadow-sm p-8 space-y-6">
              <h2 className="text-[10px] uppercase font-black text-stone-400 tracking-[0.2em] text-center">İletişim & Sosyal Medya</h2>
              
              <div className="space-y-5">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-4 group">
                    <div className="w-11 h-11 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-900 group-hover:bg-stone-100 transition-colors">
                      <Phone size={20} weight="fill" />
                    </div>
                    <span className="text-sm font-bold text-stone-850 group-hover:text-stone-900 transition-colors">{contact.phone}</span>
                  </a>
                )}
                
                {contact.website && (
                  <a href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                    <div className="w-11 h-11 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-900 group-hover:bg-stone-100 transition-colors">
                      <Globe size={20} weight="fill" />
                    </div>
                    <span className="text-sm font-bold text-stone-850 group-hover:text-stone-900 transition-colors truncate">{contact.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}

                {contact.address && (
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-900 shrink-0">
                      <MapPin size={20} weight="fill" />
                    </div>
                    <span className="text-sm font-bold text-stone-850 leading-relaxed pt-2.5">{contact.address}</span>
                  </div>
                )}

                {contact.working_hours && (
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-900">
                      <Clock size={20} weight="fill" />
                    </div>
                    <span className="text-sm font-bold text-stone-850">{contact.working_hours}</span>
                  </div>
                )}

                {/* Social Media Row */}
                {(contact.instagram || contact.facebook || contact.twitter) && (
                  <div className="pt-4 flex items-center justify-center gap-4 border-t border-stone-50">
                    {contact.instagram && (
                      <a 
                        href={`https://instagram.com/${contact.instagram.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-900 hover:bg-stone-100 hover:scale-110 transition-all active:scale-95"
                      >
                        <InstagramLogo size={24} weight="fill" />
                      </a>
                    )}
                    {contact.facebook && (
                      <a 
                        href={contact.facebook.startsWith('http') ? contact.facebook : `https://facebook.com/${contact.facebook}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-900 hover:bg-stone-100 hover:scale-110 transition-all active:scale-95"
                      >
                        <FacebookLogo size={24} weight="fill" />
                      </a>
                    )}
                    {contact.twitter && (
                      <a 
                        href={`https://twitter.com/${contact.twitter.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-900 hover:bg-stone-100 hover:scale-110 transition-all active:scale-95"
                      >
                        <TwitterLogo size={24} weight="fill" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Links List */}
        <div className="w-full px-6 space-y-4">
          {links.map((link) => {
            const IconComp = ICON_MAP[link.icon || "Link"] || LinkIcon;
            const app = link.app_id ? BUSINESS_APPS.find((a: MiniApp) => a.id === link.app_id) : null;
            const isSpecial = !!app;
            const appColor = app?.color || themeColor;
            
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full group relative flex items-center p-4 bg-white border border-stone-200 rounded-[1.75rem] shadow-sm transition-all hover:shadow-md hover:border-stone-300 active:scale-[0.98] ${isSpecial ? "py-5" : ""}`}
              >
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shrink-0 shadow-sm relative overflow-hidden"
                  style={{ backgroundColor: isSpecial ? appColor : `${themeColor}10` }}
                >
                  {isSpecial && <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />}
                  <IconComp size={24} weight="fill" style={{ color: isSpecial ? "white" : themeColor }} className="relative z-10" />
                </div>
                
                <div className="ml-4 flex-1 min-w-0">
                  <h3 className="text-[15px] font-black text-stone-900 tracking-tight leading-tight">
                    {link.title}
                  </h3>
                  {link.subtitle && (
                    <p className="text-[11px] text-stone-400 font-bold uppercase tracking-wider mt-1 leading-tight">
                      {link.subtitle}
                    </p>
                  )}
                </div>
                
                {!isSpecial && (
                  <div className="ml-2 text-stone-300 group-hover:text-stone-400 transition-colors">
                    <ArrowSquareOut size={16} weight="bold" />
                  </div>
                )}
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-20 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-stone-50 rounded-full border border-stone-100 opacity-60">
            <div className="w-5 h-5 rounded bg-stone-900 flex items-center justify-center">
              <span className="text-[9px] text-white font-black">E</span>
            </div>
            <span className="text-[9px] font-black tracking-widest text-stone-900 uppercase">EVERYTHING</span>
          </div>
          
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
            Kendi sayfanı oluştur
          </p>
        </div>
      </main>
    </div>
  );
}
