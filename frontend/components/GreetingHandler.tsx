"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle, Bell } from "@phosphor-icons/react";
import { useNotifications } from "@/hooks/use-notifications";

export function GreetingHandler() {
  const { user, isLoaded } = useUser();
  const { permission, handleRequestPermission } = useNotifications();
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingStep, setGreetingStep] = useState(0); // 0: Welcome, 1: Notification Ask (if needed)

  useEffect(() => {
    if (isLoaded && user) {
      // Sadece uygulama ilk açıldığında kısa bir süreliğine göster
      const hasGreeted = sessionStorage.getItem("has_greeted_this_session");
      if (!hasGreeted) {
        setShowGreeting(true);
        sessionStorage.setItem("has_greeted_this_session", "true");
        
        // 2 saniye sonra bildirim adımına geç veya kapat
        setTimeout(() => {
          if (permission === "prompt") {
            setGreetingStep(1);
          } else {
            setShowGreeting(false);
          }
        }, 2500);
      }
    }
  }, [isLoaded, user, permission]);

  if (!showGreeting) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md px-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-200/50 border border-indigo-50 flex flex-col items-center text-center"
        >
          {greetingStep === 0 ? (
            <>
              <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center mb-6 transform rotate-3">
                <Sparkle size={40} weight="fill" className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                Merhaba, {user?.firstName || "Gezgin"}!
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Her şey senin için hazırlandı. Dijital dünyana hoş geldin.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-6">
                <Bell size={40} weight="fill" className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                Haberdar Kalalım
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Güncellemeler ve önemli duyurulardan anında haberdar olmak için bildirimleri aktif edelim mi?
              </p>
              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={async () => {
                    await handleRequestPermission();
                    setShowGreeting(false);
                  }}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                >
                  Tabii, Olsun!
                </button>
                <button
                  onClick={() => setShowGreeting(false)}
                  className="w-full bg-gray-50 text-gray-400 py-3 rounded-2xl font-medium active:scale-95 transition-all text-sm"
                >
                  Daha Sonra
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
