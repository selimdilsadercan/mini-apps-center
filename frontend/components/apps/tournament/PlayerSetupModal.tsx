"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import AvatarSelector, { AvatarConfig, DEFAULT_AVATAR_CONFIG, getAvatarUrl, generateRandomAvatarConfig, parseAvatarUrl } from "./AvatarSelector";

interface PlayerSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournamentSlug: string;
  client: any;
  initialData?: {
    id: string;
    username: string;
    avatar: string;
  } | null;
}

export default function PlayerSetupModal({
  isOpen,
  onClose,
  onSuccess,
  tournamentSlug,
  client,
  initialData
}: PlayerSetupModalProps) {
  const [step, setStep] = useState<"avatar" | "username">("avatar");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(generateRandomAvatarConfig());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setUsername(initialData.username);
        if (initialData.avatar) {
          setAvatarConfig(parseAvatarUrl(initialData.avatar));
        }
        setStep("username");
      } else {
        setUsername("");
        setAvatarConfig(generateRandomAvatarConfig());
        setStep("avatar");
      }
      setError("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validateUsername = () => {
    const trimmed = username.trim();
    if (!trimmed) return "Kullanıcı adı boş olamaz";
    if (trimmed.length < 3) return "En az 3 karakter olmalı";
    if (!/^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ\s]+$/.test(trimmed)) return "Geçersiz karakterler";
    return null;
  };

  const handleComplete = async () => {
    const validationError = validateUsername();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const avatar = getAvatarUrl(avatarConfig);
      if (initialData) {
        await client.tournament.updateParticipant({
          participantId: initialData.id,
          username: username.trim(),
          avatar
        });
      } else {
        const manualId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await client.tournament.joinTournament({
          slug: tournamentSlug,
          userId: manualId,
          username: username.trim(),
          avatar,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "İşlem sırasında bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step === "avatar") {
      setStep("username");
    } else {
      handleComplete();
    }
  };

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-[#121216] w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Progress Bar */}
          <div className="flex gap-1.5 p-6 pb-0">
             <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 'avatar' ? 'w-12 bg-blue-500' : 'w-4 bg-white/10'}`} />
             <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 'username' ? 'w-12 bg-blue-500' : 'w-4 bg-white/10'}`} />
          </div>

          {/* Header */}
          <div className="p-8 text-center">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              {step === "avatar" 
                ? (initialData ? "Oyuncu Düzenle" : "Oyuncu Oluştur") 
                : "Oyuncu Adı"}
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
              {step === "avatar" 
                ? (initialData ? "Görünümünü güncelle" : "Oyuncu için bir avatar seçin") 
                : "Turnuvada görünecek oyuncu adını girin"}
            </p>
          </div>

          {/* Content */}
          <div className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar">
            {step === "avatar" ? (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                key="avatar-step"
              >
                <AvatarSelector avatarConfig={avatarConfig} onConfigChange={setAvatarConfig} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                key="username-step"
                className="flex flex-col items-center gap-8"
              >
                 <div className="w-24 h-24 bg-slate-900/50 rounded-full border-4 border-blue-500/20 p-1">
                    <img src={getAvatarUrl(avatarConfig)} className="w-full h-full object-contain rounded-full" />
                 </div>
                 <div className="w-full relative">
                    <input
                      autoFocus
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                      placeholder="Örn: EfsaneOyuncu"
                      className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-center text-xl font-bold text-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-700"
                    />
                    {error && (
                      <p className="absolute -bottom-6 left-0 right-0 text-center text-red-500 text-[10px] font-black uppercase tracking-widest">
                        {error}
                      </p>
                    )}
                 </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-3">
             {step === 'username' && (
               <button
                 onClick={() => setStep('avatar')}
                 className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-colors"
               >
                 <ChevronLeft size={24} />
               </button>
             )}
             <button
               onClick={handleNext}
               disabled={isSubmitting}
               className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
             >
               {isSubmitting ? (
                 <Loader2 size={24} className="animate-spin" />
               ) : (
                 <>
                   {step === 'avatar' ? 'Devam Et' : 'Tamamla'}
                   <ChevronRight size={24} />
                 </>
               )}
             </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
