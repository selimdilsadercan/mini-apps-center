"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { BellRing, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function NotificationPrompt() {
  const { permission, handleRequestPermission, loading } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Sayfa yüklendikten 3 saniye sonra göster (Premium deneyim için)
    if (permission === "default") {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [permission]);

  if (permission !== "default" || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-[100] w-[calc(100vw-3rem)] max-w-sm"
      >
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 overflow-hidden relative group">
          {/* Dekoratif Arka Plan Işığı */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />
          
          <div className="flex items-start justify-between relative">
            <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
              <BellRing className="w-6 h-6 animate-[bell_2s_infinite]" />
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 relative">
            <h3 className="font-semibold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
              Gelişmelerden Haberdar Olun
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              En son güncellemeler ve önemli hatırlatıcılar için bildirimlere izin verin.
            </p>
          </div>

          <div className="flex gap-3 relative pt-2">
            <Button 
              onClick={handleRequestPermission}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-medium shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              {loading ? "İşleniyor..." : "İzin Ver"}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsVisible(false)}
              className="flex-1 rounded-xl h-11 font-medium border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              Daha Sonra
            </Button>
          </div>
        </div>

        <style jsx>{`
          @keyframes bell {
            0%, 100% { transform: rotate(0deg); }
            20% { transform: rotate(15deg); }
            40% { transform: rotate(-15deg); }
            60% { transform: rotate(10deg); }
            80% { transform: rotate(-10deg); }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
