"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Clock,
  CaretLeft,
  PaperPlaneTilt,
  Users,
  SealCheck,
  ShareNetwork
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
  { name: "PaperPlaneTilt", icon: PaperPlaneTilt },
  { name: "Users", icon: Users },
];

const QUICK_ADD_APPS = [
  { id: "digital-menu", icon: ChefHat, iconName: "ChefHat", color: "text-red-500", bgColor: "bg-red-50", description: "Menümüzü İnceleyin" },
  { id: "stamp-card", icon: Cards, iconName: "Cards", color: "text-amber-500", bgColor: "bg-amber-50", description: "Müdavimimiz Olun, İkram Kazanın" },
  { id: "campus-events", icon: Megaphone, iconName: "Megaphone", color: "text-sky-500", bgColor: "bg-sky-50", description: "Etkinliklerimize Göz Atın" },
  { id: "workplaces", icon: Coffee, iconName: "Coffee", color: "text-[#6F4E37]", bgColor: "bg-[#6F4E37]/10", description: "Çalışma Alanlarımızı Görün" },
  { id: "board-game-clubs", icon: GameController, iconName: "GameController", color: "text-[#D4A830]", bgColor: "bg-[#D4A830]/10", description: "Kutu Oyunlarımızı Keşfedin" },
  { id: "feedback-board", icon: ChatTeardropDots, iconName: "ChatTeardropDots", color: "text-violet-500", bgColor: "bg-violet-50", description: "Görüşlerinizi Bizimle Paylaşın" },
];

const PROMOTABLE_APPS = [
  { 
    id: "game-companion", 
    name: "Yazboz", 
    description: "Dijital Skor\nTablosu", 
    icon: GameController, 
    iconName: "GameController", 
    color: "#228BE6", 
    url: "https://yazboz.allminiapps.com" 
  },
  { 
    id: "iskambil", 
    name: "İskambil", 
    description: "Oyun Kuralları\nRehberi", 
    icon: Cards, 
    iconName: "Cards", 
    color: "#e03131", 
    url: "https://cardgames.allminiapps.com" 
  },
  { 
    id: "suggest", 
    name: "Suggest", 
    description: "Arkadaşlarına\nÖner", 
    icon: PaperPlaneTilt, 
    iconName: "PaperPlaneTilt", 
    color: "#6366f1", 
    url: "https://suggest.allminiapps.com" 
  },
  { 
    id: "kim-gelir", 
    name: "Ne Yapsak?", 
    description: "Etkinlik\nPlanla", 
    icon: Users, 
    iconName: "Users", 
    color: "#FF5252", 
    url: "https://kimgelir.allminiapps.com" 
  },
  { 
    id: "workplaces", 
    name: "Workplaces", 
    description: "Çalışma Alanı\nKeşfet", 
    icon: Coffee, 
    iconName: "Coffee", 
    color: "#6F4E37", 
    url: "https://workplaces.allminiapps.com" 
  },
];

const SOCIAL_CONFIG = [
  { key: "instagram", label: "Instagram", icon: InstagramLogo, iconName: "Instagram", prefix: "https://instagram.com/", placeholder: "kullaniciadi" },
  { key: "twitter", label: "Twitter / X", icon: TwitterLogo, iconName: "Twitter", prefix: "https://twitter.com/", placeholder: "kullaniciadi" },
  { key: "facebook", label: "Facebook", icon: FacebookLogo, iconName: "Facebook", prefix: "https://facebook.com/", placeholder: "sayfaadi" },
  { key: "whatsapp", label: "WhatsApp", icon: WhatsappLogo, iconName: "Whatsapp", prefix: "https://wa.me/", placeholder: "905XXXXXXXXX" },
  { key: "website", label: "Web Sitesi", icon: Globe, iconName: "Globe", prefix: "", placeholder: "https://siteniz.com" },
  { key: "phone", label: "Telefon", icon: Phone, iconName: "Phone", prefix: "tel:", placeholder: "05XXXXXXXXX" },
  { key: "address", label: "Google Maps", icon: MapPin, iconName: "MapPin", prefix: "", placeholder: "Google Maps Linki" },
];

