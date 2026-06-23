"use client";

import { useState } from "react";
import { 
  Plus, 
  DotsSixVertical, 
  Trash, 
  Link as LinkIcon, 
  Eye, 
  EyeSlash, 
  Check,
  Globe,
  InstagramLogo,
  TwitterLogo,
  FacebookLogo,
  WhatsappLogo,
  Phone,
  Envelope,
  MapPin,
  QrCode,
  ArrowSquareOut,
  ChefHat,
  Cards,
  Megaphone,
  Coffee,
  GameController,
  ChatTeardropDots,
  Sparkle,
  Clock
} from "@phosphor-icons/react";
import { Drawer } from "vaul";
import { toast } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { useBusinessPage } from "./context";
import { business_page } from "@/lib/client";
import { BUSINESS_APPS } from "@/lib/apps";

const client = createBrowserClient();

const PRESET_ICONS = [
  { name: "Globe", icon: Globe },
  { name: "Instagram", icon: InstagramLogo },
  { name: "Twitter", icon: TwitterLogo },
  { name: "Facebook", icon: FacebookLogo },
  { name: "Whatsapp", icon: WhatsappLogo },
  { name: "Phone", icon: Phone },
  { name: "Envelope", icon: Envelope },
  { name: "MapPin", icon: MapPin },
  { name: "Link", icon: LinkIcon },
  { name: "ChefHat", icon: ChefHat },
  { name: "Cards", icon: Cards },
  { name: "Megaphone", icon: Megaphone },
  { name: "Coffee", icon: Coffee },
  { name: "GameController", icon: GameController },
  { name: "ChatTeardropDots", icon: ChatTeardropDots },
];

