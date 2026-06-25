"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Coffee,
  CaretLeft,
  Layout,
  Gear, 
  SignOut,
  House,
  SquaresFour,
  Plus
} from "@phosphor-icons/react";
import { Toaster } from "react-hot-toast";
import { WorkplacesProvider, useWorkplaces } from "./context";
import { getAppRootUrl } from "@/lib/apps";

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { business, businessId } = useWorkplaces();

  const menuItems = [
    {
      title: "Mekanlar",
      icon: SquaresFour,
      path: `/dashboard/workplaces?id=${businessId}`,
      active: pathname === "/dashboard/workplaces"
    }
  ];

  return (
    <aside className="w-80 h-full bg-white border-r border-stone-200/80 flex flex-col shrink-0 z-20 shadow-sm">
      <div className="p-6 border-b border-stone-100 space-y-5">
        <button
          onClick={() => {
            window.location.href = getAppRootUrl();
          }}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-all bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-4 py-2.5 rounded-2xl active:scale-95 text-xs font-black uppercase tracking-widest cursor-pointer"
        >
          <CaretLeft size={14} weight="bold" />
          <span>Geri</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6F4E37] to-[#8B5E3C] flex items-center justify-center text-white shadow-md shadow-[#6F4E37]/10">
            <Coffee size={24} weight="fill" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-base text-stone-900 leading-tight truncate">Workplaces</h1>
            <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider mt-0.5 truncate">{business?.name}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-8 overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <SquaresFour size={14} />
            Yönetim
          </h3>
          <div className="space-y-1.5">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                  item.active
                    ? "bg-stone-900 text-white shadow-lg shadow-stone-900/10 font-black"
                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-50 font-bold"
                }`}
              >
                <item.icon size={18} weight={item.active ? "fill" : "bold"} />
                <span className="text-xs">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}

function WorkplacesLayoutContent({ children }: { children: React.ReactNode }) {
  const { business, loading } = useWorkplaces();
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("id");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FDFBF9] text-stone-900 font-sans relative">
      <Toaster position="top-center" />
      
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-[#6F4E37]/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-[#8B5E3C]/5 blur-[120px]" />
      </div>

      <div className="flex flex-1 w-full h-full relative z-10 overflow-hidden">
        <Sidebar />
        <main className="flex-1 h-full flex flex-col min-w-0 bg-[#FAF9F5]/60 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function WorkplacesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-[#FDFBF9] items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#6F4E37]/10 border-t-[#6F4E37] rounded-full animate-spin" />
        </div>
      }
    >
      <WorkplacesProvider>
        <WorkplacesLayoutContent>{children}</WorkplacesLayoutContent>
      </WorkplacesProvider>
    </Suspense>
  );
}
