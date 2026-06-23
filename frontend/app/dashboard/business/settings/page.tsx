"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBusiness } from "../layout";
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
  Warning
} from "@phosphor-icons/react";
import { Drawer } from "vaul";
import { business as bizTypes } from "@/lib/client";

const client = createBrowserClient();

export default function BusinessSettingsPage() {
  const { id, business, loading, refreshBusiness } = useBusiness();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "users">("details");

  // Edit States
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [logo, setLogo] = useState("");
  const [color, setColor] = useState("#EF4444");
  const [updating, setUpdating] = useState(false);

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
      setName(business.name || "");
      setDesc(business.description || "");
      setLogo(business.logo_url || "");
      setColor(business.theme_color || "#EF4444");
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const res = await client.business.updateBusiness({
        businessId: id,
        name,
        description: desc,
        logoUrl: logo,
        themeColor: color,
        fontFamily: business?.font_family || "sans"
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
                    <label className="text-[10px] uppercase font-black text-stone-400 tracking-wider ml-1">Logo URL</label>
                    <input
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-4 text-sm font-bold text-stone-850 focus:border-red-500 focus:bg-white outline-none transition-all"
                    />
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
      </div>
    </div>
  );
}
