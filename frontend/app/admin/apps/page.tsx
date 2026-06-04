"use client";

import { MINI_APPS, MiniApp } from "@/lib/apps";
import { 
  SquaresFour, 
  CaretRight, 
  Plus, 
  MagnifyingGlass,
  CheckCircle,
  XCircle
} from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminAppsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredApps = useMemo(() => {
    return MINI_APPS.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      app.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="max-w-4xl mx-auto px-6 pt-12 pb-24">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <SquaresFour size={24} weight="fill" color="white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Uygulamalar
          </h1>
        </div>
        <p className="text-gray-500 font-medium">
          Sistemdeki tüm mini uygulamaları yönetin ve yapılandırın.
        </p>
      </motion.header>

      {/* Search & Actions */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 mb-8"
      >
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
            <MagnifyingGlass size={20} weight="bold" />
          </div>
          <input
            type="text"
            placeholder="Uygulama ara (isim veya ID)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all font-semibold text-gray-900"
          />
        </div>
        <button className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0">
          <Plus size={20} weight="bold" />
          Yeni Uygulama
        </button>
      </motion.div>

      {/* Apps List */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4"
      >
        {filteredApps.map((app) => (
          <motion.div 
            key={app.id}
            variants={itemVariants}
            className="bg-white/80 backdrop-blur-sm border border-white shadow-xl shadow-indigo-100/20 rounded-[2rem] p-5 flex items-center justify-between group hover:border-indigo-100 transition-all"
          >
            <div className="flex items-center gap-5">
              {/* App Icon */}
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden shrink-0"
                style={{ 
                  backgroundColor: app.color,
                  boxShadow: `0 8px 16px -4px ${app.color}40`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-black/15 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                <app.icon size={32} weight="fill" color="white" className="relative z-10" />
              </div>

              {/* App Info */}
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {app.name}
                  </h3>
                  {app.isImplemented ? (
                    <CheckCircle size={18} weight="fill" className="text-green-500" />
                  ) : (
                    <XCircle size={18} weight="fill" className="text-gray-300" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-gray-400">
                  <span className="bg-gray-100 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider text-gray-500">
                    {app.id}
                  </span>
                  <span>•</span>
                  <span>{app.category}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/admin/apps/${app.id}`}
                className="p-3 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"
              >
                <CaretRight size={20} weight="bold" />
              </Link>
            </div>
          </motion.div>
        ))}

        {filteredApps.length === 0 && (
          <motion.div 
            variants={itemVariants}
            className="text-center py-20 bg-white/40 rounded-[2.5rem] border border-dashed border-gray-200"
          >
            <h3 className="text-gray-900 font-bold mb-1">Uygulama bulunamadı</h3>
            <p className="text-gray-500 text-sm">Arama kriterlerinize uygun uygulama yok.</p>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}