const PREVIEW_ICON_MAP: Record<string, any> = {
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

const QUICK_ADD_APPS = [
  { id: "digital-menu", icon: ChefHat, color: "text-red-500", bgColor: "bg-red-50", description: "Menümüzü İnceleyin" },
  { id: "stamp-card", icon: Cards, color: "text-amber-500", bgColor: "bg-amber-50", description: "Sadakat Kartınızı Oluşturun" },
  { id: "campus-events", icon: Megaphone, color: "text-sky-500", bgColor: "bg-sky-50", description: "Etkinliklerimize Göz Atın" },
  { id: "workplaces", icon: Coffee, color: "text-[#6F4E37]", bgColor: "bg-[#6F4E37]/10", description: "Çalışma Alanlarımızı Görün" },
  { id: "board-game-clubs", icon: GameController, color: "text-[#D4A830]", bgColor: "bg-[#D4A830]/10", description: "Kutu Oyunlarımızı Keşfedin" },
  { id: "feedback-board", icon: ChatTeardropDots, color: "text-violet-500", bgColor: "bg-violet-50", description: "Görüşlerinizi Bizimle Paylaşın" },
];

export default function BusinessPageDashboard() {
  const { id, loading, business, links, refreshData } = useBusinessPage();
  
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<business_page.Link | null>(null);
  
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [url, setUrl] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Link");
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = (link: business_page.Link) => {
    setEditingLink(link);
    setTitle(link.title);
    setSubtitle(link.subtitle || "");
    setUrl(link.url);
    setSelectedIcon(link.icon || "Link");
    setIsAddLinkOpen(true);
  };

  const handleAddClick = () => {
    setEditingLink(null);
    setTitle("");
    setSubtitle("");
    setUrl("");
    setSelectedIcon("Link");
    setIsAddLinkOpen(true);
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) {
      toast.error("Lütfen başlık ve URL girin.");
      return;
    }

    try {
      setIsSaving(true);
      await client.business_page.upsertLink({
        id: editingLink?.id,
        businessId: id,
        title,
        subtitle: subtitle || undefined,
        url,
        icon: selectedIcon,
        sortOrder: editingLink?.sort_order || links.length
      });
      
      toast.success(editingLink ? "Link güncellendi!" : "Link eklendi!");
      setIsAddLinkOpen(false);
      await refreshData();
    } catch (err) {
      console.error(err);
      toast.error("İşlem sırasında bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Bu linki silmek istediğinize emin misiniz?")) return;
    
    try {
      await client.business_page.deleteLink({ id: linkId });
      toast.success("Link silindi.");
      await refreshData();
    } catch (err) {
      console.error(err);
      toast.error("Silme işlemi başarısız oldu.");
    }
  };

  const handleToggleLink = async (linkId: string) => {
    try {
      const res = await client.business_page.toggleLink({ id: linkId });
      toast.success(res.isEnabled ? "Link aktif edildi." : "Link gizlendi.");
      await refreshData();
    } catch (err) {
      console.error(err);
      toast.error("İşlem başarısız oldu.");
    }
  };

  const handleQuickAdd = async (appId: string) => {
    const app = BUSINESS_APPS.find(a => a.id === appId);
    const quickAddApp = QUICK_ADD_APPS.find(a => a.id === appId);
    if (!app || !business) return;

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
    const appUrl = `https://${app.subdomain}.${rootDomain}/?biz=${business.id}`;
    
    try {
      setIsSaving(true);
      await client.business_page.upsertLink({
        businessId: id,
        title: app.name,
        subtitle: quickAddApp?.description,
        appId: appId,
        url: appUrl,
        icon: appId === "digital-menu" ? "ChefHat" : 
              appId === "stamp-card" ? "Cards" :
              appId === "campus-events" ? "Megaphone" :
              appId === "workplaces" ? "Coffee" :
              appId === "board-game-clubs" ? "GameController" :
              appId === "feedback-board" ? "ChatTeardropDots" : "Link",
        sortOrder: links.length
      });
      
      toast.success(`${app.name} başarıyla eklendi!`);
      await refreshData();
    } catch (err) {
      console.error(err);
      toast.error("Eklenirken bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const publicUrl = `https://${business?.id}.page.allminiapps.com`;

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Left Column: Header + Links Management */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Panel (Only above the left area) */}
        <div className="bg-white border-b border-stone-200 px-8 py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
              <QrCode size={20} className="text-emerald-500" />
              İşletme Sayfası
            </h2>
          </div>
          
          <button
            onClick={handleAddClick}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={14} weight="bold" />
            YENİ LİNK EKLE
          </button>
        </div>

        {/* Links Management Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto space-y-10">
            {/* Quick Add Section */}
            {business?.enabled_apps && business.enabled_apps.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Sparkle size={16} weight="fill" className="text-emerald-500" />
                  <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Hızlı Uygulama Ekle</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {QUICK_ADD_APPS.filter(q => business.enabled_apps?.includes(q.id)).map(q => {
                    const app = BUSINESS_APPS.find(a => a.id === q.id);
                    const isAlreadyAdded = links.some(l => l.title === app?.name);
                    const appColor = app?.color || "#10B981";
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => handleQuickAdd(q.id)}
                        disabled={isAlreadyAdded || isSaving}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                          isAlreadyAdded 
                            ? "bg-stone-50 border-stone-100 opacity-50 cursor-not-allowed" 
                            : "bg-white border-stone-200 hover:border-emerald-200 hover:shadow-sm active:scale-95 cursor-pointer"
                        }`}
                      >
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm"
                          style={{ backgroundColor: appColor }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent"></div>
                          <q.icon size={18} weight="fill" color="white" className="relative z-10" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-stone-900 truncate">{app?.name}</p>
                          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                            {isAlreadyAdded ? "EKLENDİ" : "EKLE"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center gap-2 px-1">
                <LinkIcon size={16} weight="bold" className="text-stone-400" />
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Bağlantılarınız</h3>
              </div>
              
              {links.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-stone-200 rounded-[2.5rem] p-12 text-center">
                  <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <LinkIcon size={32} className="text-stone-300" />
                  </div>
                  <h3 className="text-stone-900 font-black text-sm uppercase tracking-wider">Henüz Link Yok</h3>
                  <p className="text-stone-400 text-[11px] font-medium mt-2 max-w-xs mx-auto leading-relaxed">
                    İşletme sayfanızda görünecek sosyal medya hesaplarınızı, web sitenizi veya diğer önemli linkleri ekleyin.
                  </p>
                  <button
                    onClick={handleAddClick}
                    className="mt-6 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 px-6 py-3 rounded-xl transition-all"
                  >
                    İLK LİNKİNİZİ EKLEYİN
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {links.map((link) => {
                    const IconComp = PRESET_ICONS.find(i => i.name === link.icon)?.icon || LinkIcon;
                    return (
                      <div
                        key={link.id}
                        className={`bg-white border border-stone-200 rounded-3xl p-4 flex items-center gap-4 group transition-all hover:border-emerald-200 hover:shadow-sm ${!link.is_enabled ? "opacity-60" : ""}`}
                      >
                        <div className="cursor-grab text-stone-300 hover:text-stone-400 transition-colors">
                          <DotsSixVertical size={20} weight="bold" />
                        </div>
                        
                        <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                          <IconComp size={24} weight="fill" className="text-stone-400 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-stone-900 truncate">{link.title}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-stone-400 truncate font-medium">{link.url}</p>
                          {link.subtitle && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-stone-200" />
                              <p className="text-[11px] text-emerald-600 font-bold truncate">{link.subtitle}</p>
                            </>
                          )}
                        </div>
                      </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleLink(link.id)}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${link.is_enabled ? "text-emerald-500 hover:bg-emerald-50" : "text-stone-300 hover:bg-stone-50"}`}
                            title={link.is_enabled ? "Gizle" : "Göster"}
                          >
                            {link.is_enabled ? <Eye size={20} weight="bold" /> : <EyeSlash size={20} weight="bold" />}
                          </button>
                          <button
                            onClick={() => handleEditClick(link)}
                            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-xl transition-all cursor-pointer"
                            title="Düzenle"
                          >
                            <DotsSixVertical size={20} weight="bold" className="rotate-90" />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                            title="Sil"
                          >
                            <Trash size={20} weight="bold" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Preview Panel (Hidden on small screens) */}
      <div className="hidden lg:block w-[400px] shrink-0 border-l border-stone-200 bg-white p-8 overflow-y-auto">
        <div className="sticky top-0">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6 text-center">Canlı Önizleme</h3>
          
          <div className="w-full aspect-[9/19] bg-stone-900 rounded-[3rem] border-[8px] border-stone-800 shadow-2xl relative overflow-hidden flex flex-col">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-stone-800 rounded-b-2xl z-10" />
            
            <div className="flex-1 bg-white overflow-y-auto flex flex-col items-center">
              {/* Banner Preview */}
              <div className="w-full px-4 pt-6 shrink-0">
                <div className="w-full aspect-[2.5/1] relative overflow-hidden rounded-[2rem] border border-stone-100 shadow-sm bg-stone-50">
                  {business?.header_url || business?.logo_url ? (
                    <img src={(business.header_url || business.logo_url) as string} alt={business.name} className="w-full h-full object-cover" />
                  ) : (
                    <div 
                      className="w-full h-full flex flex-col items-center justify-center p-4 text-center relative"
                      style={{ backgroundColor: business?.theme_color || "#10B981" }}
                    >
                      <div className="absolute inset-0 bg-black/10" />
                      <h2 className="text-[10px] font-black text-white tracking-tight relative z-10 uppercase">{business?.name}</h2>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact & Social Section Preview */}
              {business?.contact_info && (Object.values(business.contact_info).some(v => !!v)) && (
                <div className="w-full px-4 mt-6">
                  <div className="w-full bg-white border border-stone-100 rounded-3xl p-5 space-y-4 shadow-sm">
                    <div className="space-y-3">
                      {business.contact_info.phone && (
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-stone-50 flex items-center justify-center text-stone-900">
                            <Phone size={14} weight="fill" />
                          </div>
                          <span className="text-[10px] font-bold text-stone-800">{business.contact_info.phone}</span>
                        </div>
                      )}
                      {business.contact_info.website && (
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-stone-50 flex items-center justify-center text-stone-900">
                            <Globe size={14} weight="fill" />
                          </div>
                          <span className="text-[10px] font-bold text-stone-800 truncate">{business.contact_info.website.replace(/^https?:\/\//, '')}</span>
                        </div>
                      )}
                      {business.contact_info.instagram && (
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-stone-50 flex items-center justify-center text-stone-900">
                            <InstagramLogo size={14} weight="fill" />
                          </div>
                          <span className="text-[10px] font-bold text-stone-800">@{business.contact_info.instagram.replace('@', '')}</span>
                        </div>
                      )}
                      {business.contact_info.address && (
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-stone-50 flex items-center justify-center text-stone-900 shrink-0">
                            <MapPin size={14} weight="fill" />
                          </div>
                          <span className="text-[10px] font-bold text-stone-800 leading-tight pt-1.5">{business.contact_info.address}</span>
                        </div>
                      )}
                      {business.contact_info.working_hours && (
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-stone-50 flex items-center justify-center text-stone-900">
                            <Clock size={14} weight="fill" />
                          </div>
                          <span className="text-[10px] font-bold text-stone-800">{business.contact_info.working_hours}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Links */}
              <div className="w-full px-4 space-y-3 mt-4">
                  {links.filter(l => l.is_enabled).map(link => {
                    const IconComp = PREVIEW_ICON_MAP[link.icon || "Link"] || LinkIcon;
                    const app = link.app_id ? BUSINESS_APPS.find(a => a.id === link.app_id) : null;
                    const isMiniApp = !!app;
                    const appColor = app?.color || "#10B981";
                    
                    return (
                      <div 
                        key={link.id}
                        className={`w-full py-2.5 px-4 bg-stone-50 border border-stone-100 rounded-2xl flex items-center relative group ${isMiniApp ? "bg-white shadow-sm border-stone-200" : ""}`}
                      >
                        <div 
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden ${!isMiniApp ? "bg-stone-100 text-stone-400" : ""}`}
                          style={isMiniApp ? { backgroundColor: appColor } : {}}
                        >
                          {isMiniApp && <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />}
                          <IconComp size={14} weight="fill" color={isMiniApp ? "white" : undefined} className="relative z-10" />
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-[11px] font-black text-stone-800 truncate leading-tight">{link.title}</p>
                          {link.subtitle && (
                            <p className="text-[9px] font-bold text-stone-400 truncate leading-tight mt-0.5">{link.subtitle}</p>
                          )}
                        </div>
                        {!isMiniApp && <ArrowSquareOut size={12} weight="bold" className="text-stone-300 ml-2" />}
                      </div>
                    );
                  })}
                </div>

              {/* Footer */}
              <div className="mt-auto pt-8 pb-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-1 opacity-20">
                  <div className="w-4 h-4 rounded bg-stone-900 flex items-center justify-center">
                    <span className="text-[8px] text-white font-black">E</span>
                  </div>
                  <span className="text-[8px] font-black tracking-tighter uppercase">EVERYTHING</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Link Drawer */}
      <Drawer.Root open={isAddLinkOpen} onOpenChange={setIsAddLinkOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[92vh] outline-none z-[70] max-w-md mx-auto border-t border-stone-200 shadow-2xl">
            <div className="p-8 overflow-y-auto">
              <div className="mx-auto w-12 h-1.5 bg-stone-100 rounded-full mb-8" />
              <Drawer.Title className="text-2xl font-black text-stone-900 tracking-tight mb-1">
                {editingLink ? "LİNKİ GÜNCELLE" : "YENİ LİNK EKLE"}
              </Drawer.Title>
              <Drawer.Description className="text-stone-400 text-[10px] font-black uppercase tracking-wider mb-8">
                Sayfanızda görünecek yeni bir bağlantı oluşturun
              </Drawer.Description>

              <form onSubmit={handleSaveLink} className="space-y-6 pb-12">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-stone-400 tracking-widest px-1">Bağlantı Başlığı</label>
                  <input
                    required
                    placeholder="Instagram Hesabımız"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-800 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-stone-400 tracking-widest px-1">Alt Başlık (Opsiyonel)</label>
                  <input
                    placeholder="Bizi takip edin!"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-800 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-stone-400 tracking-widest px-1">URL / Link</label>
                  <input
                    required
                    type="url"
                    placeholder="https://instagram.com/isletmeniz"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-800 focus:border-emerald-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-stone-400 tracking-widest px-1">İkon Seçimi</label>
                  <div className="grid grid-cols-5 gap-3">
                    {PRESET_ICONS.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelectedIcon(item.name)}
                        className={`aspect-square rounded-2xl border flex items-center justify-center transition-all ${
                          selectedIcon === item.name 
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105" 
                            : "bg-stone-50 border-stone-100 text-stone-400 hover:border-stone-200"
                        }`}
                      >
                        <item.icon size={24} weight={selectedIcon === item.name ? "fill" : "bold"} />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-stone-900 text-white font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-stone-900/10 transition-all active:scale-95 disabled:opacity-50 mt-4"
                >
                  {isSaving ? "KAYDEDİLİYOR..." : editingLink ? "DEĞİŞİKLİKLERİ KAYDET" : "BAĞLANTIYI EKLE"}
                </button>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
