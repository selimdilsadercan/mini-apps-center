"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  CaretLeft,
  Users,
  ShieldCheck,
  ChartBar,
  House,
  SquaresFour,
  Camera,
  ImageSquare,
} from "@phosphor-icons/react";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      title: "Kullanıcılar",
      icon: Users,
      path: "/admin/users",
      active: pathname.startsWith("/admin/users")
    },
    {
      title: "İşletmeler",
      icon: SquaresFour,
      path: "/admin/businesses",
      active: pathname.startsWith("/admin/businesses")
    },
    {
      title: "İstatistikler",
      icon: ChartBar,
      path: "/admin/stats",
      active: pathname.startsWith("/admin/stats")
    },
    {
      title: "Store Preview",
      icon: Camera,
      path: "/apps/store-preview",
      active: pathname.startsWith("/apps/store-preview")
    },
    {
      title: "Icon Export",
      icon: ImageSquare,
      path: "/apps/icon-export",
      active: pathname.startsWith("/apps/icon-export")
    }
  ];

  return (
    <aside className="w-80 h-full bg-white border-r border-stone-200/80 flex flex-col shrink-0 z-20 shadow-sm">
      <div className="p-6 border-b border-stone-100 space-y-5">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-all bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-4 py-2.5 rounded-2xl active:scale-95 text-xs font-black uppercase tracking-widest cursor-pointer"
        >
          <CaretLeft size={14} weight="bold" />
          <span>Ana Sayfa</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/10">
            <ShieldCheck size={24} weight="fill" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-base text-stone-900 leading-tight truncate">Yönetim Paneli</h1>
            <p className="text-[10px] text-stone-400 font-black uppercase tracking-wider mt-0.5 truncate">Sistem Yönetimi</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-8 overflow-y-auto">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <House size={14} />
            Genel
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FDFBF9] text-stone-900 font-sans relative">
      <Toaster position="top-center" />
      
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-violet-600/5 blur-[120px]" />
      </div>

      <div className="flex flex-1 w-full h-full relative z-10 overflow-hidden">
        <Sidebar />
        <main className="flex-1 h-full flex flex-col min-w-0 bg-[#FAF9F5]/60 overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
