"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
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
import { getAppRootUrl } from "@/lib/apps";

const client = createBrowserClient();

const STATUS_CONFIG: Record<feedback_board.FeedbackStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Beklemede", color: "text-zinc-500", bg: "bg-zinc-100", icon: Clock },
  planned: { label: "Planlandı", color: "text-blue-600", bg: "bg-blue-50", icon: Info },
  "in-progress": { label: "Yapılıyor", color: "text-amber-600", bg: "bg-amber-50", icon: Gear },
  completed: { label: "Tamamlandı", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
};

function FeedbackContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get("board") || "";
  const { user, isLoaded: isUserLoaded } = useUser();
  const [feedbacks, setFeedbacks] = useState<feedback_board.Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<feedback_board.Feedback | null>(null);
  const [businessName, setBusinessName] = useState("");

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

    setFeedbacks((prev) =>
      prev.map((f) => {
        if (f.id === feedbackId) {
          return {
            ...f,
            has_voted: !f.has_voted,
            vote_count: f.has_voted ? f.vote_count - 1 : f.vote_count + 1,
          };
        }
        return f;
      }),
    );

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
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
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

  const activeFeedbacks = filteredFeedbacks.filter((f) => f.status !== "completed");
  const completedFeedbacks = filteredFeedbacks.filter((f) => f.status === "completed");

  const feedbackListItems: Array<
    { type: "header" } | { type: "feedback"; feedback: feedback_board.Feedback }
  > = [
    ...activeFeedbacks.map((feedback) => ({ type: "feedback" as const, feedback })),
    ...(completedFeedbacks.length > 0 ? [{ type: "header" as const }] : []),
    ...completedFeedbacks.map((feedback) => ({ type: "feedback" as const, feedback })),
  ];

  if (!businessId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFBF9] px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
          <h1 className="text-lg font-black text-zinc-900 mb-2">Geçersiz Link</h1>
          <p className="text-sm text-zinc-500">Feedback board linkinde işletme ID&apos;si bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 font-sans">
      <Toaster position="top-center" />

      <main className="flex-1 px-4 py-6 mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button
            onClick={() => (window.location.href = getAppRootUrl())}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-all bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm text-xs font-bold cursor-pointer"
          >
            <SquaresFour size={16} weight="fill" />
            <span>Geri Dön</span>
          </button>

          {user && (
            <button
              onClick={() => setShowAddDrawer(true)}
              className="sm:hidden flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-100 text-xs font-black cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              <span>Yeni Ekle</span>
            </button>
          )}
        </div>

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
              className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black px-4 py-2 rounded-xl active:scale-95 transition-all items-center gap-1.5 shadow-lg shadow-indigo-100 cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              <span>YENİ EKLE</span>
            </button>
          )}
        </div>

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
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
              <CaretUp size={10} weight="bold" className="rotate-180" />
            </div>
          </div>
        </div>

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
            {feedbackListItems.map((item) =>
              item.type === "header" ? (
                <div
                  key="completed-header"
                  className={`${activeFeedbacks.length > 0 ? "pt-4 mt-1 border-t border-zinc-100" : "pb-1"}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tamamlananlar</p>
                </div>
              ) : (
                <motion.div
                  layout
                  key={item.feedback.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border border-zinc-100 hover:border-indigo-100 rounded-xl p-4 flex items-start gap-4 transition-all shadow-sm group"
                >
                  <button
                    onClick={() => handleToggleVote(item.feedback.id)}
                    className={`flex flex-col items-center justify-center w-14 min-h-[4rem] rounded-2xl border-2 bg-white transition-all shrink-0 px-2 py-2.5 gap-1 active:scale-[0.97] cursor-pointer ${
                      item.feedback.has_voted
                        ? "border-indigo-500 hover:border-indigo-600"
                        : "border-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    <CaretUp
                      size={22}
                      weight={item.feedback.has_voted ? "fill" : "bold"}
                      className={item.feedback.has_voted ? "text-indigo-600" : "text-zinc-500"}
                    />
                    <span
                      className={`text-base font-black tabular-nums leading-none ${
                        item.feedback.has_voted ? "text-indigo-600" : "text-zinc-900"
                      }`}
                    >
                      {item.feedback.vote_count}
                    </span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3 className="text-sm font-bold text-zinc-900 line-clamp-2 sm:truncate group-hover:text-indigo-600 transition-colors pr-1">
                        {item.feedback.title}
                      </h3>
                      <div className="hidden sm:flex items-center gap-1 shrink-0">
                        {item.feedback.is_owner && (
                          <>
                            <button
                              onClick={() => setEditingFeedback(item.feedback)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                              title="Düzenle"
                            >
                              <PencilSimple size={14} weight="bold" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.feedback.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Sil"
                            >
                              <Trash size={14} weight="bold" />
                            </button>
                          </>
                        )}
                        <div
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${STATUS_CONFIG[item.feedback.status].bg} ${STATUS_CONFIG[item.feedback.status].color}`}
                        >
                          <span>{STATUS_CONFIG[item.feedback.status].label}</span>
                        </div>
                      </div>
                      {item.feedback.is_owner && (
                        <div className="flex sm:hidden items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditingFeedback(item.feedback)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                            title="Düzenle"
                          >
                            <PencilSimple size={14} weight="bold" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.feedback.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Sil"
                          >
                            <Trash size={14} weight="bold" />
                          </button>
                        </div>
                      )}
                    </div>

                    {item.feedback.description && (
                      <p className="text-zinc-500 text-[11px] leading-relaxed mb-3 line-clamp-2 sm:line-clamp-1">
                        {item.feedback.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center">
                            {item.feedback.author_avatar ? (
                              <img
                                src={item.feedback.author_avatar}
                                alt={item.feedback.author_name || ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={10} className="text-zinc-400" />
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400 truncate">
                            {item.feedback.author_name || "Anonim"}
                          </span>
                        </div>

                        {item.feedback.category && (
                          <span className="text-[9px] font-black text-zinc-300 uppercase tracking-tighter shrink-0">
                            {item.feedback.category}
                          </span>
                        )}
                      </div>

                      <div
                        className={`sm:hidden flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider shrink-0 ${STATUS_CONFIG[item.feedback.status].bg} ${STATUS_CONFIG[item.feedback.status].color}`}
                      >
                        <span>{STATUS_CONFIG[item.feedback.status].label}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ),
            )}
          </div>
        )}
      </main>

      <Drawer.Root open={showAddDrawer} onOpenChange={setShowAddDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 max-h-[85dvh] outline-none z-50 max-w-lg mx-auto border-t border-zinc-200 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-10 h-1 rounded-full bg-zinc-200 mb-6" />
              <Drawer.Title className="text-xl font-black mb-1 tracking-tight text-zinc-900">Yeni Feedback</Drawer.Title>
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

      <Drawer.Root open={!!editingFeedback} onOpenChange={(open) => !open && setEditingFeedback(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[24px] fixed bottom-0 left-0 right-0 max-h-[85dvh] outline-none z-50 max-w-lg mx-auto border-t border-zinc-200 shadow-2xl">
            <div className="p-6 overflow-y-auto">
              <div className="mx-auto w-10 h-1 rounded-full bg-zinc-200 mb-6" />
              <Drawer.Title className="text-xl font-black mb-1 tracking-tight text-zinc-900">Feedback Düzenle</Drawer.Title>
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
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">Kategori</label>
        <div className="flex flex-wrap gap-1.5">
          {["Öneri", "Hata", "Geliştirme", "Diğer"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFormData({ ...formData, category: cat })}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                formData.category === cat
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-zinc-50 border-zinc-100 text-zinc-400 hover:border-indigo-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

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
        {loading
          ? isEdit
            ? "KAYDEDİLİYOR..."
            : "GÖNDERİLİYOR..."
          : isEdit
            ? "DEĞİŞİKLİKLERİ KAYDET"
            : "FEEDBACK GÖNDER"}
      </button>
    </form>
  );
}

function AddFeedbackForm({ businessId, onComplete }: { businessId: string; onComplete: () => void }) {
  return <FeedbackForm businessId={businessId} onComplete={onComplete} />;
}

export default function FeedbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
          <div className="w-12 h-12 border-4 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin" />
        </div>
      }
    >
      <FeedbackContent />
    </Suspense>
  );
}
