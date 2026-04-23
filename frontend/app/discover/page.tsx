"use client";

import { useState, useMemo, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import AppBar, { ActivePage } from "@/components/AppBar";
import MiniAppCard from "@/components/MiniAppCard";
import { MINI_APPS, AppCategory, MiniApp } from "@/lib/apps";
import { 
  MagnifyingGlass, 
  Sparkle,
  CirclesFour,
  X,
  CaretRight,
  Star,
  TrendUp,
  Fire
} from "@phosphor-icons/react";
import Link from "next/link";

const CATEGORIES: AppCategory[] = ['Utilities', 'Games', 'Productivity', 'Social', 'Entertainment', 'Lifestyle', 'Dev & Design'];

// App Store style horizontal section with vertical stacks of 3
function AppSection({ title, apps }: { title: string, apps: MiniApp[] }) {
  if (apps.length === 0) return null;
  
  // Chunk apps into groups of 3 for vertical stacking
  const chunkedApps = [];
  for (let i = 0; i < apps.length; i += 3) {
    chunkedApps.push(apps.slice(i, i + 3));
  }
  
  return (
    <section className="mt-10 first:mt-4">
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="text-2xl font-[1000] text-gray-900 tracking-tight leading-tight">
          {title}
        </h2>
        <button className="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-gray-100 shadow-sm text-gray-400 hover:text-indigo-600 transition-all">
          <CaretRight size={18} weight="bold" />
        </button>
      </div>

      <div className="flex overflow-x-auto pb-6 gap-5 scrollbar-none no-scrollbar -mx-5 snap-x snap-mandatory scroll-pl-5">
        {/* Left Spacer to align with header padding */}
        <div className="min-w-[20px] shrink-0" />
        
        {chunkedApps.map((chunk, chunkIdx) => (
          <div key={chunkIdx} className="flex flex-col gap-5 w-[82vw] max-w-[320px] snap-start shrink-0">
            {chunk.map((app) => (
              <Link 
                key={app.id} 
                href={app.href} 
                className="group flex items-center gap-4 active:scale-[0.98] transition-all duration-200"
              >
                {/* Icon */}
                <div 
                  className="w-[68px] h-[68px] rounded-[1.4rem] flex items-center justify-center shadow-lg relative overflow-hidden shrink-0 transition-transform duration-500 group-hover:scale-105"
                  style={{ 
                    backgroundColor: app.color,
                    boxShadow: `0 8px 20px -6px ${app.color}50`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent"></div>
                  <div className="absolute inset-0 border border-white/20 rounded-[1.4rem]"></div>
                  <app.icon size={32} weight="fill" color="white" className="relative z-10" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 border-b border-gray-100/60 pb-5 group-last:border-0 group-last:pb-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-bold text-gray-900 text-[16px] truncate group-hover:text-indigo-600 transition-colors">
                      {app.name}
                    </h3>
                  </div>
                  <p className="text-gray-500 text-[13px] leading-tight line-clamp-1 font-medium">
                    {app.category} • {app.description}
                  </p>
                </div>

                {/* Get Button */}
                <div className="bg-gray-100 group-hover:bg-indigo-600 px-5 py-2 rounded-full transition-all duration-300 shrink-0">
                  <span className="text-[12px] font-black text-gray-600 group-hover:text-white transition-colors">
                    GET
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ))}

        {/* Right Spacer to allow scrolling past the last item */}
        <div className="min-w-[20px] shrink-0" />
      </div>
    </section>
  );
}


export default function Discover() {
  const { isLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const implementedApps = useMemo(() => MINI_APPS.filter(a => a.isImplemented), []);
  
  const filteredApps = useMemo(() => {
    if (!searchQuery) return [];
    return MINI_APPS.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      app.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
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
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background Decorative Gradient (Same as Home) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-purple-100/20 blur-[120px] rounded-full"></div>
      </div>

      <main className="flex-1 px-5 pb-32 overflow-y-auto max-w-4xl mx-auto w-full">
        {/* Header Section */}
        <header className="pt-8 pb-4">
          <h1 className="text-3xl font-[1000] text-gray-900 tracking-tight leading-none mb-1.5">
            Everything Hub
          </h1>
          <p className="text-gray-500 text-sm font-medium">Discover your next daily essential.</p>
        </header>

        {/* Search Bar */}
        <div className="sticky top-0 z-50 bg-[#FAF9F7]/90 backdrop-blur-xl -mx-5 px-5 py-2.5 mb-2 transition-all duration-300">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none group-focus-within:text-indigo-600 text-gray-400 transition-colors">
              <MagnifyingGlass size={20} weight="bold" />
            </div>
            <input
              type="text"
              placeholder="Apps, Games and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/80 border border-gray-200/50 rounded-[1.5rem] py-3.5 pl-12 pr-12 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all font-semibold text-base text-gray-900 placeholder:text-gray-400/80"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            )}
          </div>
        </div>

        {searchQuery ? (
          /* Search Results */
          <section className="mt-6">
            <h2 className="text-xl font-extrabold mb-5 px-1 flex items-center gap-2">
              Results for <span className="text-indigo-600">"{searchQuery}"</span>
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {filteredApps.length > 0 ? (
                filteredApps.map(app => (
                  <Link key={app.id} href={app.href} className="flex items-center gap-4 bg-white p-4 rounded-[1.75rem] border border-gray-100 hover:border-indigo-100 transition-all group">
                    <div 
                      className="w-14 h-14 rounded-[1rem] flex items-center justify-center shrink-0 relative overflow-hidden shadow-md" 
                      style={{ backgroundColor: app.color }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/15 to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                      <app.icon size={24} color="white" weight="fill" className="relative z-10" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{app.name}</h3>
                      <p className="text-gray-500 text-sm truncate">{app.category}</p>
                    </div>
                    <div className="bg-indigo-50 px-4 py-1.5 rounded-full">
                      <span className="text-[12px] font-black text-indigo-600">GET</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
                  <h3 className="text-gray-900 font-bold">No results found</h3>
                  <p className="text-gray-500 text-sm">Try a different keyword.</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          /* Main App Store Layout */
          <>
            {/* Categorized Sections */}
            <AppSection title="Must-Have Tools" apps={MINI_APPS.filter(a => a.category === 'Utilities').slice(0, 9)} />
            <AppSection title="Trending Games" apps={MINI_APPS.filter(a => a.category === 'Games').slice(0, 9)} />
            <AppSection title="Boost Productivity" apps={MINI_APPS.filter(a => a.category === 'Productivity').slice(0, 9)} />
            <AppSection title="Lifestyle & Fun" apps={MINI_APPS.filter(a => a.category === 'Lifestyle').slice(0, 9)} />
          </>
        )}
      </main>

      <AppBar activePage={ActivePage.DISCOVER} />
    </div>
  );
}


