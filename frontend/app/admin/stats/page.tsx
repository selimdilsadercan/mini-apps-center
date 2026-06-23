"use client";

import { motion } from "framer-motion";
import { ChartBar } from "@phosphor-icons/react";

export default function AdminStatsPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 pt-12 pb-24">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <ChartBar size={24} weight="fill" color="white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            İstatistikler
          </h1>
        </div>
        <p className="text-gray-500 font-medium">
          Sistem kullanım verilerini ve uygulama istatistiklerini inceleyin.
        </p>
      </motion.header>

      <div className="text-center py-20 bg-white/40 rounded-[2.5rem] border border-dashed border-gray-200">
        <h3 className="text-gray-900 font-bold mb-1">Yakında</h3>
        <p className="text-gray-500 text-sm">İstatistik paneli geliştirme aşamasındadır.</p>
      </div>
    </main>
  );
}
