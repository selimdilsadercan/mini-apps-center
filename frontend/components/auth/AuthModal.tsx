"use client";

import { useSignIn, useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleLogo, X, LockKey } from "@phosphor-icons/react";
import { Capacitor } from "@capacitor/core";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

const SSO_CALLBACK_URL_BASE = "https://my.allminiapps.com/sso-callback";

export function AuthModal({ 
  isOpen, 
  onClose, 
  title = "Giriş Yapın", 
  subtitle = "Devam etmek için lütfen giriş yapın." 
}: AuthModalProps) {
  const { signIn, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const signInWithGoogle = async () => {
    if (!signIn) return;

    try {
      const callbackUrl = isNative 
        ? `${SSO_CALLBACK_URL_BASE}?source=native` 
        : `${window.location.origin}/sso-callback`;

      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: callbackUrl,
        redirectUrlComplete: callbackUrl,
      });
    } catch (err) {
      console.error("OAuth error:", err);
    }
  };

  if (!isOpen || isSignedIn) return null;

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

          <button
            onClick={signInWithGoogle}
            disabled={!isLoaded}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 py-4 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
          >
            <GoogleLogo size={24} weight="bold" className="text-red-500" />
            <span>Google ile Devam Et</span>
          </button>

          <p className="mt-6 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Everything Mini Apps Center
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
