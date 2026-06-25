"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import AppBar, { ActivePage } from "@/components/AppBar";
import { MINI_APPS, MiniApp, navigateToMiniApp } from "@/lib/apps";
import { 
  MagnifyingGlass, 
  X,
  TrendUp,
  Fire,
  CaretRight,
  Plus,
  Check
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { getUserPreferencesAction, updateAppOrderAction } from "../home/actions";
import { useTranslations } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

export default function Discover() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const t = useTranslations("discover");
  const tApps = useTranslations("apps");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const implementedApps = useMemo(() => 
    MINI_APPS.filter(a => a.isImplemented && !a.isCancelled), 
  []);

  const categories = useMemo(() => {
    const cats = new Set(implementedApps.map(a => a.category));
    return ["All", ...Array.from(cats)];
  }, [implementedApps]);

  useEffect(() => {
    async function loadInstalled() {
      if (!isLoaded) return;
      try {
        let orderIds: string[] | null = null;
        if (user?.id) {
          const { data } = await getUserPreferencesAction(user.id);
          if (data?.appOrder) orderIds = data.appOrder;
        }
        if (!orderIds) {
          const savedOrder = localStorage.getItem(`app_order_${user?.id || "guest"}`);
          if (savedOrder) orderIds = JSON.parse(savedOrder);
        }
        setInstalledIds(orderIds || implementedApps.map(a => a.id));
      } finally {
        setIsLoading(false);
      }
    }
    loadInstalled();
  }, [user?.id, isLoaded, implementedApps]);

  const filteredApps = useMemo(() => {
    return implementedApps.filter(app => {
      const appName = tApps(`${app.id}.name`) !== `apps.${app.id}.name` ? tApps(`${app.id}.name`) : app.name;
      const appDesc = tApps(`${app.id}.description`) !== `apps.${app.id}.description` ? tApps(`${app.id}.description`) : app.description;
      
      const matchesSearch = 
        appName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        appDesc.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, implementedApps, tApps]);

  const handleToggleApp = async (appId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let newInstalled;
    const isInstalled = installedIds.includes(appId);
    
    if (isInstalled) {
      newInstalled = installedIds.filter(id => id !== appId);
      toast.success(t("removedToast"));
    } else {
      newInstalled = [...installedIds, appId];
      toast.success(t("addedToast"));
    }
    
    setInstalledIds(newInstalled);
    localStorage.setItem(`app_order_${user?.id || "guest"}`, JSON.stringify(newInstalled));
    if (user?.id) await updateAppOrderAction(user.id, newInstalled);
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        </main>
        <AppBar activePage={ActivePage.DISCOVER} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white pb-32">
      {/* Header */}
      <header className="px-6 pt-10 pb-6">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
          Keşfet
        </h1>
        <p className="text-gray-500 font-medium">
          Everything ekosistemindeki en yeni araçları ve uygulamaları bul.
        </p>
      </header>

      {/* Search & Categories */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-40 px-6 py-4 space-y-4">
        <div className="relative">
          <MagnifyingGlass size={20} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Uygulama veya araç ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 border-none rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={18} weight="bold" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-200" 
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main className="px-6 py-4 max-w-2xl mx-auto w-full">
        {/* Featured Section (Product Hunt Style) */}
        {!searchQuery && selectedCategory === "All" && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4 text-orange-500 font-black text-xs uppercase tracking-widest">
              <Fire size={18} weight="fill" />
              <span>Trend Olanlar</span>
            </div>
            <div className="space-y-4">
              {implementedApps.slice(0, 2).map(app => (
                <FeaturedCard 
                  key={app.id} 
                  app={app} 
                  tApps={tApps}
                  isInstalled={installedIds.includes(app.id)}
                  onToggle={(e) => handleToggleApp(app.id, e)}
                  onClick={() => navigateToMiniApp(app, router)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Apps List */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-gray-400 font-black text-xs uppercase tracking-widest">
            <TrendUp size={18} weight="bold" />
            <span>{selectedCategory === "All" ? "Tüm Uygulamalar" : selectedCategory}</span>
          </div>
          <div className="space-y-1">
            {filteredApps.map((app, index) => (
              <DiscoverRow 
                key={app.id} 
                app={app} 
                index={index}
                tApps={tApps}
                isInstalled={installedIds.includes(app.id)}
                onToggle={(e) => handleToggleApp(app.id, e)}
                onClick={() => navigateToMiniApp(app, router)}
              />
            ))}
          </div>
        </section>
      </main>

      <AppBar activePage={ActivePage.DISCOVER} />
    </div>
  );
}

function FeaturedCard({ app, tApps, isInstalled, onToggle, onClick }: any) {
  const Icon = app.icon;
  const appName = tApps(`${app.id}.name`) !== `apps.${app.id}.name` ? tApps(`${app.id}.name`) : app.name;
  const appDesc = tApps(`${app.id}.description`) !== `apps.${app.id}.description` ? tApps(`${app.id}.description`) : app.description;

  return (
    <button 
      onClick={onClick}
      className="w-full text-left bg-gray-900 rounded-[2.5rem] p-6 relative overflow-hidden group active:scale-[0.98] transition-all shadow-xl shadow-gray-200"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-all" />
      
      <div className="flex items-start justify-between mb-6">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: app.color }}
        >
          <Icon size={32} weight="fill" className="text-white" />
        </div>
        <button 
          onClick={onToggle}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isInstalled ? "bg-green-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {isInstalled ? <Check size={24} weight="bold" /> : <Plus size={24} weight="bold" />}
        </button>
      </div>

      <h3 className="text-white text-xl font-black mb-2">{appName}</h3>
      <p className="text-gray-400 text-sm font-medium line-clamp-2 leading-relaxed">
        {appDesc}
      </p>
    </button>
  );
}

function DiscoverRow({ app, index, tApps, isInstalled, onToggle, onClick }: any) {
  const Icon = app.icon;
  const appName = tApps(`${app.id}.name`) !== `apps.${app.id}.name` ? tApps(`${app.id}.name`) : app.name;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex items-center gap-4 py-4 border-b border-gray-50 group"
    >
      <button onClick={onClick} className="flex-1 flex items-center gap-4 text-left min-w-0">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: app.color }}
        >
          <Icon size={24} weight="fill" className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
            {appName}
          </h4>
          <p className="text-gray-400 text-xs font-medium truncate">
            {app.category}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-3">
        <button 
          onClick={onToggle}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isInstalled ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
          }`}
        >
          {isInstalled ? <Check size={18} weight="bold" /> : <Plus size={18} weight="bold" />}
        </button>
        <button onClick={onClick} className="p-2 text-gray-200 hover:text-gray-400 transition-colors">
          <CaretRight size={20} weight="bold" />
        </button>
      </div>
    </motion.div>
  );
}
