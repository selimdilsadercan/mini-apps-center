"use client";

import React, { useState, useEffect } from "react";
import { 
  Star, 
  ArrowLeft, 
  Check, 
  BookmarkSimple, 
  Prohibit,
  ChatCircleText,
  Tag,
  Buildings,
  ShareNetwork,
  X
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { chocolate_db } from "@/lib/client";
import { AuthModal } from "@/components/auth/AuthModal";
import toast from "react-hot-toast";

const client = createBrowserClient();

export default function ChocolateDetailClient({ initialChoco }: { initialChoco: chocolate_db.ChocolateDetail }) {
  const router = useRouter();
  const { locale: lang } = useLanguage();
  const { user, isLoaded: isUserLoaded } = useUser();
  
  const [choco, setChoco] = useState(initialChoco);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (showRatingModal) {
      setRating(choco.user_rating || 0);
      setHoverRating(0);
    }
  }, [showRatingModal, choco.user_rating]);

  const refreshData = async () => {
    try {
      const updated = await client.chocolate_db.getChocolate(initialChoco.id);
      setChoco(updated);
    } catch (err) {
      console.error("Failed to refresh chocolate data:", err);
    }
  };

  const handleStateToggle = async (state: "tried" | "wishlist" | "dislike") => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    const newState = choco.user_state === state ? "" : state;
    try {
      await client.chocolate_db.setUserState({
        userId: user.id,
        chocolateId: choco.id,
        state: newState as any
      });
      refreshData();
      toast.success(lang === "tr" ? "Durum güncellendi" : "State updated");
    } catch (err) {
      console.error("Failed to update user state:", err);
      toast.error(lang === "tr" ? "Bir hata oluştu" : "An error occurred");
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await client.chocolate_db.addReview({
        chocolate_id: choco.id,
        rating,
        reviewer_name: user?.fullName || user?.username || (lang === "tr" ? "Misafir" : "Guest"),
        userId: user?.id
      });
      setShowRatingModal(false);
      setRating(0);
      refreshData();
      toast.success(lang === "tr" ? "Puanınız kaydedildi" : "Rating saved");
    } catch (err) {
      console.error("Failed to add review:", err);
      toast.error(lang === "tr" ? "Puan kaydedilemedi" : "Failed to save rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await client.chocolate_db.deleteReview({
        chocolate_id: choco.id,
        userId: user.id
      });
      setShowRatingModal(false);
      setRating(0);
      refreshData();
      toast.success(lang === "tr" ? "Puanınız silindi" : "Rating deleted");
    } catch (err) {
      console.error("Failed to delete review:", err);
      toast.error(lang === "tr" ? "Puan silinemedi" : "Failed to delete rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: choco.name,
        text: `${choco.name} çikolatasını ChocolateDB'de incele!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(lang === "tr" ? "Link kopyalandı!" : "Link copied!");
    }
  };

  const chocoDesc = (lang === "tr" ? choco.description_tr : (choco.description_en || choco.description_tr)) || (lang === "tr" ? "Bu efsane lezzet henüz keşfedilmeyi bekliyor..." : "This legendary taste is waiting to be discovered...");

  return (
    <div className="min-h-screen bg-[#FDF5E6] dark:bg-[#1A0F0A] text-[#4A2C2A] dark:text-[#F3E5D8] font-sans pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#FDF5E6]/80 dark:bg-[#1A0F0A]/80 backdrop-blur-md border-b border-[#4A2C2A]/10 dark:border-white/10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-[#4A2C2A]/5 dark:hover:bg-white/5 transition-all text-[#4A2C2A] dark:text-[#F3E5D8] cursor-pointer"
          >
            <ArrowLeft size={24} weight="bold" />
          </button>
          <h1 className="text-sm font-black uppercase tracking-widest truncate max-w-[200px] sm:max-w-xs">
            {choco.name}
          </h1>
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-[#4A2C2A]/5 dark:hover:bg-white/5 transition-all text-[#4A2C2A] dark:text-[#F3E5D8] cursor-pointer"
          >
            <ShareNetwork size={24} weight="bold" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square relative rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-[#2A1812] border border-[#4A2C2A]/10 dark:border-white/10"
          >
            <img 
              src={choco.image_url || "https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=2000&auto=format&fit=crop"} 
              alt={choco.name}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Info Section */}
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-sm uppercase tracking-wider">
                <Buildings size={18} weight="fill" />
                {choco.brand}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight">
                {choco.name}
              </h2>
              {choco.category && (
                <div className="flex items-center gap-2 text-[#4A2C2A]/60 dark:text-[#F3E5D8]/60 font-bold text-xs uppercase tracking-widest">
                  <Tag size={16} weight="bold" />
                  {choco.category}
                </div>
              )}
            </div>

            {/* Rating Summary */}
            <div className="flex items-center gap-4 bg-white dark:bg-[#2A1812] p-4 rounded-2xl border border-[#4A2C2A]/5 dark:border-white/5 shadow-sm">
              <div className="flex flex-col items-center justify-center bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 size-16 rounded-xl text-[#D4AF37]">
                <Star size={24} weight="fill" />
                <span className="text-lg font-black leading-none mt-1">{choco.avg_rating.toFixed(1)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black">{choco.review_count} {lang === "tr" ? "Değerlendirme" : "Reviews"}</span>
                <span className="text-xs text-[#4A2C2A]/50 dark:text-[#F3E5D8]/50 font-medium">
                  {lang === "tr" ? "Çikolata severlerin ortalama puanı" : "Average score from chocolate lovers"}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#4A2C2A]/40 dark:text-[#F3E5D8]/40">
                {lang === "tr" ? "Hakkında" : "About"}
              </h3>
              <p className="text-base sm:text-lg leading-relaxed font-medium opacity-80">
                {chocoDesc}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleStateToggle("wishlist")}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                  choco.user_state === "wishlist"
                    ? "bg-amber-500 border-amber-500 text-white font-bold"
                    : "bg-white dark:bg-[#2A1812] border-[#4A2C2A]/10 dark:border-white/10 text-[#4A2C2A] dark:text-[#F3E5D8] hover:bg-amber-500/10"
                }`}
              >
                <BookmarkSimple size={24} weight={choco.user_state === "wishlist" ? "fill" : "regular"} />
                <span className="text-[10px] font-black uppercase tracking-tighter">{lang === "tr" ? "İstiyorum" : "Wishlist"}</span>
              </button>

              <button
                onClick={() => handleStateToggle("tried")}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                  choco.user_state === "tried"
                    ? "bg-emerald-600 border-emerald-600 text-white font-bold"
                    : "bg-white dark:bg-[#2A1812] border-[#4A2C2A]/10 dark:border-white/10 text-[#4A2C2A] dark:text-[#F3E5D8] hover:bg-emerald-600/10"
                }`}
              >
                <Check size={24} weight={choco.user_state === "tried" ? "bold" : "regular"} />
                <span className="text-[10px] font-black uppercase tracking-tighter">{lang === "tr" ? "Denedim" : "Tried"}</span>
              </button>

              <button
                onClick={() => handleStateToggle("dislike")}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                  choco.user_state === "dislike"
                    ? "bg-rose-500 border-rose-500 text-white font-bold"
                    : "bg-white dark:bg-[#2A1812] border-[#4A2C2A]/10 dark:border-white/10 text-[#4A2C2A] dark:text-[#F3E5D8] hover:bg-rose-500/10"
                }`}
              >
                <Prohibit size={24} weight={choco.user_state === "dislike" ? "fill" : "regular"} />
                <span className="text-[10px] font-black uppercase tracking-tighter">{lang === "tr" ? "Gizle" : "Hide"}</span>
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  setShowRatingModal(true);
                }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                  choco.user_rating && choco.user_rating > 0
                    ? "bg-[#D4AF37] border-[#D4AF37] text-[#1A0F0A] font-bold"
                    : "bg-white dark:bg-[#2A1812] border-[#4A2C2A]/10 dark:border-white/10 text-[#4A2C2A] dark:text-[#F3E5D8] hover:bg-[#D4AF37]/10"
                }`}
              >
                <Star size={24} weight={choco.user_rating && choco.user_rating > 0 ? "fill" : "regular"} />
                <span className="text-[10px] font-black uppercase tracking-tighter">
                  {choco.user_rating ? `${choco.user_rating} ★` : (lang === "tr" ? "Puanla" : "Rate")}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 space-y-8">
          <div className="flex items-center gap-3">
            <ChatCircleText size={32} weight="fill" className="text-[#D4AF37]" />
            <h3 className="text-2xl font-black uppercase tracking-tight">
              {lang === "tr" ? "Değerlendirmeler" : "Reviews"}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {choco.reviews && choco.reviews.length > 0 ? (
              choco.reviews.map((review) => (
                <div 
                  key={review.id} 
                  className="bg-white dark:bg-[#2A1812] p-6 rounded-3xl border border-[#4A2C2A]/5 dark:border-white/5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                        {review.reviewer_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black">{review.reviewer_name}</span>
                        <span className="text-[10px] text-[#4A2C2A]/40 dark:text-[#F3E5D8]/40 font-bold uppercase">
                          {new Date(review.created_at).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-[#D4AF37]/10 px-3 py-1 rounded-full text-[#D4AF37] text-sm font-black">
                      <Star size={16} weight="fill" />
                      {review.rating}/10
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm font-medium opacity-70 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white/50 dark:bg-[#2A1812]/50 rounded-3xl border-2 border-dashed border-[#4A2C2A]/10 dark:border-white/10">
                <p className="text-sm font-bold opacity-40">
                  {lang === "tr" ? "Henüz yorum yapılmamış. İlk yorumu sen yap!" : "No reviews yet. Be the first to review!"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#4A2C2A]/80 backdrop-blur-sm" 
              onClick={() => setShowRatingModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative bg-[#FDF5E6] dark:bg-[#1A0F0A] w-full max-w-md rounded-[2.5rem] p-8 sm:p-12 shadow-3xl overflow-hidden border border-[#D4AF37]/20"
            >
              <button 
                onClick={() => setShowRatingModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-[#4A2C2A]/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
              >
                <X weight="bold" className="size-6 text-[#4A2C2A] dark:text-[#F3E5D8]" />
              </button>
   
              <h2 className="text-xl sm:text-2xl font-black text-[#4A2C2A] dark:text-[#D4AF37] mb-2 text-center pr-8">
                {lang === "tr" ? "Değerlendir" : "Rate"}
              </h2>
              <p className="text-sm text-[#4A2C2A]/60 dark:text-[#F3E5D8]/60 text-center mb-8 font-bold">
                {choco.name}
              </p>

              <div className="space-y-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="text-4xl sm:text-5xl font-black text-[#D4AF37] drop-shadow-sm">
                    {hoverRating || rating || 0}<span className="text-xl sm:text-2xl opacity-40">/10</span>
                  </div>
                  
                  <div 
                    className="flex justify-center gap-1 sm:gap-1.5"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className="focus:outline-none transition-all hover:scale-125 cursor-pointer"
                      >
                        <Star 
                          weight={(hoverRating || rating) >= star ? "fill" : "regular"} 
                          className={`size-7 sm:size-9 ${(hoverRating || rating) >= star ? "text-[#D4AF37]" : "text-[#4A2C2A]/20 dark:text-white/10"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleSubmitReview} 
                    disabled={isSubmitting || rating === 0}
                    className="w-full bg-[#4A2C2A] dark:bg-[#D4AF37] text-white dark:text-[#4A2C2A] py-4 rounded-2xl font-black text-base sm:text-lg shadow-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (lang === "tr" ? "Gönderiliyor..." : "Submitting...") : (lang === "tr" ? "Değerlendirmeyi Kaydet" : "Save Rating")}
                  </button>

                  {choco.user_rating && choco.user_rating > 0 ? (
                    <button 
                      onClick={handleDeleteReview} 
                      disabled={isSubmitting}
                      className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 cursor-pointer border border-rose-500/20"
                    >
                      {lang === "tr" ? "Değerlendirmeyi Sil" : "Delete Rating"}
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        title="ChocolateDB'ye Hoş Geldiniz"
        subtitle="Çikolataları puanlamak, yorumlamak ve kendi arşivinizi oluşturmak için giriş yapmalısınız."
      />
    </div>
  );
}
