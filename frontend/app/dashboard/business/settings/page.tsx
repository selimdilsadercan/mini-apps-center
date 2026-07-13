"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBusiness } from "../context";
import { toast } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { 
  User, 
  Storefront, 
  Check, 
  Circle,
  FloppyDisk,
  Plus,
  MagnifyingGlass,
  Trash,
  UserPlus,
  Warning,
  UploadSimple,
  Palette,
  Image as ImageIcon,
  ShareNetwork,
  InstagramLogo,
  FacebookLogo,
  TwitterLogo,
  Globe,
  Phone,
  MapPin,
  Clock,
  X
} from "@phosphor-icons/react";
import { Drawer } from "vaul";
import { business as bizTypes } from "@/lib/client";
import { uploadImage, uploadBlob } from "@/lib/image";
import { BannerEditor } from "@/components/BannerEditor";
import { useRef } from "react";

const client = createBrowserClient();

export default function BusinessSettingsPage() {
  const { id, business, loading, refreshBusiness } = useBusiness();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "users" | "contact">("details");

  // Edit States
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [logo, setLogo] = useState("");
  const [header, setHeader] = useState("");
  const [color, setColor] = useState("#EF4444");
  const [contactInfo, setContactInfo] = useState<any>({
    phone: "",
    website: "",
    instagram: "",
    facebook: "",
    twitter: "",
    address: "",
    working_hours: ""
  });
  const [updating, setUpdating] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [isBannerEditorOpen, setIsBannerEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  // Users States
  const [users, setUsers] = useState<bizTypes.BusinessUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (business) {
      console.log("[Settings] Business data loaded:", business);
      setName(business.name || "");
      setDesc(business.description || "");
      setLogo(business.logo_url || "");
      setHeader(business.header_url || "");
      setColor(business.theme_color || "#EF4444");
      if (business.contact_info) {
        setContactInfo({
          phone: business.contact_info.phone || "",
          website: business.contact_info.website || "",
          instagram: business.contact_info.instagram || "",
          facebook: business.contact_info.facebook || "",
          twitter: business.contact_info.twitter || "",
          address: business.contact_info.address || "",
          working_hours: business.contact_info.working_hours || ""
        });
      }
    }
  }, [business]);

  useEffect(() => {
    if (activeTab === "users" && id) {
      loadUsers();
    }
  }, [activeTab, id]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await client.business.getBusinessUsers(id);
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
      toast.error("Kullanıcılar yüklenemedi.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSearch = async () => {
    if (!searchUsername.trim()) return;
    try {
      setSearching(true);
      setFoundUser(null);
      const res = await client.users.getUserByUsername(searchUsername);
      if (res.user) {
        setFoundUser(res.user);
      } else {
        toast.error("Kullanıcı bulunamadı.");
      }
    } catch (err) {
      toast.error("Arama sırasında hata oluştu.");
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async () => {
    if (!foundUser || !id) return;
    try {
      setInviting(true);
      await client.business.addBusinessUser({
        businessId: id,
        clerkId: foundUser.clerk_id,
        role: "member"
      });
      toast.success(`${foundUser.username} başarıyla eklendi!`);
      setIsInviteOpen(false);
      setSearchUsername("");
      setFoundUser(null);
      loadUsers();
    } catch (err) {
      toast.error("Kullanıcı eklenemedi.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveUser = async (clerkId: string) => {
    if (!confirm("Bu kullanıcıyı işletmeden çıkarmak istediğinize emin misiniz?")) return;
    try {
      await client.business.removeBusinessUser({
        businessId: id,
        clerkId
      });
      toast.success("Kullanıcı çıkarıldı.");
      loadUsers();
    } catch (err) {
      toast.error("Kullanıcı çıkarılamadı.");
    }
  };

  const handleDeleteBusiness = async () => {
    const confirmName = prompt(`İşletmeyi silmek için lütfen işletme adını ("${business?.name}") aynen yazın:`);
    if (confirmName !== business?.name) {
      if (confirmName !== null) toast.error("İşletme adı eşleşmedi.");
      return;
    }

    try {
      setUpdating(true);
      const res = await client.business.deleteBusiness({ businessId: id });
      if (res.success) {
        toast.success("İşletme başarıyla silindi.");
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error("İşletme silinirken bir hata oluştu.");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const publicUrl = await uploadImage(file, {
        folder: "logos",
        client
      });
      setLogo(publicUrl);
      
      // Save immediately
      await client.business.updateBusiness({
        businessId: id,
        name,
        description: desc,
        logoUrl: publicUrl,
        headerUrl: header,
        themeColor: color,
        fontFamily: business?.font_family || "sans",
        contactInfo
      });
      
      toast.success("Logo başarıyla yüklendi ve kaydedildi!");
      await refreshBusiness();
    } catch (err) {
      console.error(err);
      toast.error("Logo yüklenirken bir hata oluştu.");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingHeader(true);
      const publicUrl = await uploadImage(file, {
        folder: "headers",
        client
      });
      setHeader(publicUrl);

      // Save immediately
      await client.business.updateBusiness({
        businessId: id,
        name,
        description: desc,
        logoUrl: logo,
        headerUrl: publicUrl,
        themeColor: color,
        fontFamily: business?.font_family || "sans",
        contactInfo
      });

      toast.success("Header görseli başarıyla yüklendi ve kaydedildi!");
      await refreshBusiness();
    } catch (err) {
      console.error(err);
      toast.error("Header yüklenirken bir hata oluştu.");
    } finally {
      setUploadingHeader(false);
      if (headerInputRef.current) headerInputRef.current.value = "";
    }
  };

  const handleSaveBanner = async (blob: Blob) => {
    try {
      setUploadingHeader(true);
      const publicUrl = await uploadBlob(blob, `banner-${Date.now()}.webp`, {
        folder: "headers",
        client
      });
      setHeader(publicUrl);

      // Save immediately
      await client.business.updateBusiness({
        businessId: id,
        name,
        description: desc,
        logoUrl: logo,
        headerUrl: publicUrl,
        themeColor: color,
        fontFamily: business?.font_family || "sans",
        contactInfo
      });

      setIsBannerEditorOpen(false);
      toast.success("Banner tasarımı başarıyla kaydedildi!");
      await refreshBusiness();
    } catch (err) {
      console.error(err);
      toast.error("Banner kaydedilirken bir hata oluştu.");
    } finally {
      setUploadingHeader(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const res =       await client.business.updateBusiness({
        businessId: id,
        name,
        description: desc,
        logoUrl: logo,
        headerUrl: header,
        themeColor: color,
        fontFamily: business?.font_family || "sans",
        contactInfo
      });
      if (res.business) {
        toast.success("İşletme bilgileri güncellendi!");
        await refreshBusiness();
      }
    } catch (err) {
      toast.error("Güncelleme sırasında hata oluştu.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !business) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Tabs Header */}
        <div className="flex gap-1 bg-stone-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "details"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <Storefront size={16} weight={activeTab === "details" ? "fill" : "bold"} />
            İşletme Detayları
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "users"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <User size={16} weight={activeTab === "users" ? "fill" : "bold"} />
            Kullanıcılar
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === "contact"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <ShareNetwork size={16} weight={activeTab === "contact" ? "fill" : "bold"} />
            İletişim & Sosyal
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden">
          {activeTab === "details" ? (
            <div className="p-8 md:p-10">
              <div className="mb-8">
                <h2 className="text-xl font-black text-stone-900 tracking-tight">İşletme Bilgileri</h2>
                <p className="text-stone-400 text-xs font-medium mt-1">Profilinizi ve marka kimliğinizi buradan yönetin.</p>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider ml-1">İşletme Adı</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-850 focus:border-red-500 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider ml-1">İşletme Logosu</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0 relative group">
                        {logo ? (
                          <>
                            <img src={logo} alt="Logo Preview" className="w-full h-full object-cover" />
                            <div 
                              onClick={() => setLogo("")}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Trash size={20} weight="bold" className="text-white" />
                            </div>
                          </>
                        ) : (
                          <ImageIcon size={24} weight="bold" className="text-stone-300" />
                        )}
                        {uploadingLogo && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleLogoUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <UploadSimple size={16} weight="bold" />
                          {logo ? "Logoyu Değiştir" : "Logo Yükle"}
                        </button>
                        <p className="text-[9px] text-stone-400 font-bold mt-1.5 ml-1 uppercase tracking-tighter">
                          WebP, PNG veya JPG. Max 2MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider ml-1">Geniş Logo / Banner (Dikdörtgen)</label>
                    <div className="flex flex-col gap-4">
                      <div className="w-full h-40 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center overflow-hidden relative group">
                        {header ? (
                          <>
                            <img src={header} alt="Header Preview" className="w-full h-full object-cover" />
                            <div 
                              onClick={() => setHeader("")}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Trash size={24} weight="bold" className="text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <ImageIcon size={32} weight="bold" className="text-stone-300" />
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Görsel Yok</span>
                          </div>
                        )}
                        {uploadingHeader && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          ref={headerInputRef}
                          onChange={handleHeaderUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => headerInputRef.current?.click()}
                          disabled={uploadingHeader}
                          className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                        >
                          <UploadSimple size={18} weight="bold" />
                          {header ? "Görseli Değiştir" : "Geniş Logo Yükle"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsBannerEditorOpen(true)}
                          disabled={uploadingHeader}
                          className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                        >
                          <Palette size={18} weight="bold" />
                          Tasarla
                        </button>
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-tighter">
                          Tavsiye edilen: 1200x400px. WebP, PNG veya JPG.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider ml-1">Açıklama / Slogan</label>
                  <input
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-850 focus:border-red-500 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider ml-1 block">Tema Rengi</label>
                  <div className="flex flex-wrap gap-3">
                    {["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#845EF7", "#EC4899", "#000000"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-10 h-10 rounded-full border-2 transition-all relative flex items-center justify-center ${
                          color === c ? "border-stone-900 scale-110 shadow-md" : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {color === c && <Check size={16} weight="bold" className={c === "#000000" ? "text-white" : "text-white"} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={updating}
                    className="bg-stone-900 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-stone-900/10 hover:bg-stone-800 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                  >
                    <FloppyDisk size={18} weight="bold" />
                    {updating ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
                  </button>
                </div>
              </form>

              {/* Danger Zone */}
              <div className="mt-12 pt-12 border-t border-red-100">
                <div className="flex items-center gap-2 text-red-600 mb-4">
                  <Warning size={20} weight="fill" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Tehlikeli Alan</h3>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h4 className="text-stone-900 font-black text-sm">İşletmeyi Kalıcı Olarak Sil</h4>
                    <p className="text-stone-500 text-xs mt-1 max-w-md">
                      Bu işlem geri alınamaz. İşletmeye ait tüm veriler, menüler ve kullanıcı erişimleri kalıcı olarak silinecektir.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteBusiness}
                    disabled={updating}
                    className="bg-white border border-red-200 text-red-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    İşletmeyi Sil
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 md:p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black text-stone-900 tracking-tight">Kullanıcı Yönetimi</h2>
                  <p className="text-stone-400 text-xs font-medium mt-1">İşletmenize erişimi olan kişileri yönetin.</p>
                </div>
                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-stone-800 transition-all active:scale-95 shadow-lg shadow-stone-900/10"
                >
                  <UserPlus size={18} weight="bold" />
                  Kullanıcı Ekle
                </button>
              </div>

              <div className="space-y-4">
                {loadingUsers ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-8 h-8 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin" />
                  </div>
                ) : users.length > 0 ? (
                  users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 group hover:border-stone-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden border border-stone-100">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.username || ""} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold text-xs uppercase">
                              {u.username?.slice(0, 2) || "??"}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-stone-900 flex items-center gap-2">
                            {u.full_name || u.username}
                            {u.user_id === business?.owner_user_id && (
                              <span className="px-2 py-0.5 bg-stone-900 text-white text-[8px] font-black uppercase tracking-widest rounded-md">Sahip</span>
                            )}
                          </p>
                          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                            {u.role === "admin" ? "Yönetici" : "Ekip Arkadaşı"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-green-100 text-green-600 text-[9px] font-black uppercase tracking-widest rounded-full">Aktif</span>
                        {u.user_id !== business?.owner_user_id && (
                          <button
                            onClick={() => handleRemoveUser(u.clerk_id)}
                            className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash size={18} weight="bold" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center border border-dashed border-stone-200 rounded-[2rem] bg-stone-50/30">
                    <User size={32} className="text-stone-300 mx-auto mb-3" />
                    <p className="text-stone-850 text-xs font-black uppercase">Ekip Arkadaşı Yok</p>
                    <p className="text-stone-400 text-[10px] max-w-[200px] mx-auto mt-1 leading-normal">
                      Henüz başka bir kullanıcı eklenmemiş. "Kullanıcı Ekle" butonu ile ekip arkadaşlarınızı davet edebilirsiniz.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="max-w-2xl mx-auto space-y-10">
                <div className="text-center">
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">İletişim & Sosyal Medya</h2>
                  <p className="text-stone-400 text-sm font-medium mt-1 leading-relaxed">
                    İşletmenizin iletişim bilgilerini ve sosyal medya hesaplarını ekleyin.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* İletişim Bilgileri */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] uppercase font-black text-stone-400 tracking-[0.2em] px-1">İletişim</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-stone-850 tracking-wider ml-1 flex items-center gap-2">
                          <Phone size={14} weight="bold" /> Telefon
                        </label>
                        <input
                          value={contactInfo.phone}
                          onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                          placeholder="+90 5XX XXX XX XX"
                          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-850 focus:border-stone-900 focus:bg-white outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-stone-850 tracking-wider ml-1 flex items-center gap-2">
                          <Globe size={14} weight="bold" /> Web Sitesi
                        </label>
                        <input
                          value={contactInfo.website}
                          onChange={(e) => setContactInfo({ ...contactInfo, website: e.target.value })}
                          placeholder="https://www.isletme.com"
                          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-850 focus:border-stone-900 focus:bg-white outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-stone-850 tracking-wider ml-1 flex items-center gap-2">
                          <MapPin size={14} weight="bold" /> Adres
                        </label>
                        <textarea
                          value={contactInfo.address}
                          onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                          placeholder="İşletme adresi..."
                          rows={3}
                          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-850 focus:border-stone-900 focus:bg-white outline-none transition-all resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-stone-850 tracking-wider ml-1 flex items-center gap-2">
                          <Clock size={14} weight="bold" /> Çalışma Saatleri
                        </label>
                        <input
                          value={contactInfo.working_hours}
                          onChange={(e) => setContactInfo({ ...contactInfo, working_hours: e.target.value })}
                          placeholder="Örn: Pazartesi - Cuma: 09:00 - 18:00"
                          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-850 focus:border-stone-900 focus:bg-white outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sosyal Medya */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] uppercase font-black text-stone-400 tracking-[0.2em] px-1">Sosyal Medya</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-stone-850 tracking-wider ml-1 flex items-center gap-2">
                          <InstagramLogo size={14} weight="bold" /> Instagram
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">@</span>
                          <input
                            value={contactInfo.instagram}
                            onChange={(e) => setContactInfo({ ...contactInfo, instagram: e.target.value })}
                            placeholder="kullaniciadi"
                            className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 pl-8 text-sm font-bold text-stone-850 focus:border-stone-900 focus:bg-white outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-stone-850 tracking-wider ml-1 flex items-center gap-2">
                          <FacebookLogo size={14} weight="bold" /> Facebook
                        </label>
                        <input
                          value={contactInfo.facebook}
                          onChange={(e) => setContactInfo({ ...contactInfo, facebook: e.target.value })}
                          placeholder="facebook.com/isletme"
                          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-850 focus:border-stone-900 focus:bg-white outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-stone-850 tracking-wider ml-1 flex items-center gap-2">
                          <TwitterLogo size={14} weight="bold" /> Twitter / X
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-sm">@</span>
                          <input
                            value={contactInfo.twitter}
                            onChange={(e) => setContactInfo({ ...contactInfo, twitter: e.target.value })}
                            placeholder="kullaniciadi"
                            className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 pl-8 text-sm font-bold text-stone-850 focus:border-stone-900 focus:bg-white outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-stone-100">
                  <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="w-full py-5 bg-stone-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-stone-900/10 hover:bg-stone-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {updating ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FloppyDisk size={20} weight="fill" />
                    )}
                    {updating ? "Güncelleniyor..." : "Bilgileri Kaydet"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invite Drawer */}
        <Drawer.Root open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
            <Drawer.Content className="bg-white flex flex-col rounded-t-[2.5rem] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none border-t border-stone-100 shadow-2xl">
              <div className="p-6 bg-white rounded-t-[2.5rem] flex-1 overflow-y-auto">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-stone-200 mb-8" />
                
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-stone-200">
                      <UserPlus size={32} weight="fill" className="text-stone-900" />
                    </div>
                    <h2 className="text-2xl font-black text-stone-900 tracking-tight">Kullanıcı Ekle</h2>
                    <p className="text-stone-400 text-sm font-medium mt-1">Ekip arkadaşınızı kullanıcı adıyla arayıp ekleyin.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider ml-1">Kullanıcı Adı</label>
                      <div className="relative">
                        <input
                          autoFocus
                          value={searchUsername}
                          onChange={(e) => setSearchUsername(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          placeholder="Örn: umut"
                          className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 pl-12 text-sm font-bold text-stone-850 focus:border-stone-900 focus:bg-white outline-none transition-all"
                        />
                        <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" weight="bold" />
                        <button
                          onClick={handleSearch}
                          disabled={searching || !searchUsername.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-50"
                        >
                          {searching ? "Aranıyor..." : "Ara"}
                        </button>
                      </div>
                    </div>

                    {foundUser && (
                      <div className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-white overflow-hidden border border-stone-200 shadow-sm">
                            {foundUser.avatar_url ? (
                              <img src={foundUser.avatar_url} alt={foundUser.username} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300 font-bold text-xl uppercase">
                                {foundUser.username?.slice(0, 2)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-lg font-black text-stone-900">{foundUser.full_name || foundUser.username}</p>
                            <p className="text-xs text-stone-400 font-bold">@{foundUser.username}</p>
                          </div>
                        </div>

                        <button
                          onClick={handleInvite}
                          disabled={inviting}
                          className="w-full py-4 bg-stone-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-stone-900/10 hover:bg-stone-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Plus size={18} weight="bold" />
                          {inviting ? "Ekleniyor..." : "İşletmeye Ekle"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {/* Banner Editor Modal */}
        {isBannerEditorOpen && (
          <BannerEditor
            logoUrl={logo}
            initialHeaderUrl={header}
            onSave={handleSaveBanner}
            onClose={() => setIsBannerEditorOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
