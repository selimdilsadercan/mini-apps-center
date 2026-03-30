"use client";

import { useState, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import Header from "@/components/Header";
import AppBar, { ActivePage } from "@/components/AppBar";
import MiniAppCard from "@/components/MiniAppCard";
import { MINI_APPS, AppCategory } from "@/lib/apps";
import { 
  MagnifyingGlass, 
  Sparkle,
  CirclesFour,
  X
} from "@phosphor-icons/react";

const CATEGORIES: AppCategory[] = ['Utilities', 'Games', 'Productivity', 'Social', 'Entertainment', 'Lifestyle', 'Dev & Design'];

export default function Discover() {
  const { isLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'All'>('All');

  const filteredApps = useMemo(() => {
    return MINI_APPS.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           app.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkle size={16} className="text-indigo-400 animate-pulse" />
            </div>
          </div>
        </main>
        <AppBar activePage={ActivePage.DISCOVER} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
      <Header />

      <main className="flex-1 px-5 pb-28 overflow-y-auto max-w-3xl mx-auto w-full">
        {/* Search & Categories Section */}
        <section className="sticky top-[64px] z-40 bg-[#FAF9F7]/95 backdrop-blur-md pt-2 pb-4 -mx-5 px-5 transition-all duration-300">
          <div className="relative group mb-5">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none group-focus-within:text-indigo-600 text-gray-400 transition-colors">
              <MagnifyingGlass size={20} weight="bold" />
            </div>
            <input
              type="text"
              placeholder="Search 40+ mini-apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-[1.25rem] py-4 pl-12 pr-12 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all font-medium text-base text-gray-900 placeholder:text-gray-400/80"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
                aria-label="Clear search"
              >
                <X size={18} weight="bold" />
              </button>
            )}
          </div>

          <div className="flex overflow-x-auto pb-2 gap-2.5 scrollbar-none no-scrollbar -mx-5 px-5">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                selectedCategory === 'All' 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                : "bg-white text-gray-500 border border-gray-100 hover:border-indigo-100 hover:text-indigo-600"
              }`}
            >
              All Apps
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                  selectedCategory === cat 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "bg-white text-gray-500 border border-gray-100 hover:border-indigo-100 hover:text-indigo-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* App Grid Section */}
        <section className="mt-4 mb-4">
          <div className="flex items-center justify-between mb-5 px-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <CirclesFour size={18} weight="fill" className="text-indigo-600" />
              </div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                {selectedCategory === 'All' ? 'Everything Hub' : selectedCategory}
              </h2>
            </div>
            <span className="text-[11px] font-black text-indigo-400 bg-indigo-50/50 px-2.5 py-1 rounded-full uppercase tracking-tighter">
              {filteredApps.length} Modules
            </span>
          </div>

          {filteredApps.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CirclesFour size={32} className="text-gray-300" />
              </div>
              <h3 className="text-gray-900 font-bold mb-1">No apps found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-4">
              {filteredApps.map((app) => (
                <MiniAppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </section>
      </main>

      <AppBar activePage={ActivePage.DISCOVER} />
    </div>
  );
}
