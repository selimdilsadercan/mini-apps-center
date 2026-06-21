"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useParams, useRouter } from "next/navigation";
import {
  ChatTeardropDots,
  CaretUp,
  Trash,
  CaretLeft,
  MagnifyingGlass,
  Funnel,
  User,
  Clock,
  CheckCircle,
  Gear,
  Info,
  Code,
  Copy,
  Check,
  Share,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { feedback, feedback_board } from "@/lib/client";

const client = createBrowserClient();

const STATUS_CONFIG: Record<feedback_board.FeedbackStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Beklemede", color: "text-zinc-500", bg: "bg-zinc-100", icon: Clock },
  planned: { label: "Planlandı", color: "text-blue-600", bg: "bg-blue-50", icon: Info },
  'in-progress': { label: "Yapılıyor", color: "text-amber-600", bg: "bg-amber-50", icon: Gear },
  completed: { label: "Tamamlandı", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
};

export default function FeedbackBoardAdminPage() {
  const { id: businessId } = useParams() as { id: string };
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<feedback_board.Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showShareDrawer, setShowShareDrawer] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load feedbacks
  useEffect(() => {
    if (isUserLoaded && businessId) {
      fetchFeedbacks();
    }
  }, [isUserLoaded, user, businessId]);

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

  const handleStatusChange = async (feedbackId: string, newStatus: feedback_board.FeedbackStatus) => {
    if (!user) return;

    // Optimistic update
    setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, status: newStatus } : f));

    try {
      await client.feedback.updateStatus({ userId: user.id, feedbackId, status: newStatus });
      toast.success("Durum güncellendi.");
    } catch (error) {
      console.error("updateStatus error:", error);
      fetchFeedbacks();
      toast.error("İşlem başarısız.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await client.feedback.deleteFeedback(id, { userId: user.id });
      setFeedbacks(feedbacks.filter((f) => f.id !== id));
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

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/f/${businessId}` : "";
  const iframeCode = `<iframe src="${publicUrl}" width="100%" height="600px" frameborder="0"></iframe>`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFBF9] text-zinc-900 font-sans">
      <Toaster position="top-center" />

      <main className="flex-1 px-4 py-8 pb-32 mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => router.push(`/dashboard/${businessId}`)}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-all bg-white px-3.5 py-2 rounded-2xl border border-zinc-200 shadow-sm text-xs font-black uppercase tracking-widest cursor-pointer"
          >
            <CaretLeft size={16} weight="bold" />
            <span>Geri Dön</span>
          </button>

          <button
            onClick={() => setShowShareDrawer(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-black px-4 py-2.5 rounded-2xl active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-violet-200 uppercase tracking-widest cursor-pointer"
          >
            <Share size={18} weight="bold" />
            <span>Paylaş / Entegre Et</span>
          </button>
        </div>

        {/* Title */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 flex items-center gap-3">
            <ChatTeardropDots size={40} className="text-violet-600" weight="fill" />
            Feedback Yönetimi
          </h1>
          <p className="text-zinc-500 text-sm mt-2 font-medium">Müşterilerinizden gelen önerileri yönetin, durumlarını güncelleyin.</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Feedback ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-[1.2rem] text-sm focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative min-w-[180px]">
            <Funnel size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-3 bg-white border border-zinc-200 rounded-[1.2rem] text-sm focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 outline-none appearance-none cursor-pointer shadow-sm font-bold text-zinc-600"
            >
              <option value="all">Tüm Durumlar</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Yükleniyor</span>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-16 text-center shadow-sm">
            <ChatTeardropDots size={64} className="mx-auto text-zinc-100 mb-4" />
            <h3 className="text-lg font-black text-zinc-800">Henüz feedback yok</h3>
            <p className="text-zinc-400 text-sm mt-1 font-medium">Müşterileriniz feedback verdiğinde burada görünecek.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map((f) => (
              <motion.div
                layout
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-zinc-200 hover:border-violet-200 rounded-[1.8rem] p-6 flex items-center gap-6 transition-all shadow-sm group"
              >
                {/* Vote Display — PH layout */}
                <div className="flex flex-col items-center justify-center w-14 min-h-[4rem] rounded-2xl border-2 border-zinc-300 bg-white shrink-0 px-2 py-2.5 gap-1">
                  <CaretUp size={22} weight="bold" className="text-zinc-500" />
                  <span className="text-base font-black tabular-nums leading-none text-zinc-900">{f.vote_count}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-xl font-black text-zinc-900 truncate group-hover:text-violet-600 transition-colors">
                      {f.title}
                    </h3>
                    
                    {/* Status Dropdown for Admin */}
                    <div className="relative">
                      <select
                        value={f.status}
                        onChange={(e) => handleStatusChange(f.id, e.target.value as feedback_board.FeedbackStatus)}
                        className={`pl-3 pr-8 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border-none outline-none appearance-none cursor-pointer shadow-sm ${STATUS_CONFIG[f.status].bg} ${STATUS_CONFIG[f.status].color}`}
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                      <div className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${STATUS_CONFIG[f.status].color}`}>
                        <CaretUp size={10} weight="bold" className="rotate-180" />
                      </div>
                    </div>
                  </div>
                  
                  {f.description && (
                    <p className="text-zinc-500 text-sm leading-relaxed mb-5 line-clamp-2 font-medium">
                      {f.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center">
                          {f.author_avatar ? (
                            <img src={f.author_avatar} alt={f.author_name || ""} className="w-full h-full object-cover" />
                          ) : (
                            <User size={14} className="text-zinc-400" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-zinc-600">{f.author_name || "Anonim"}</span>
                      </div>
                      
                      {f.category && (
                        <span className="text-[10px] font-black bg-zinc-100 text-zinc-400 px-2.5 py-1 rounded-lg uppercase tracking-tighter">
                          {f.category}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(f.id)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                      title="Sil"
                    >
                      <Trash size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Share / Integration Drawer */}
      <Drawer.Root open={showShareDrawer} onOpenChange={setShowShareDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-50 max-w-2xl mx-auto border-t border-zinc-200 shadow-2xl">
            <div className="p-8 overflow-y-auto">
              <div className="mx-auto w-12 h-1.5 rounded-full bg-zinc-200 mb-8" />
              
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600">
                  <Share size={28} weight="bold" />
                </div>
                <div>
                  <Drawer.Title className="text-2xl font-black tracking-tight text-zinc-900">
                    Paylaş ve Entegre Et
                  </Drawer.Title>
                  <p className="text-sm text-zinc-500 font-medium">Feedback board'unuzu müşterilerinizle buluşturun.</p>
                </div>
              </div>

              <div className="space-y-8 mt-10">
                {/* Public Link */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <span>Genel Link</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[8px]">AKTİF</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold text-zinc-600 truncate">
                      {publicUrl}
                    </div>
                    <button
                      onClick={() => copyToClipboard(publicUrl)}
                      className="w-12 h-12 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-violet-600 hover:border-violet-200 transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      {copied ? <Check size={20} weight="bold" className="text-emerald-500" /> : <Copy size={20} weight="bold" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-medium">Bu linki doğrudan müşterilerinize gönderebilir veya sosyal medya hesaplarınızda paylaşabilirsiniz.</p>
                </div>

                {/* Iframe Integration */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Code size={16} weight="bold" />
                    <span>Web Sitenize Gömün (Iframe)</span>
                  </label>
                  <div className="relative">
                    <pre className="bg-zinc-900 text-zinc-300 p-5 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-zinc-800">
                      {iframeCode}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(iframeCode)}
                      className="absolute right-3 top-3 w-10 h-10 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 border border-zinc-700 cursor-pointer"
                    >
                      {copied ? <Check size={18} weight="bold" className="text-emerald-400" /> : <Copy size={18} weight="bold" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-medium">Bu kodu web sitenizin HTML yapısına yapıştırarak feedback board'u kendi sitenizde görüntüleyebilirsiniz.</p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setShowShareDrawer(false)}
                    className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-2xl transition-all active:scale-[0.98] text-sm uppercase tracking-widest shadow-xl cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
