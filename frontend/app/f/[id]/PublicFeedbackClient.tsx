"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import {
  ChatTeardropDots,
  Plus,
  CaretUp,
  MagnifyingGlass,
  User,
  Clock,
  CheckCircle,
  Gear,
  Info,
  SquaresFour,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { feedback_board } from "@/lib/client";

const client = createBrowserClient();
import { getAppRootUrl } from "@/lib/apps";

const STATUS_CONFIG: Record<feedback_board.FeedbackStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Beklemede", color: "text-zinc-500", bg: "bg-zinc-100", icon: Clock },
  planned: { label: "Planlandı", color: "text-blue-600", bg: "bg-blue-50", icon: Info },
  'in-progress': { label: "Yapılıyor", color: "text-amber-600", bg: "bg-amber-50", icon: Gear },
  completed: { label: "Tamamlandı", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
};

export default function PublicFeedbackClient({ businessId }: { businessId: string }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [feedbacks, setFeedbacks] = useState<feedback_board.Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<feedback_board.Feedback | null>(null);
  const [businessName, setBusinessName] = useState("");

  // Load feedbacks & business info
  useEffect(() => {
    if (isUserLoaded && businessId) {
      fetchFeedbacks();
      fetchBusinessInfo();
    }
  }, [isUserLoaded, user, businessId]);

  const fetchBusinessInfo = async () => {
    try {
      const res = await client.business.getBusiness(businessId);
      if (res.business) {
        setBusinessName(res.business.name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const userId = user?.id || "anonymous";
      const res = await client.feedback.getFeedbacks(userId, businessId);
      setFeedbacks(res.feedbacks || []);
    } catch (error) {
      console.error("fetchFeedbacks error:", error);
      toast.error("Feedbackler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVote = async (feedbackId: string) => {
    if (!user) {
      toast.error("Oy vermek için giriş yapmalısınız.");
      return;
    }

    setFeedbacks(prev => prev.map(f => {
      if (f.id === feedbackId) {
        return {
          ...f,
          has_voted: !f.has_voted,
          vote_count: f.has_voted ? f.vote_count - 1 : f.vote_count + 1
        };
      }
      return f;
    }));

    try {
      await client.feedback.toggleVote({ userId: user.id, feedbackId });
    } catch (error) {
      console.error("toggleVote error:", error);
      fetchFeedbacks();
      toast.error("İşlem başarısız.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!confirm("Bu feedback'i silmek istediğine emin misin?")) return;

    try {
      await client.feedback.deleteFeedback(id, { userId: user.id });
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      toast.success("Feedback silindi.");
    } catch (error) {
      toast.error("Silme işlemi başarısız.");
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" ? true : f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 font-sans">
      <Toaster position="top-center" />

      <main className="flex-1 px-4 py-6 mx-auto w-full max-w-2xl">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => window.location.href = getAppRootUrl()}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-all bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm text-xs font-bold cursor-pointer"
          >
            <SquaresFour size={16} weight="fill" />
            <span>Geri Dön</span>
          </button>
        </div>

        {/* Compact Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
              <ChatTeardropDots size={28} weight="fill" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-tight">{businessName || "Feedback Board"}</h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Öneri ve Geri Bildirimler</p>
            </div>
          </div>

          {user && (
            <button
              onClick={() => setShowAddDrawer(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black px-4 py-2 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-100 cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              <span>YENİ EKLE</span>
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="relative min-w-[120px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none cursor-pointer font-bold text-zinc-500"
            >
              <option value="all">Tümü</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
              <CaretUp size={10} weight="bold" className="rotate-180" />
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Yükleniyor</span>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="bg-zinc-50/50 border border-dashed border-zinc-200 rounded-2xl p-10 text-center">
            <p className="text-zinc-400 text-xs font-bold">Henüz geri bildirim bulunmuyor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFeedbacks.map((f) => (
              <motion.div
                layout
                key={f.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border border-zinc-100 hover:border-indigo-100 rounded-xl p-4 flex items-center gap-4 transition-all shadow-sm group"
              >
                {/* Vote Button — PH layout: bordered pill, outline arrow, count below */}
                <button
                  onClick={() => handleToggleVote(f.id)}
                  className={`flex flex-col items-center justify-center w-14 min-h-[4rem] rounded-2xl border-2 bg-white transition-all shrink-0 px-2 py-2.5 gap-1 active:scale-[0.97] cursor-pointer ${
                    f.has_voted
                      ? "border-indigo-500 hover:border-indigo-600"
                      : "border-zinc-300 hover:border-zinc-400"
                  }`}
                >
                  <CaretUp
                    size={22}
                    weight={f.has_voted ? "fill" : "bold"}
                    className={f.has_voted ? "text-indigo-600" : "text-zinc-500"}
                  />
                  <span
                    className={`text-base font-black tabular-nums leading-none ${
                      f.has_voted ? "text-indigo-600" : "text-zinc-900"
                    }`}
                  >
                    {f.vote_count}
                  </span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">
                      {f.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {f.is_owner && (
                        <>
                          <button
                            onClick={() => setEditingFeedback(f)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                            title="Düzenle"
                          >
                            <PencilSimple size={14} weight="bold" />
                          </button>
                          <button
                            onClick={() => handleDelete(f.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Sil"
                          >
                            <Trash size={14} weight="bold" />
                          </button>
                        </>
                      )}
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${STATUS_CONFIG[f.status].bg} ${STATUS_CONFIG[f.status].color}`}>
                        <span>{STATUS_CONFIG[f.status].label}</span>
                      </div>
                    </div>
                  </div>
                  
                  {f.description && (
                    <p className="text-zinc-500 text-[11px] leading-relaxed mb-3 line-clamp-1">
                      {f.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center">
                        {f.author_avatar ? (
                          <img src={f.author_avatar} alt={f.author_name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <User size={10} className="text-zinc-400" />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400">{f.author_name || "Anonim"}</span>
                    </div>
                    
                    {f.category && (
                      <span className="text-[9px] font-black text-zinc-300 uppercase tracking-tighter">
                        {f.category}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Add Drawer */}
      <Drawer.Root open={showAddDrawer} onOpenChange={setShowAddDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 max-h-[85dvh] outline-none z-50 max-w-lg mx-auto border-t border-zinc-200 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-10 h-1 rounded-full bg-zinc-200 mb-6" />
              <Drawer.Title className="text-xl font-black mb-1 tracking-tight text-zinc-900">
                Yeni Feedback
              </Drawer.Title>
              <Drawer.Description className="text-xs text-zinc-400 mb-6 font-bold uppercase tracking-wider">
                Önerinizi bizimle paylaşın
              </Drawer.Description>
              
              <AddFeedbackForm 
                businessId={businessId}
                onComplete={() => {
                  setShowAddDrawer(false);
                  fetchFeedbacks();
                }} 
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Edit Drawer */}
      <Drawer.Root open={!!editingFeedback} onOpenChange={(open) => !open && setEditingFeedback(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 max-h-[85dvh] outline-none z-50 max-w-lg mx-auto border-t border-zinc-200 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-10 h-1 rounded-full bg-zinc-200 mb-6" />
              <Drawer.Title className="text-xl font-black mb-1 tracking-tight text-zinc-900">
                Feedback Düzenle
              </Drawer.Title>
              <Drawer.Description className="text-xs text-zinc-400 mb-6 font-bold uppercase tracking-wider">
                Yazdığınız geri bildirimi güncelleyin
              </Drawer.Description>

              {editingFeedback && (
                <FeedbackForm
                  businessId={businessId}
                  feedback={editingFeedback}
                  onComplete={() => {
                    setEditingFeedback(null);
                    fetchFeedbacks();
                  }}
                />
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

function FeedbackForm({
  businessId,
  feedback,
  onComplete,
}: {
  businessId: string;
  feedback?: feedback_board.Feedback;
  onComplete: () => void;
}) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: feedback?.title || "",
    description: feedback?.description || "",
    category: feedback?.category || "Öneri",
  });

  const isEdit = !!feedback;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.title.trim()) {
      toast.error("Lütfen bir başlık girin.");
      return;
    }

    try {
      setLoading(true);
      if (isEdit) {
        await client.feedback.updateFeedback({
          userId: user.id,
          feedbackId: feedback.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
        });
        toast.success("Feedback güncellendi!");
      } else {
        await client.feedback.addFeedback({
          userId: user.id,
          businessId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
        });
        toast.success("Feedback başarıyla eklendi!");
      }
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      <div>
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">Başlık</label>
        <input
          required
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Örn: Karanlık mod desteği gelsin"
          className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
        />
      </div>

      <div>
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">Kategori</label>
        <div className="flex flex-wrap gap-1.5">
          {["Öneri", "Hata", "Geliştirme", "Diğer"].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setFormData({ ...formData, category: cat })}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                formData.category === cat
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:border-indigo-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">Açıklama</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Önerinizi detaylandırın..."
          rows={3}
          className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-lg shadow-indigo-100 active:scale-[0.98] cursor-pointer"
      >
        {loading ? (isEdit ? "KAYDEDİLİYOR..." : "GÖNDERİLİYOR...") : (isEdit ? "DEĞİŞİKLİKLERİ KAYDET" : "FEEDBACK GÖNDER")}
      </button>
    </form>
  );
}

function AddFeedbackForm({ businessId, onComplete }: { businessId: string, onComplete: () => void }) {
  return <FeedbackForm businessId={businessId} onComplete={onComplete} />;
}