export default function BusinessPageDashboard() {
  const { id, loading, business, links, refreshData } = useBusinessPage();
  const router = useRouter();
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<business_page.Link | null>(null);
  
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [url, setUrl] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Link");
  const [isSaving, setIsSaving] = useState(false);

  const [isSocialEditOpen, setIsSocialEditOpen] = useState(false);
  const [editingSocialKey, setEditingSocialKey] = useState<string | null>(null);
  const [socialValue, setSocialValue] = useState("");

  const handleSocialEdit = (key: string, currentValue: string) => {
    setEditingSocialKey(key);
    setSocialValue(currentValue || "");
    setIsSocialEditOpen(true);
  };

  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSocialKey) return;

    const config = SOCIAL_CONFIG.find(s => s.key === editingSocialKey);
    if (!config) return;

    const fullUrl = config.prefix ? `${config.prefix}${socialValue.replace(/^@/, '')}` : socialValue;

    try {
      setIsSaving(true);
      
      // We now save this as a regular Link in the business_page.links table
      // instead of updating the business entity
      const existingLink = links.find(l => l.title === config.label);
      
      if (!socialValue) {
        // If value is empty, delete the link
        if (existingLink) {
          await client.business_page.deleteLink({ id: existingLink.id });
          toast.success(`${config.label} bağlantısı kaldırıldı!`);
        }
      } else {
        await client.business_page.upsertLink({
          id: existingLink?.id,
          businessId: id,
          title: config.label,
          url: fullUrl,
          icon: config.iconName,
          sortOrder: existingLink?.sort_order || links.length
        });
        toast.success(`${config.label} bağlantısı güncellendi!`);
      }
      
      setIsSocialEditOpen(false);
      await refreshData();
    } catch (err) {
      console.error(err);
      toast.error("Güncelleme sırasında bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

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
    console.log("[BusinessPage] Toggling link:", linkId);
    // Check if it's a virtual link
    if (linkId.startsWith("virtual-")) {
      const parts = linkId.split("-");
      const type = parts[1]; // app or social
      const key = parts.slice(2).join("-"); // handle cases like board-game-clubs

      console.log("[BusinessPage] Virtual link detected:", { type, key });

      if (type === "app") {
        await handleQuickAdd(key);
      } else if (type === "promo") {
        const promoApp = PROMOTABLE_APPS.find(a => a.id === key);
        if (promoApp) {
          try {
            setIsSaving(true);
            await client.business_page.upsertLink({
              businessId: id,
              title: promoApp.description,
              subtitle: promoApp.name,
              url: promoApp.url,
              icon: promoApp.iconName,
              sortOrder: links.length
            });
            toast.success(`${promoApp.name} eklendi!`);
            await refreshData();
          } catch (err) {
            console.error(err);
            toast.error("Hata oluştu.");
          } finally {
            setIsSaving(false);
          }
        }
      } else if (type === "social") {
        const social = SOCIAL_CONFIG.find(s => s.key === key);
        const value = (business?.contact_info as any)?.[key];
        if (social && value) {
          try {
            setIsSaving(true);
            await client.business_page.upsertLink({
              businessId: id,
              title: social.label,
              url: social.prefix ? `${social.prefix}${value.replace(/^@/, '')}` : value,
              icon: social.iconName,
              sortOrder: links.length
            });
            toast.success(`${social.label} eklendi!`);
            await refreshData();
          } catch (err) {
            console.error(err);
            toast.error("Hata oluştu.");
          } finally {
            setIsSaving(false);
          }
        }
      }
      return;
    }

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
    console.log("[BusinessPage] handleQuickAdd:", appId);
    const app = BUSINESS_APPS.find(a => a.id === appId);
    const quickAddApp = QUICK_ADD_APPS.find(a => a.id === appId);
    if (!app || !business) {
      console.error("[BusinessPage] handleQuickAdd failed: app or business not found", { app, business });
      return;
    }

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";
    const appUrl = `https://${app.subdomain}.${rootDomain}/?biz=${business.id}`;
    
    try {
      setIsSaving(true);
      await client.business_page.upsertLink({
        businessId: id,
        title: quickAddApp?.description || app.name,
        subtitle: app.name,
        appId: appId,
        url: appUrl,
        icon: quickAddApp?.iconName || "Link",
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

  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/place?slug=${business?.slug || business?.id}`
    : "";

  const handleShare = async () => {
    if (!publicUrl) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: business?.name || "İşletme Sayfası",
          url: publicUrl
        });
      } else {
        await navigator.clipboard.writeText(publicUrl);
        toast.success("Link kopyalandı!");
      }
    } catch (err) {
      console.error("Paylaşım hatası:", err);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Left Column: Header + Links Management */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Panel (Only above the left area) */}
        <div className="bg-white border-b border-stone-200 px-8 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 text-stone-600 hover:bg-stone-50 rounded-xl transition-all active:scale-95"
            >
              <CaretLeft size={24} weight="bold" />
            </button>
            <h2 className="text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
              <QrCode size={20} className="text-emerald-500" />
              İşletme Sayfası
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="bg-stone-50 hover:bg-stone-100 text-stone-600 text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl border border-stone-200 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <ShareNetwork size={14} weight="bold" />
              PAYLAŞ
            </button>
            
            <button
              onClick={handleAddClick}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              YENİ LİNK EKLE
            </button>
          </div>
        </div>

        {/* Links Management Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto">
            {/* Social Media Selection Bar */}
            <div className="mb-8 bg-white border border-stone-200 rounded-[2rem] p-6">
              <div className="flex items-center gap-2 mb-4 px-1">
                <Globe size={16} weight="bold" className="text-stone-400" />
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Sosyal Medya Görünümü</h3>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {SOCIAL_CONFIG.map(social => {
                  const existingLink = links.find(l => l.title === social.label);
                  const isEnabled = existingLink?.is_enabled ?? false;
                  const hasValue = !!existingLink?.url;
                  const IconComp = social.icon;

                  return (
                    <div key={social.key} className="relative group">
                      <button
                        onClick={() => {
                          if (existingLink) {
                            handleToggleLink(existingLink.id);
                          } else {
                            handleSocialEdit(social.key, "");
                          }
                        }}
                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all relative cursor-pointer ${
                          isEnabled 
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105" 
                            : hasValue
                              ? "bg-stone-50 border-stone-200 text-stone-600 hover:border-emerald-300"
                              : "bg-stone-50 border-stone-100 text-stone-300 hover:border-stone-200"
                        }`}
                        title={!hasValue ? `${social.label} Ekle` : isEnabled ? "Gizle" : "Göster"}
                      >
                        <IconComp size={24} weight={isEnabled ? "fill" : "bold"} />
                        {isEnabled && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Check size={10} weight="bold" className="text-emerald-500" />
                          </div>
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          let val = existingLink?.url || "";
                          if (social.prefix && val.startsWith(social.prefix)) {
                            val = val.replace(social.prefix, "");
                          }
                          handleSocialEdit(social.key, val);
                        }}
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 hover:border-stone-300 shadow-sm transition-all z-10 cursor-pointer"
                        title={`${social.label} Düzenle`}
                      >
                        <Plus size={10} weight="bold" className={hasValue ? "rotate-45" : ""} />
                      </button>
                    </div>
                  );
                })}
              </div>
              {!Object.values(business?.contact_info || {}).some(v => !!v) && (
                <p className="text-[10px] font-medium text-stone-400 mt-4 px-1">
                  * Sosyal medya ikonlarını aktifleştirmek için önce işletme ayarlarından iletişim bilgilerini doldurmalısınız.
                </p>
              )}
            </div>

            <div className="space-y-3">
              {/* 1. System Apps - Only show apps enabled for this business */}
              {QUICK_ADD_APPS.filter(app => business?.enabled_apps?.includes(app.id)).map(app => {
                const existingLink = links.find(l => l.app_id === app.id);
                const isEnabled = existingLink?.is_enabled ?? false;
                const IconComp = app.icon;
                const appInfo = BUSINESS_APPS.find(a => a.id === app.id);

                return (
                  <div
                    key={app.id}
                    className={`bg-white border border-stone-200 rounded-[2rem] p-5 flex items-center gap-5 group transition-all hover:border-emerald-200 hover:shadow-md ${!isEnabled ? "opacity-60 grayscale-[0.5]" : ""}`}
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm" style={{ backgroundColor: appInfo?.color || "#10B981" }}>
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                      <IconComp size={28} weight="fill" color="white" className="relative z-10" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-base font-black text-stone-900 truncate">{app.description}</h4>
                      </div>
                      <p className="text-xs text-stone-400 truncate font-medium">{appInfo?.name}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleLink(existingLink?.id || `virtual-app-${app.id}`)}
                        className={`p-3 rounded-2xl transition-all cursor-pointer ${isEnabled ? "text-emerald-500 bg-emerald-50 hover:bg-emerald-100" : "text-stone-300 bg-stone-50 hover:bg-stone-100"}`}
                        title={isEnabled ? "Gizle" : "Göster"}
                      >
                        {isEnabled ? <Eye size={22} weight="bold" /> : <EyeSlash size={22} weight="bold" />}
                      </button>
                      {existingLink && (
                        <button
                          onClick={() => handleDeleteLink(existingLink.id)}
                          className="p-3 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all cursor-pointer"
                          title="Sil"
                        >
                          <Trash size={22} weight="bold" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 2. Social Media - Removed and replaced by selection bar at top */}

            {/* Custom Links Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 px-1">
                <LinkIcon size={16} weight="bold" className="text-stone-400" />
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Özel Bağlantılar</h3>
              </div>
              
              {links.filter(l => !l.app_id && !SOCIAL_CONFIG.some(s => l.title === s.label) && !PROMOTABLE_APPS.some(p => l.url === p.url)).length === 0 ? (
                <div className="bg-white border-2 border-dashed border-stone-200 rounded-[2.5rem] p-12 text-center">
                  <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <LinkIcon size={32} className="text-stone-300" />
                  </div>
                  <h3 className="text-stone-900 font-black text-sm uppercase tracking-wider">Henüz Özel Link Yok</h3>
                  <p className="text-stone-400 text-[11px] font-medium mt-2 max-w-xs mx-auto leading-relaxed">
                    İşletme sayfanızda görünecek diğer önemli linkleri ekleyin.
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
                  {links.filter(l => !l.app_id && !SOCIAL_CONFIG.some(s => l.title === s.label) && !PROMOTABLE_APPS.some(p => l.url === p.url)).map((link) => {
                    const IconComp = PRESET_ICONS.find(i => i.name === link.icon)?.icon || LinkIcon;
                    return (
                      <div
                        key={link.id}
                        className={`bg-white border border-stone-200 rounded-[2rem] p-5 flex items-center gap-5 group transition-all hover:border-emerald-200 hover:shadow-md ${!link.is_enabled ? "opacity-60" : ""}`}
                      >
                        <div className="cursor-grab text-stone-300 hover:text-stone-400 transition-colors">
                          <DotsSixVertical size={24} weight="bold" />
                        </div>
                        
                        <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                          <IconComp size={28} weight="fill" className="text-stone-400 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-black text-stone-900 truncate">{link.title}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-stone-400 truncate font-medium">{link.url}</p>
                          {link.subtitle && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-stone-200" />
                              <p className="text-xs text-emerald-600 font-bold truncate">{link.subtitle}</p>
                            </>
                          )}
                        </div>
                      </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleLink(link.id)}
                            className={`p-3 rounded-2xl transition-all cursor-pointer ${link.is_enabled ? "text-emerald-500 bg-emerald-50 hover:bg-emerald-100" : "text-stone-300 bg-stone-50 hover:bg-stone-100"}`}
                            title={link.is_enabled ? "Gizle" : "Göster"}
                          >
                            {link.is_enabled ? <Eye size={22} weight="bold" /> : <EyeSlash size={22} weight="bold" />}
                          </button>
                          <button
                            onClick={() => handleEditClick(link)}
                            className="p-3 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-2xl transition-all cursor-pointer"
                            title="Düzenle"
                          >
                            <DotsSixVertical size={22} weight="bold" className="rotate-90" />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="p-3 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all cursor-pointer"
                            title="Sil"
                          >
                            <Trash size={22} weight="bold" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Promotable Apps Section */}
            <div className="space-y-6 mt-12">
              <div className="flex items-center gap-2 px-1">
                <Sparkle size={16} weight="fill" className="text-amber-500" />
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Bunlar da ilginizi çekebilir</h3>
              </div>
              <div className="space-y-3">
                {PROMOTABLE_APPS.filter(app => !business?.enabled_apps?.includes(app.id)).map(app => {
                  const existingLink = links.find(l => l.url === app.url);
                  const isEnabled = existingLink?.is_enabled ?? false;
                  const IconComp = app.icon;

                  return (
                    <div
                      key={app.id}
                      className={`bg-white border border-stone-200 rounded-[2rem] p-5 flex items-center gap-5 group transition-all hover:border-emerald-200 hover:shadow-md ${!isEnabled ? "opacity-60 grayscale-[0.5]" : ""}`}
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm" style={{ backgroundColor: app.color }}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                        <IconComp size={28} weight="fill" color="white" className="relative z-10" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-base font-black text-stone-900 truncate">{app.description}</h4>
                        </div>
                        <p className="text-xs text-stone-400 truncate font-medium">{app.name}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleLink(existingLink?.id || `virtual-promo-${app.id}`)}
                          className={`p-3 rounded-2xl transition-all cursor-pointer ${isEnabled ? "text-emerald-500 bg-emerald-50 hover:bg-emerald-100" : "text-stone-300 bg-stone-50 hover:bg-stone-100"}`}
                          title={isEnabled ? "Gizle" : "Göster"}
                        >
                          {isEnabled ? <Eye size={22} weight="bold" /> : <EyeSlash size={22} weight="bold" />}
                        </button>
                        {existingLink && (
                          <button
                            onClick={() => handleDeleteLink(existingLink.id)}
                            className="p-3 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all cursor-pointer"
                            title="Sil"
                          >
                            <Trash size={22} weight="bold" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleAddClick}
              className="w-full py-6 border-2 border-dashed border-stone-100 rounded-[2rem] text-stone-400 hover:text-emerald-500 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center gap-2 group mt-8"
            >
              <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <Plus size={28} weight="bold" className="group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Yeni Özel Bağlantı Ekle</span>
            </button>
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
             
             <iframe 
               src={`/place?slug=${business?.slug || id}&biz=${id}&preview=true`}
               className="w-full h-full border-none"
               title="Live Preview"
             />
           </div>
      </div>
    </div>

      {/* Social Media Edit Drawer */}
      <Drawer.Root open={isSocialEditOpen} onOpenChange={setIsSocialEditOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[3rem] fixed bottom-0 left-0 right-0 max-h-[92vh] outline-none z-[70] max-w-md mx-auto border-t border-stone-200 shadow-2xl">
            <div className="p-8 overflow-y-auto">
              <div className="mx-auto w-12 h-1.5 bg-stone-100 rounded-full mb-8" />
              <Drawer.Title className="text-2xl font-black text-stone-900 tracking-tight mb-1 uppercase">
                {SOCIAL_CONFIG.find(s => s.key === editingSocialKey)?.label} BİLGİSİ
              </Drawer.Title>
              <Drawer.Description className="text-stone-400 text-[10px] font-black uppercase tracking-wider mb-8">
                Sayfanızda görünecek iletişim bilgisini güncelleyin
              </Drawer.Description>

              <form onSubmit={handleSaveSocial} className="space-y-6 pb-12">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-stone-400 tracking-widest px-1">
                    {SOCIAL_CONFIG.find(s => s.key === editingSocialKey)?.label} {editingSocialKey === 'address' ? 'Linki' : 'Kullanıcı Adı / No'}
                  </label>
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden focus-within:border-emerald-500 focus-within:bg-white transition-all">
                    {SOCIAL_CONFIG.find(s => s.key === editingSocialKey)?.prefix && (
                      <div className="pl-4 py-4 text-stone-400 text-sm font-bold shrink-0 border-r border-stone-100 bg-stone-100/50 px-3">
                        {SOCIAL_CONFIG.find(s => s.key === editingSocialKey)?.prefix}
                      </div>
                    )}
                    <input
                      placeholder={SOCIAL_CONFIG.find(s => s.key === editingSocialKey)?.placeholder}
                      value={socialValue}
                      onChange={(e) => {
                        let val = e.target.value;
                        const config = SOCIAL_CONFIG.find(s => s.key === editingSocialKey);
                        if (config?.prefix && val.includes(config.prefix)) {
                          val = val.split(config.prefix).pop() || "";
                        }
                        // Also handle cases where user pastes full URL with www or different protocol
                        if (config?.key === 'instagram' && val.includes('instagram.com/')) {
                           val = val.split('instagram.com/').pop()?.split('/')[0] || "";
                        }
                        if (config?.key === 'twitter' && (val.includes('twitter.com/') || val.includes('x.com/'))) {
                           val = val.split('/').pop() || "";
                        }
                        if (config?.key === 'facebook' && val.includes('facebook.com/')) {
                           val = val.split('facebook.com/').pop()?.split('/')[0] || "";
                        }
                        setSocialValue(val);
                      }}
                      className="w-full p-4 text-sm font-bold text-stone-800 bg-transparent outline-none"
                    />
                  </div>
                  {editingSocialKey === 'address' && (
                    <p className="text-[9px] font-medium text-stone-400 px-1 mt-2 leading-relaxed">
                      * Google Maps üzerinden işletmenizi bulup "Paylaş" butonuna tıkladıktan sonra "Bağlantıyı kopyala" diyerek aldığınız linki buraya yapıştırın.
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  {socialValue && (
                    <button
                      type="button"
                      onClick={() => {
                        setSocialValue("");
                      }}
                      className="flex-1 bg-stone-100 text-stone-600 font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95"
                    >
                      KALDIR
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-[2] bg-stone-900 text-white font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-stone-900/10 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? "KAYDEDİLİYOR..." : "BİLGİYİ GÜNCELLE"}
                  </button>
                </div>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

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
