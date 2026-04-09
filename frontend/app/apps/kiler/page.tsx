"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { 
  Basket, 
  Plus, 
  Trash, 
  ThermometerCold, 
  Snowflake, 
  Archive,
  Calendar,
  FramerLogo,
  Info,
  Warning,
  CheckCircle,
  CaretLeft,
  Lightbulb
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import Client, { kiler } from "@/lib/client";
import { useRouter } from "next/navigation";

// Local client instance
const client = new Client("http://localhost:4000");

export default function KilerPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [items, setItems] = useState<kiler.PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab ] = useState<kiler.StorageType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (isUserLoaded && user) {
      fetchItems();
    }
  }, [isUserLoaded, user]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      if (!user) return;
      const response = await client.kiler.getItems(user.id);
      setItems(response.items);
    } catch (error) {
      console.error("fetchItems error:", error);
      toast.error("Ürünler yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!user) return;
      await client.kiler.deleteItem(id, { userId: user.id });
      setItems(items.filter(i => i.id !== id));
      toast.success("Ürün silindi");
    } catch (error) {
      toast.error("Silme işlemi başarısız");
    }
  };

  const filteredItems = items.filter(item => {
    const matchesTab = activeTab === "all" ? true : item.storage_type === activeTab;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getDayDiff = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className={`flex min-h-screen flex-col transition-all duration-1000 relative overflow-hidden ${
      activeTab === 'fridge' ? 'bg-blue-50/30' : 
      activeTab === 'freezer' ? 'bg-cyan-50/30' : 
      activeTab === 'pantry' ? 'bg-amber-50/20' : 'bg-[#FAF9F7]'
    }`}>
      <Toaster position="top-center" />

      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-1/4 -left-1/4 w-[80%] h-[80%] rounded-full blur-[120px] opacity-20 transition-colors duration-1000 ${
            activeTab === 'all' ? 'bg-green-400' :
            activeTab === 'fridge' ? 'bg-blue-400' :
            activeTab === 'freezer' ? 'bg-cyan-400' : 'bg-amber-400'
          }`}
        />
        <motion.div 
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -45, 0],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] rounded-full blur-[100px] opacity-20 transition-colors duration-1000 ${
             activeTab === 'all' ? 'bg-indigo-300' :
             activeTab === 'fridge' ? 'bg-indigo-400' :
             activeTab === 'freezer' ? 'bg-white' : 'bg-orange-300'
          }`}
        />
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
      </div>

      <main className="flex-1 px-5 py-10 pb-40 max-w-lg mx-auto w-full relative z-10">
        {/* Breadcrumb / Status */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push("/home")}
            className="group flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-gray-900 transition-all bg-white/40 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white shadow-sm active:scale-95"
          >
            <CaretLeft size={14} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
             <span>Katalog</span>
          </button>
          
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white shadow-sm font-black text-[10px] text-gray-900 uppercase">
             <div className="relative w-2 h-2">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping"></div>
                <div className="relative bg-green-500 w-full h-full rounded-full"></div>
             </div>
             Kitchen Intelligence
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative mb-12 text-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="inline-block bg-white p-6 rounded-[2.8rem] shadow-[0_25px_50px_-12px_rgba(64,192,87,0.3)] mb-6 border border-green-50 relative group cursor-pointer"
            >
              <div className="absolute inset-0 bg-green-500 rounded-[2.8rem] blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
              <Basket size={54} weight="fill" className="text-[#40C057] relative z-10" />
            </motion.div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-2 leading-none">Mutfak <span className="text-[#40C057]">Dedektifi</span></h1>
            <div className="flex items-center justify-center gap-3">
               <div className="h-[1px] w-8 bg-gray-200"></div>
               <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.4em]">Inventory Core v1.0</p>
               <div className="h-[1px] w-8 bg-gray-200"></div>
            </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-5 mb-10">
          <motion.div whileHover={{ y: -5 }} className="bg-white/40 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white shadow-[0_20px_40px_rgba(0,0,0,0.04)] flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 border border-indigo-100/50"><Archive size={20} weight="bold" /></div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Mevcut Stok</div>
            <div className="text-4xl font-black text-gray-900 leading-none tracking-tighter">{items.length}</div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-white/40 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white shadow-[0_20px_40px_rgba(0,0,0,0.04)] flex flex-col items-center text-center relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-3 border border-red-100/50"><Warning size={20} weight="bold" /></div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Kritik Tarih</div>
            <div className="text-4xl font-black text-red-500 leading-none tracking-tighter">{items.filter(i => { const d = getDayDiff(i.expiry_date); return d !== null && d <= 3; }).length}</div>
          </motion.div>
        </div>

        {/* Search & Tabs */}
        <div className="space-y-6 mb-12">
           <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors"><Plus size={18} weight="bold" className="rotate-45" /></div>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="STOKLARDA ARA..." className="w-full bg-white/60 backdrop-blur-xl border border-white rounded-[1.8rem] py-5 pl-14 pr-6 text-[10px] font-black uppercase tracking-[0.2em] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/20 transition-all shadow-sm outline-none placeholder:text-gray-300" />
           </div>

           <div className="bg-gray-200/40 p-1.5 rounded-full flex gap-1 backdrop-blur-md border border-white/50">
             {["all", "fridge", "freezer", "pantry"].map((tab) => (
               <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 rounded-full text-[9px] font-black uppercase tracking-widest transition-all relative overflow-hidden ${activeTab === tab ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                 {activeTab === tab && <motion.div layoutId="activeTab" className="absolute inset-0 bg-white shadow-xl shadow-gray-200/50" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                 <span className="relative z-10">{tab === "all" ? "Hepsi" : tab === "fridge" ? "Buz" : tab === "freezer" ? "Şok" : "Raf"}</span>
               </button>
             ))}
           </div>
        </div>

        {/* Shelf Grid */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-20 mt-4 relative z-10">
          {loading ? (
             <div className="col-span-2 py-20 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Envanter Taranıyor...</div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-2 py-32 text-center bg-white/20 backdrop-blur-md rounded-[3.5rem] border-2 border-dashed border-white/50 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center text-gray-300 mb-6"><Basket size={32} /></div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Kiler Boş Görünüyor</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => {
                const dayDiff = getDayDiff(item.expiry_date);
                const isCritical = dayDiff !== null && dayDiff <= 3;
                const isExpired = dayDiff !== null && dayDiff < 0;
                
                return (
                  <motion.div layout initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} whileHover={{ perspective: 1000 }} key={item.id} className="relative flex flex-col group items-center">
                    <motion.div whileHover={{ rotateY: 15, rotateX: -10, y: -15, scale: 1.05 }} className={`relative w-full aspect-[4/5.5] max-w-[160px] rounded-2xl transition-all duration-500 z-10 overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-b-[10px] ${isExpired ? 'bg-gray-100 border-gray-300' : item.storage_type === 'freezer' ? 'bg-gradient-to-br from-cyan-500 to-cyan-700 border-cyan-900' : item.storage_type === 'fridge' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 border-indigo-900' : 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-800'}`}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/20 pointer-events-none"></div>
                        <div className="absolute inset-0 opacity-[0.08] pointer-events-none font-mono text-[5px] text-white p-2 break-all uppercase leading-[0.8] overflow-hidden select-none">{item.name} {item.name}</div>
                        <div className="h-full flex flex-col p-5 justify-between relative z-10 text-white">
                           <div className="flex justify-between items-start mb-2">
                              <span className="text-[8px] font-black opacity-60 uppercase tracking-[0.4em] italic">PREMIUM</span>
                              {isCritical && <motion.div animate={{ scale: [1,1.2,1] }} transition={{ repeat: Infinity }} className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_15px_rgba(248,113,113,1)]"></motion.div>}
                           </div>
                           <div className="flex-1 flex flex-col justify-center">
                              <h3 className="text-2xl font-black leading-tight tracking-tighter break-words uppercase">{item.name}</h3>
                              {item.expiry_date && (
                                <div className="mt-3 overflow-hidden rounded-full h-1 w-12 bg-black/20">
                                   <motion.div initial={{ width: 0 }} animate={{ width: isExpired ? "100%" : `${Math.max(10, 100 - (dayDiff || 0) * 10)}%` }} className={`h-full ${isCritical ? 'bg-red-400' : 'bg-white/60'}`} />
                                </div>
                              )}
                           </div>
                           <div className="space-y-2 pt-4">
                              <div className="h-[1px] bg-white/20 w-full"></div>
                              <div className="flex justify-between items-end">
                                  <div className="flex flex-col">
                                     <span className="text-[6px] opacity-40 font-black uppercase tracking-widest">Quantity</span>
                                     <span className="text-[10px] font-black uppercase">{item.amount} {item.unit}</span>
                                  </div>
                                  <span className="text-[8px] opacity-30 font-mono">#{item.id.slice(0,4)}</span>
                              </div>
                           </div>
                        </div>
                        <button onClick={() => handleDelete(item.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-red-500/80 transition-all z-30 border border-white/10"><Trash size={18} weight="bold" /></button>
                    </motion.div>
                    <div className="w-[80%] h-4 bg-black/30 blur-2xl rounded-full translate-y-4 -z-10 transition-all duration-500 group-hover:blur-3xl group-hover:scale-125 group-hover:opacity-40"></div>
                    {item.expiry_date && (
                       <motion.div whileHover={{ scale: 1.1 }} className="mt-6 text-center px-4 py-1.5 bg-white/40 backdrop-blur-xl rounded-xl border border-white/50 shadow-sm cursor-default">
                          <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${isExpired ? 'text-gray-400' : isCritical ? 'text-red-500' : 'text-gray-500'}`}>
                            <Calendar size={10} weight="bold" />
                            {isExpired ? 'BOZULMUŞ' : dayDiff === 0 ? 'BUGÜN BİTMELİ' : `TAZELİK: ${dayDiff} GÜN`}
                          </span>
                       </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Tip Card */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-24 bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
          <div className="absolute -right-10 -bottom-10 opacity-5"><Lightbulb size={200} weight="fill" /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-indigo-500/20 p-3 rounded-[1.2rem] text-indigo-400 border border-indigo-500/20 shadow-inner"><Info size={28} weight="fill" /></div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Intelligence Tip</h4>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Optimization Guide</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">Taze otları bir kavanoz su içinde saklamak ömrünü uzatır. Bu tip bilgiler mutfak verimliliğinizi artırır.</p>
          </div>
        </motion.div>
      </main>

      {/* FAB & Drawer */}
      <div className="fixed bottom-10 right-6 left-6 flex justify-center pointer-events-none z-[50]">
        <Drawer.Root>
          <Drawer.Trigger asChild>
            <button className="pointer-events-auto bg-gray-900 text-white w-full max-w-lg h-20 rounded-[2.5rem] font-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] flex items-center justify-center gap-4 active:scale-[0.96] transition-all hover:bg-black group relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-white/20"></div>
              <div className="bg-white/10 p-2 rounded-xl group-hover:rotate-90 transition-transform duration-500"><Plus size={24} weight="bold" /></div>
              <span className="uppercase tracking-[0.2em] text-[12px]">Yeni Ürün Kaydet</span>
            </button>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]" />
            <Drawer.Content className="bg-[#FAF9F7] flex flex-col rounded-t-[3.5rem] fixed bottom-0 left-0 right-0 max-h-[96dvh] outline-none z-[70] max-w-lg mx-auto border-t border-white">
              <div className="p-8 bg-white/80 backdrop-blur-xl rounded-t-[3.5rem] flex-1 overflow-y-auto">
                <div className="mx-auto w-16 h-1.5 flex-shrink-0 rounded-full bg-gray-200/50 mb-10" />
                <Drawer.Title className="text-3xl font-black text-gray-900 mb-2 tracking-tighter uppercase">Yeni Stok <span className="text-indigo-600">Girişi</span></Drawer.Title>
                <Drawer.Description className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div> Database Sync Active
                </Drawer.Description>
                <AddItemForm onComplete={() => fetchItems()} />
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </div>
  );
}

function AddItemForm({ onComplete }: { onComplete: () => void }) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    amount: "1",
    unit: "Adet",
    storageType: "pantry" as kiler.StorageType,
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      await client.kiler.addItem({
        userId: user.id,
        name: formData.name,
        amount: parseFloat(formData.amount),
        unit: formData.unit,
        storageType: formData.storageType,
        purchaseDate: formData.purchaseDate,
        expiryDate: formData.expiryDate || undefined
      });
      toast.success("Ürün başarıyla eklendi");
      onComplete();
      setFormData({ name: "", amount: "1", unit: "Adet", storageType: "pantry", purchaseDate: new Date().toISOString().split('T')[0], expiryDate: "" });
    } catch { toast.error("Hata oluştu"); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <div className="space-y-3">
        <label className="text-[10px] uppercase font-black text-gray-400 tracking-[0.3em] pl-2 flex items-center gap-2">
           <div className="w-1 h-1 rounded-full bg-indigo-500"></div> Ürün Tanımı
        </label>
        <input required placeholder="Ürün adı..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-100/50 border-2 border-transparent rounded-[1.8rem] p-6 text-sm focus:bg-white focus:border-indigo-500/20 transition-all outline-none font-bold" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="bg-gray-100/50 border-transparent rounded-[1.5rem] p-5 text-sm font-bold outline-none" />
        <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="bg-gray-100/50 border-transparent rounded-[1.5rem] p-5 text-sm font-bold outline-none">
          {["Adet", "Gram", "KG", "Litre", "Paket"].map(u => <option key={u}>{u}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { id: "fridge", label: "Dolap", icon: ThermometerCold },
          { id: "freezer", label: "Buzluk", icon: Snowflake },
          { id: "pantry", label: "Kiler", icon: Archive }
        ].map(s => (
          <motion.button key={s.id} type="button" whileTap={{ scale: 0.95 }} onClick={() => setFormData({...formData, storageType: s.id as kiler.StorageType})} className={`p-5 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 ${formData.storageType === s.id ? "bg-white border-indigo-500 shadow-lg" : "bg-gray-100/50 border-transparent text-gray-400"}`}>
            <s.icon size={28} weight={formData.storageType === s.id ? "fill" : "thin"} />
            <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
          </motion.button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-2">
           <label className="text-[8px] uppercase font-black text-gray-400 pl-2">Alış</label>
           <input type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} className="w-full bg-gray-100/50 rounded-[1.2rem] p-4 text-xs font-bold outline-none" />
        </div>
        <div className="space-y-2">
           <label className="text-[8px] uppercase font-black text-gray-400 pl-2">SKT</label>
           <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full bg-gray-100/50 rounded-[1.2rem] p-4 text-xs font-bold outline-none" />
        </div>
      </div>
      <motion.button disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gray-900 text-white p-6 rounded-[2.2rem] font-black shadow-2xl h-20 flex items-center justify-center gap-4">
        {loading ? <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div> : <><CheckCircle size={22} /><span className="uppercase tracking-[0.2em]">Envantere İşle</span></>}
      </motion.button>
    </form>
  );
}
