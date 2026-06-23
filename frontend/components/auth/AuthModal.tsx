"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogo, AppleLogo, X, LockKey } from "@phosphor-icons/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  title = "Giriş Yapın", 
  subtitle = "Devam etmek için lütfen giriş yapın." 
}: AuthModalProps) {
  const { signIn, isAuthenticated, loading } = useAuthContext();
  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);

  const signInWithOAuth = async (provider: "google" | "apple") => {
    setLoadingProvider(provider);
    try {
      await signIn(provider);
      if (onClose) onClose();
    } catch (err) {
      console.error(`${provider} sign-in error:`, err);
    } finally {
      setLoadingProvider(null);
    }
  };

  if (!isOpen || isAuthenticated) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md px-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl border border-indigo-50 flex flex-col items-center text-center relative"
        >
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-400"
            >
              <X size={20} weight="bold" />
            </button>
          )}

          <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center mb-6">
            <LockKey size={40} weight="fill" className="text-indigo-600" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            {subtitle}
          </p>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => signInWithOAuth("google")}
              disabled={loading || loadingProvider !== null}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 py-4 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingProvider === "google" ? (
                <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <GoogleLogo size={24} weight="bold" className="text-red-500" />
              )}
              <span>{loadingProvider === "google" ? "Bağlanıyor..." : "Google ile Devam Et"}</span>
            </button>

            <button
              onClick={() => signInWithOAuth("apple")}
              disabled={loading || loadingProvider !== null}
              className="w-full flex items-center justify-center gap-3 bg-black border-2 border-black py-4 rounded-2xl font-bold text-white hover:bg-gray-900 active:scale-95 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingProvider === "apple" ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <AppleLogo size={24} weight="fill" className="text-white" />
              )}
              <span>{loadingProvider === "apple" ? "Bağlanıyor..." : "Apple ile Devam Et"}</span>
            </button>
          </div>

          <p className="mt-6 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Everything
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
