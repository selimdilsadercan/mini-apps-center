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
    <div className="min-h-screen bg-[#FAF9F7] text-gray-900 font-sans pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-lg mx-auto px-5 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-sm active:scale-95 transition-all hover:bg-gray-50 cursor-pointer"
          >
            <ArrowLeft size={20} weight="bold" />
          </button>
          <h1 className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px] text-gray-400">
            {choco.name}
          </h1>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-900 shadow-sm active:scale-95 transition-all hover:bg-gray-50 cursor-pointer"
          >
            <ShareNetwork size={20} weight="bold" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pt-24">
        <div className="flex flex-col gap-8">
          {/* Image Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square relative rounded-[2.5rem] overflow-hidden shadow-sm bg-white border border-gray-100"
          >
            <img 
              src={choco.image_url || "https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=2000&auto=format&fit=crop"} 
              alt={choco.name}
              className="w-full h-full object-cover"
            />
          </motion.div>

          {/* Info Section */}
          <div className="flex flex-col gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest">
                <Buildings size={14} weight="bold" />
                {choco.brand}
              </div>
              <h2 className="text-3xl font-[1000] tracking-tighter uppercase leading-none text-gray-900">
                {choco.name}
              </h2>
              {choco.category && (
                <div className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest mt-2">
                  <Tag size={14} weight="bold" />
                  {choco.category}
                </div>
              )}
            </div>

            {/* Rating Summary */}
            <div className="flex items-center gap-4 bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="flex flex-col items-center justify-center bg-yellow-50 size-16 rounded-2xl text-yellow-600">
                <Star size={24} weight="fill" />
                <span className="text-lg font-black leading-none mt-1">{choco.avg_rating.toFixed(1)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-tight text-gray-900">{choco.review_count} {lang === "tr" ? "Değerlendirme" : "Reviews"}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  {lang === "tr" ? "Kullanıcı ortalaması" : "User average"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleStateToggle("wishlist")}
                className={`flex flex-col items-center gap-2 p-4 rounded-[1.5rem] border transition-all cursor-pointer active:scale-95 ${
                  choco.user_state === "wishlist"
                    ? "bg-amber-50 text-amber-600 border-amber-100"
                    : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                }`}
              >
                <BookmarkSimple size={24} weight={choco.user_state === "wishlist" ? "fill" : "bold"} />
                <span className="text-[8px] font-black uppercase tracking-widest">{lang === "tr" ? "İstiyorum" : "Wishlist"}</span>
              </button>

              <button
                onClick={() => handleStateToggle("tried")}
                className={`flex flex-col items-center gap-2 p-4 rounded-[1.5rem] border transition-all cursor-pointer active:scale-95 ${
                  choco.user_state === "tried"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                }`}
              >
                <Check size={24} weight="bold" />
                <span className="text-[8px] font-black uppercase tracking-widest">{lang === "tr" ? "Denedim" : "Tried"}</span>
              </button>

              <button
                onClick={() => handleStateToggle("dislike")}
                className={`flex flex-col items-center gap-2 p-4 rounded-[1.5rem] border transition-all cursor-pointer active:scale-95 ${
                  choco.user_state === "dislike"
                    ? "bg-rose-50 text-rose-600 border-rose-100"
                    : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                }`}
              >
                <Prohibit size={24} weight="bold" />
                <span className="text-[8px] font-black uppercase tracking-widest">{lang === "tr" ? "Gizle" : "Hide"}</span>
              </button>

              <button
                onClick={() => {
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  setShowRatingModal(true);
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-[1.5rem] border transition-all cursor-pointer active:scale-95 ${
                  choco.user_rating && choco.user_rating > 0
                    ? "bg-yellow-50 text-yellow-600 border-yellow-100"
                    : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                }`}
              >
                <Star size={24} weight={choco.user_rating && choco.user_rating > 0 ? "fill" : "bold"} />
                <span className="text-[8px] font-black uppercase tracking-widest">
                  {choco.user_rating ? `${choco.user_rating} ★` : (lang === "tr" ? "Puanla" : "Rate")}
                </span>
              </button>
            </div>

            {/* Description */}
            <div className="space-y-3 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                {lang === "tr" ? "Hakkında" : "About"}
              </h3>
              <p className="text-sm leading-relaxed font-bold text-gray-600">
                {chocoDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-3 px-1">
            <ChatCircleText size={20} weight="bold" className="text-gray-900" />
            <h3 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.2em]">
              {lang === "tr" ? "Değerlendirmeler" : "Reviews"}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {choco.reviews && choco.reviews.length > 0 ? (
              choco.reviews.map((review) => (
                <div 
                  key={review.id} 
                  className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 font-black text-sm border border-gray-100">
                        {review.reviewer_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight text-gray-900">{review.reviewer_name}</span>
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">
                          {new Date(review.created_at).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-xl text-yellow-600 text-[10px] font-black border border-yellow-100/50">
                      <Star size={12} weight="fill" />
                      {review.rating}/10
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-xs font-bold text-gray-500 leading-relaxed pl-1">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-gray-200">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {lang === "tr" ? "Henüz yorum yapılmamış" : "No reviews yet"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
              onClick={() => setShowRatingModal(false)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative bg-[#FAF9F7] w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-12 shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setShowRatingModal(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 text-gray-900 cursor-pointer active:scale-95"
              >
                <X weight="bold" className="size-5" />
              </button>
   
              <h2 className="text-2xl font-[1000] text-gray-900 tracking-tighter uppercase leading-none mb-2 text-center">
                {lang === "tr" ? "Değerlendir" : "Rate"}
              </h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center mb-10">
                {choco.name}
              </p>

              <div className="space-y-10">
                <div className="flex flex-col items-center gap-6">
                  <div className="text-5xl font-[1000] text-gray-900 tracking-tighter">
                    {hoverRating || rating || 0}<span className="text-xl text-gray-300 ml-1">/10</span>
                  </div>
                  
                  <div 
                    className="flex justify-center gap-1 sm:gap-2"
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
                          weight={(hoverRating || rating) >= star ? "fill" : "bold"} 
                          className={`size-7 sm:size-8 ${(hoverRating || rating) >= star ? "text-yellow-400" : "text-gray-200"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleSubmitReview} 
                    disabled={isSubmitting || rating === 0}
                    className="w-full bg-gray-900 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (lang === "tr" ? "Gönderiliyor..." : "Submitting...") : (lang === "tr" ? "Değerlendirmeyi Kaydet" : "Save Rating")}
                  </button>

                  {choco.user_rating && choco.user_rating > 0 ? (
                    <button 
                      onClick={handleDeleteReview} 
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-rose-500 transition-all disabled:opacity-50 cursor-pointer"
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
