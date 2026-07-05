"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { 
  ListChecks, 
  Plus, 
  Trash, 
  CaretLeft, 
  Sparkle,
  CheckCircle,
  Basket,
  MagnifyingGlass,
  ArrowRight
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { eksik_var } from "@/lib/client";

// Initialize client
const client = createBrowserClient();

// Comprehensive list of common items for autocomplete suggestions
const COMMON_ITEMS = [
  "Süt", "Ekmek", "Yumurta", "Yoğurt", "Peynir", 
  "Makarna", "Pirinç", "Un", "Tuz", "Şeker", 
  "Sıvı Yağ", "Zeytinyağı", "Tereyağı", "Su", "Meyve Suyu", 
  "Kahve", "Çay", "Bal", "Reçel", "Çikolata",
  "Domates", "Salatalık", "Patates", "Soğan", "Sarımsak",
  "Biber", "Limon", "Elma", "Muz", "Portakal",
  "Deterjan", "Şampuan", "Sabun", "Diş Macunu", "Tuvalet Kağıdı",
  "Islak Mendil", "Peçete", "Çöp Torbası", "Bulaşık Süngeri"
];

export default function EksikVarPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [items, setItems] = useState<eksik_var.MissingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);
  
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle clicking outside of suggestions to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch items when user authentication state is resolved
  useEffect(() => {
    if (isUserLoaded && user) {
      fetchItems();
    } else if (isUserLoaded && !user) {
      setLoading(false);
    }
  }, [isUserLoaded, user]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      if (!user) {
        setItems([]);
        return;
      }
      const response = await client.eksik_var.getItems(user.id);
      setItems(response.items || []);
    } catch (error) {
      console.error("fetchItems error:", error);
      toast.error("Liste yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }
    // Filter suggestions case-insensitively
    const filtered = COMMON_ITEMS.filter(item => 
      item.toLocaleLowerCase("tr-TR").includes(val.toLocaleLowerCase("tr-TR"))
    ).slice(0, 5); // Limit to top 5
    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  const handleAddItem = async (nameToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;
    if (!user) {
      toast.error("Lütfen giriş yapın.");
      return;
    }
    
    // Check if item already exists in current list
    if (items.some(item => item.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`${trimmed} zaten listenizde bulunuyor.`);
      return;
    }

    try {
      const response = await client.eksik_var.addItem({
        userId: user.id,
        name: trimmed
      });
      if (response.item) {
        setItems(prev => [response.item!, ...prev]);
        toast.success(`${trimmed} eklendi!`);
      }
      setInputValue("");
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error("handleAddItem error:", error);
      toast.error("Ürün eklenemedi.");
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!user) return;
    try {
      await client.eksik_var.deleteItem(id, { userId: user.id });
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success(`${name} listeden kaldırıldı.`);
    } catch (error) {
      console.error("handleDeleteItem error:", error);
      toast.error("Ürün silinemedi.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] relative overflow-hidden">
      <Toaster position="top-center" />

      {/* Decorative Premium Blur Backgrounds */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 40, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-[75%] h-[75%] rounded-full bg-pink-400/10 blur-[130px]"
        />
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -30, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] rounded-full bg-fuchsia-400/10 blur-[110px]"
        />
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
      </div>

      <main className="flex-1 px-5 py-10 pb-36 max-w-lg mx-auto w-full relative z-10">
        {/* Navigation & Status Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => window.location.href = getAppRootUrl()}
            className="group flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-gray-900 transition-all bg-white/50 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white shadow-sm active:scale-95"
          >
            <CaretLeft size={14} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
            <span>Katalog</span>
          </button>
          
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white shadow-sm font-black text-[10px] text-gray-900 uppercase">
            <div className="relative w-2 h-2">
              <div className="absolute inset-0 bg-[#D946EF] rounded-full animate-ping"></div>
              <div className="relative bg-[#D946EF] w-full h-full rounded-full"></div>
            </div>
            <span>Shopping Core</span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="relative mb-10 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ rotate: -5, scale: 1.05 }}
            className="inline-block bg-white p-6 rounded-[2.8rem] shadow-[0_25px_50px_-12px_rgba(217,70,239,0.25)] mb-6 border border-fuchsia-50 relative group cursor-pointer"
          >
            <div className="absolute inset-0 bg-[#D946EF] rounded-[2.8rem] blur-2xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <ListChecks size={54} weight="fill" className="text-[#D946EF] relative z-10" />
          </motion.div>
          <h1 className="text-4xl font-black text-gray-950 tracking-tighter uppercase mb-2 leading-none">
            Eksik <span className="text-[#D946EF]">Var!</span>
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-8 bg-gray-200"></div>
            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.4em]">Smart Shopping List</p>
            <div className="h-[1px] w-8 bg-gray-200"></div>
          </div>
        </div>

        {/* Stats and Quick Info */}
        {!loading && items.length > 0 && (
          <div className="mb-6 flex justify-between items-center bg-white/40 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-fuchsia-50 flex items-center justify-center text-[#D946EF]">
                <Basket size={18} weight="fill" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Eksikleriniz</span>
            </div>
            <span className="bg-[#D946EF]/10 text-[#D946EF] px-4 py-1.5 rounded-full text-xs font-black tracking-tight">
              {items.length} Adet
            </span>
          </div>
        )}

        {/* List Content */}
        {loading ? (
          <div className="py-24 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
            Eksik Listesi Taranıyor...
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 text-center bg-white/30 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-white/60 flex flex-col items-center justify-center px-6 shadow-sm"
          >
            <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center text-gray-300 mb-6 shadow-sm">
              <Basket size={32} />
            </div>
            <p className="text-gray-900 text-lg font-black tracking-tight mb-2">Alışveriş listeniz boş!</p>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-wider mb-8">Evinizde eksik bir şey kalmadı mı?</p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsAddingMode(true);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className="bg-gray-950 hover:bg-black text-white px-8 py-4.5 rounded-full font-black text-xs uppercase tracking-wider shadow-xl flex items-center gap-3 transition-colors"
            >
              <Plus size={16} weight="bold" />
              Eksik Ekle
            </motion.button>
          </motion.div>
        ) : (
          /* Missing Items List */
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, x: -30 }}
                  key={item.id}
                  className="bg-white/60 backdrop-blur-xl border border-white p-5 rounded-[2rem] flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:bg-white transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-fuchsia-50/50 flex items-center justify-center text-[#D946EF] border border-fuchsia-100/50">
                      <Sparkle size={18} weight="fill" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight break-all">
                        {item.name}
                      </h3>
                      <span className="text-[8px] font-mono text-gray-300">
                        #{item.id.slice(0, 6)} • {new Date(item.created_at).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-gray-100 shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Input & Autocomplete Panel */}
        {(isAddingMode || items.length > 0) && (
          <div className="mt-8 relative" ref={suggestionsRef}>
            <div className="flex gap-3 relative z-20">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#D946EF] transition-colors">
                  <MagnifyingGlass size={18} weight="bold" />
                </div>
                <input 
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddItem(inputValue);
                    }
                  }}
                  onFocus={() => {
                    if (inputValue.trim()) setShowSuggestions(true);
                  }}
                  placeholder="Eksik ürün yazın..." 
                  className="w-full bg-white border border-white rounded-[1.8rem] py-5 pl-14 pr-6 text-sm font-bold focus:ring-4 focus:ring-fuchsia-500/10 focus:border-[#D946EF]/30 transition-all shadow-md outline-none placeholder:text-gray-300" 
                />
              </div>
              <button 
                onClick={() => handleAddItem(inputValue)}
                className="bg-[#D946EF] hover:bg-[#c23ed6] text-white w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-lg active:scale-95 transition-all flex-shrink-0"
              >
                <ArrowRight size={22} weight="bold" />
              </button>
            </div>

            {/* Autocomplete suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 top-[4.8rem] bg-white border border-gray-100 rounded-[2rem] shadow-xl overflow-hidden z-30 p-2 space-y-1"
                >
                  <div className="px-4 py-2 text-[8px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50 mb-1">
                    Önerilen Ürünler
                  </div>
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleAddItem(item)}
                      className="w-full text-left px-5 py-3.5 hover:bg-fuchsia-50/50 rounded-[1.2rem] text-xs font-black text-gray-700 hover:text-[#D946EF] transition-all flex items-center justify-between"
                    >
                      <span>{item}</span>
                      <Plus size={14} weight="bold" className="opacity-40" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
