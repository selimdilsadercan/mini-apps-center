"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import {
  PiggyBank,
  ArrowLeft,
  Plus,
  CheckCircle,
  TrendDown,
  Coins,
  Sparkle,
  Globe,
  User,
  Clock,
  ChatCircleDots,
  X,
  Spinner,
  CreditCard,
  PencilSimple,
  Trash
} from "@phosphor-icons/react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { Drawer } from "vaul";
import { createBrowserClient } from "@/lib/api";
import { SAVING_CHALLENGES, Category, ChallengeItem, Metric } from "./data";
import { useTranslations, useLanguage } from "@/contexts/LanguageContext";

const client = createBrowserClient();

export default function TasarrufChallengesPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const t = useTranslations("tasarruf");
  const { locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<"challenges" | "feed">("challenges");
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeItem | null>(null);

  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    userTotalSavings: 0,
    userMonthSavings: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialPostChallenge, setInitialPostChallenge] = useState<ChallengeItem | undefined>(undefined);
  const [editingPost, setEditingPost] = useState<any | null>(null);

  // Smart Header Logic
  const [showHeader, setShowHeader] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 100) {
      setShowHeader(false);
    } else {
      setShowHeader(true);
    }
  });

  useEffect(() => {
    if (isUserLoaded) {
      fetchData();
    }
  }, [isUserLoaded, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const promises: Promise<any>[] = [
        client.feed.getEventsByApp("tasarruf-challenges")
      ];

      if (user) {
        promises.push(client.tasarruf_challenges.getStats(user.id));
      }

      const [feedRes, statsRes] = await Promise.all(promises);

      const mappedPosts = (feedRes.events || []).map((evt: any) => ({
        id: evt.id,
        userId: evt.userId,
        userName: evt.username || "Anonim",
        userImage: evt.userAvatar,
        description: evt.payload?.description || "",
        amount: Number(evt.payload?.amount || 0),
        category: evt.payload?.category || "",
        createdAt: evt.createdAt
      }));

      setFeedPosts(mappedPosts);
      if (statsRes) setStats(statsRes);
    } catch (error) {
      console.error("fetchData error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isUserLoaded) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <main className="flex-1 flex items-center justify-center">
          <Spinner size={32} className="text-green-500 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 pb-32">
      <Toaster position="top-center" />

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-100/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-emerald-100/20 blur-[120px] rounded-full"></div>
      </div>

      <main className="flex-1 px-4 max-w-md mx-auto w-full pt-28">
        {/* Navigation & Header */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: showHeader ? 0 : -100 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed top-0 left-0 right-0 z-40 bg-[#FAF9F7]/80 backdrop-blur-lg border-b border-gray-100/50"
        >
          <header className="flex items-center justify-between max-w-md mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = getAppRootUrl()}
                className="p-2 -ml-2 hover:bg-gray-150 rounded-full transition-colors active:scale-95"
              >
                <ArrowLeft size={24} color="#374151" />
              </button>
              <div>
                <h1 className="text-2xl font-[1000] text-gray-900 tracking-tight leading-none">
                  {t("headerTitle")}
                </h1>
                <p className="text-xs text-gray-400 font-medium mt-1">{t("headerSubtitle")}</p>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-green-100 transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={16} weight="bold" />
              {t("share")}
            </button>
          </header>
        </motion.div>

        {/* Stats Section (Subtle) */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Coins size={14} className="text-green-600" weight="bold" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t("yourSavings")}</span>
            </div>
            <div className="text-xl font-black text-gray-900">{stats.userTotalSavings.toLocaleString()}₺</div>
          </div>
          <div className="bg-white border border-gray-150 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-blue-600" weight="bold" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t("communitySavings")}</span>
            </div>
            <div className="text-xl font-black text-gray-900">{stats.userMonthSavings.toLocaleString()}₺</div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} className="text-green-600 animate-spin" />
          </div>
        ) : activeTab === "challenges" ? (
          <>
            {/* Categories Grid (Like Ne Yapsak) */}
            <div className="space-y-8">
              {SAVING_CHALLENGES.map((cat) => (
                <div key={cat.category} className="space-y-3">
                  <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider px-1">
                    {t(`categories.${cat.category}` as any)}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {cat.items.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedChallenge(item)}
                        className="flex items-center gap-2.5 p-3.5 bg-white border border-gray-150 hover:bg-gray-50 rounded-2xl text-left transition-all text-xs font-bold cursor-pointer active:scale-95 shadow-sm"
                      >
                        <span className="text-lg shrink-0">{item.emoji}</span>
                        <span className="flex-1 leading-tight">{t(`challenges.${item.id}.label` as any) || item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {feedPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                  <ChatCircleDots size={36} weight="duotone" />
                </div>
                <h2 className="font-extrabold text-lg text-gray-800 mb-2">{t("noPostsTitle")}</h2>
                <p className="text-gray-400 text-xs leading-relaxed max-w-[280px] mb-8">
                  {t("noPostsDescription")}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="py-3.5 px-6 bg-white hover:bg-gray-50 border border-gray-150 shadow-sm text-gray-700 rounded-2xl font-bold text-sm transition-all active:scale-95 cursor-pointer"
                >
                  {t("shareFirstSaving")}
                </button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {feedPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-5 border border-gray-150 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden border border-gray-150">
                        {post.userImage ? (
                          <img src={post.userImage} alt={post.userName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50"><User size={20} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-gray-900 truncate uppercase tracking-wider">{post.userName === "Anonim" ? t("anonymous") : post.userName}</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} /> {new Date(post.createdAt).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US")}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {user && post.userId === user.id && (
                          <button
                            onClick={() => {
                              setEditingPost(post);
                              setShowAddModal(true);
                            }}
                            className="p-2 hover:bg-gray-50 active:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-gray-200/50"
                            title={t("editPost")}
                          >
                            <PencilSimple size={15} weight="bold" />
                          </button>
                        )}
                        <div className="bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                          <div className="text-[11px] font-black text-green-600">+{post.amount}₺</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-700 leading-relaxed mb-3">{post.description}</p>
                    {post.category && (
                      <div className="inline-block px-2.5 py-1 bg-gray-100 rounded-lg text-[8px] font-black text-gray-400 uppercase tracking-widest">
                        {post.category}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </main>

      {/* CREATE DRAWER */}
      <Drawer.Root open={showAddModal} onOpenChange={(open) => {
        setShowAddModal(open);
        if (!open) {
          setInitialPostChallenge(undefined);
          setEditingPost(null);
        }
      }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[92dvh] outline-none z-[70] max-w-md mx-auto border-t border-gray-100 shadow-2xl flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto flex flex-col">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mb-4" />

              <header className="flex justify-between items-center mb-6 shrink-0">
                <Drawer.Title className="font-black text-xl text-gray-900">
                  {editingPost ? t("edit") : t("share")}
                </Drawer.Title>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setInitialPostChallenge(undefined);
                    setEditingPost(null);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                >
                  <X size={20} weight="bold" />
                </button>
              </header>

              <AddPostForm
                onComplete={() => {
                  setShowAddModal(false);
                  setInitialPostChallenge(undefined);
                  setEditingPost(null);
                  fetchData();
                }}
                initialChallenge={initialPostChallenge}
                editingPost={editingPost}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* CHALLENGE DETAILS DRAWER */}
      <Drawer.Root open={!!selectedChallenge} onOpenChange={(open) => !open && setSelectedChallenge(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-white rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-[70] max-w-md mx-auto border-t border-gray-100 shadow-2xl flex flex-col">
            {selectedChallenge && (
              <div className="p-6 flex-1 overflow-y-auto flex flex-col">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mb-4" />

                <header className="flex justify-between items-center mb-6 shrink-0">
                  <Drawer.Title className="font-black text-xl text-gray-900">{t("savingSuggestion")}</Drawer.Title>
                  <button
                    onClick={() => setSelectedChallenge(null)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                  >
                    <X size={20} weight="bold" />
                  </button>
                </header>

                <div className="flex items-center gap-3.5 p-4 bg-gray-50 border border-gray-150 rounded-2xl mb-6 shrink-0">
                  <span className="text-2xl">{selectedChallenge.emoji}</span>
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">{t("challengeTitle")}</span>
                    <span className="text-sm font-bold text-gray-800">{t(`challenges.${selectedChallenge.id}.label` as any) || selectedChallenge.label}</span>
                  </div>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block">{t("whatCanYouDo")}</label>
                  <p className="text-sm font-bold text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    {t(`challenges.${selectedChallenge.id}.description` as any) || selectedChallenge.description}
                  </p>

                  {/* PROMOTIONAL CARD: BOTTLE RETURN / DOA */}
                  {selectedChallenge.id === "bottle_return" && (
                    <a
                      href={locale === "en" ? "https://doa.gov.tr/en" : "https://doa.gov.tr/"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-teal-50/30 p-4 rounded-3xl border border-emerald-100 hover:border-emerald-250 transition-all active:scale-[0.98] group cursor-pointer shadow-sm"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-emerald-100/50 overflow-hidden p-1.5">
                        <img 
                          src="https://play-lh.googleusercontent.com/Wi0xEctzBEAVgEIQdvVWwdWt83v57qA4bOR_B164pzyXxnXD8nmfDXqJPH6Y5P02A6Y=w240-h480-rw" 
                          alt="DOA" 
                          className="w-full h-full object-contain rounded-xl" 
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const p = e.currentTarget.parentElement;
                            if (p) p.innerHTML = "<span class='text-2xl'>♻️</span>";
                          }} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-emerald-900 uppercase tracking-tight">{t("doaTitle")}</h4>
                        <p className="text-[10px] font-bold text-emerald-700/70 leading-relaxed mt-0.5">
                          {t("doaDescription")}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/80 group-hover:bg-emerald-50 border border-emerald-100/20 group-hover:border-emerald-200/50 transition-all shrink-0">
                        <ArrowLeft size={14} className="text-emerald-600 rotate-180" weight="bold" />
                      </div>
                    </a>
                  )}

                  {/* PROMOTIONAL CARD: SUBCENTER */}
                  {selectedChallenge.id === "subscription_cancelled" && (
                    <button
                      onClick={() => {
                        setSelectedChallenge(null);
                        router.push("/apps/subcenter");
                      }}
                      className="flex items-center gap-4 bg-gradient-to-br from-blue-50 to-indigo-50/30 p-4 rounded-3xl border border-blue-100 hover:border-blue-250 transition-all active:scale-[0.98] group cursor-pointer shadow-sm text-left w-full"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                        <CreditCard size={24} className="text-blue-600" weight="duotone" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-blue-900 uppercase tracking-tight">{t("subcenterTitle")}</h4>
                        <p className="text-[10px] font-bold text-blue-700/70 leading-relaxed mt-0.5">
                          {t("subcenterDescription")}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/80 group-hover:bg-blue-50 border border-blue-100/20 group-hover:border-blue-200/50 transition-all shrink-0">
                        <ArrowLeft size={14} className="text-blue-600 rotate-180" weight="bold" />
                      </div>
                    </button>
                  )}
                </div>

                <div className="pt-6 shrink-0">
                  <button
                    onClick={() => {
                      setInitialPostChallenge(selectedChallenge);
                      setSelectedChallenge(null);
                      setShowAddModal(true);
                    }}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-green-100"
                  >
                    <Plus size={18} weight="bold" />
                    {t("iDidThis")}
                  </button>
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* CUSTOM APP BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-md mx-auto px-6 py-2 flex items-center justify-around w-full">
          <button
            onClick={() => setActiveTab("challenges")}
            className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${activeTab === "challenges" ? "scale-105" : "opacity-40 hover:opacity-100"
              }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === "challenges" ? "bg-green-50" : "bg-transparent"
              }`}>
              <Sparkle
                size={22}
                weight={activeTab === "challenges" ? "fill" : "bold"}
                className={activeTab === "challenges" ? "text-green-600" : "text-gray-900"}
              />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-wider ${activeTab === "challenges" ? "text-green-600" : "text-gray-500"
              }`}>
              {t("challengesTab")}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("feed")}
            className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${activeTab === "feed" ? "scale-105" : "opacity-40 hover:opacity-100"
              }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${activeTab === "feed" ? "bg-green-50" : "bg-transparent"
              }`}>
              <ChatCircleDots
                size={22}
                weight={activeTab === "feed" ? "fill" : "bold"}
                className={activeTab === "feed" ? "text-green-600" : "text-gray-900"}
              />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-wider ${activeTab === "feed" ? "text-green-600" : "text-gray-500"
              }`}>
              {t("inspiration")}
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function AddPostForm({ 
  onComplete, 
  initialChallenge, 
  editingPost 
}: { 
  onComplete: () => void, 
  initialChallenge?: ChallengeItem, 
  editingPost?: any 
}) {
  const { user } = useUser();
  const t = useTranslations("tasarruf");
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeItem | null>(() => {
    if (initialChallenge) return initialChallenge;
    if (editingPost) {
      for (const cat of SAVING_CHALLENGES) {
        const found = cat.items.find(item => item.label === editingPost.category);
        if (found) return found;
      }
    }
    return null;
  });
  const [metricValues, setMetricValues] = useState<Record<string, string>>({});
  const [description, setDescription] = useState(editingPost ? editingPost.description : "");
  const [amount, setAmount] = useState(editingPost ? editingPost.amount.toString() : "");
  const [loading, setLoading] = useState(false);
  const [showOptionModal, setShowOptionModal] = useState(false);

  useEffect(() => {
    if (initialChallenge) {
      setSelectedChallenge(initialChallenge);
    }
  }, [initialChallenge]);

  useEffect(() => {
    if (editingPost) {
      setDescription(editingPost.description);
      setAmount(editingPost.amount.toString());
    }
  }, [editingPost]);

  // Update description and amount when metrics or challenge changes
  useEffect(() => {
    if (!selectedChallenge) return;

    // Skip template auto-generation on edit mount to preserve user's edited description
    if (editingPost && Object.keys(metricValues).length === 0) {
      return;
    }

    let newDesc = t(`challenges.${selectedChallenge.id}.postTemplate` as any) || selectedChallenge.postTemplate;

    // Replace primary metric
    const primaryKey = selectedChallenge.primaryMetric.key;
    const primaryVal = metricValues[primaryKey] || "";
    newDesc = newDesc.replace(`{${primaryKey}}`, primaryVal || `[${t(`challenges.${selectedChallenge.id}.primaryMetric.label` as any) || selectedChallenge.primaryMetric.label}]`);

    // Replace secondary metrics
    let foundAmount = "";
    if (selectedChallenge.primaryMetric.inputType === "money") {
      foundAmount = primaryVal;
    }

    selectedChallenge.secondaryMetrics?.forEach(m => {
      const val = metricValues[m.key] || "";
      newDesc = newDesc.replace(`{${m.key}}`, val || `[${t(`challenges.${selectedChallenge.id}.secondaryMetrics.${m.key}.label` as any) || m.label}]`);
      if (m.inputType === "money" && val) {
        foundAmount = val;
      }
    });

    setAmount(foundAmount);
    setDescription(newDesc);
  }, [selectedChallenge, metricValues, editingPost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t("loginRequired"));
      return;
    }
    if (!selectedChallenge) {
      toast.error(t("selectTypeRequired"));
      return;
    }
    try {
      setLoading(true);
      if (editingPost) {
        await client.feed.updateEvent(editingPost.id, {
          userId: user.id,
          payload: {
            description: description,
            amount: parseFloat(amount) || 0,
            category: selectedChallenge.label
          }
        });
        toast.success(t("updateSuccessToast"));
      } else {
        await client.feed.createEvent({
          userId: user.id,
          username: user.fullName || user.username || "Anonim",
          userAvatar: user.imageUrl,
          appId: "tasarruf-challenges",
          eventType: "saving_achievement",
          payload: {
            description: description,
            amount: parseFloat(amount) || 0,
            category: selectedChallenge.label
          }
        });
        toast.success(t("successToast"));
      }
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error(t("errorToast"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      toast.error(t("loginRequired"));
      return;
    }
    if (!editingPost) return;

    if (!confirm(t("deleteConfirm"))) {
      return;
    }

    try {
      setLoading(true);
      await client.feed.deleteEvent(editingPost.id, { userId: user.id });
      toast.success(t("deleteSuccessToast"));
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error(t("deleteErrorToast"));
    } finally {
      setLoading(false);
    }
  };

  const handleMetricChange = (key: string, value: string) => {
    setMetricValues(prev => {
      const newValues = { ...prev, [key]: value };

      // Auto-calculate logic if unitValue exists
      if (selectedChallenge?.unitValue) {
        const countMetric = [selectedChallenge.primaryMetric, ...(selectedChallenge.secondaryMetrics || [])]
          .find(m => m.inputType === "number");
        const moneyMetric = [selectedChallenge.primaryMetric, ...(selectedChallenge.secondaryMetrics || [])]
          .find(m => m.inputType === "money");

        if (countMetric && moneyMetric && key === countMetric.key) {
          const count = parseFloat(value) || 0;
          const calculatedAmount = (count * selectedChallenge.unitValue).toFixed(2).replace(/\.00$/, "");
          newValues[moneyMetric.key] = calculatedAmount;
        }
      }

      return newValues;
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        <div className="space-y-2">
          <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block">{t("savingType")}</label>
          <button
            type="button"
            onClick={() => setShowOptionModal(true)}
            className="w-full bg-gray-50 border border-gray-150 rounded-2xl p-4 text-sm font-bold text-left flex items-center justify-between hover:bg-gray-100 transition-all shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {selectedChallenge?.emoji || "✨"}
              </span>
              <span className="flex-1 leading-tight">{selectedChallenge ? (t(`challenges.${selectedChallenge.id}.label` as any) || selectedChallenge.label) : t("selectSavingType")}</span>
            </div>
            <span className="text-[10px] font-black text-green-600 uppercase tracking-wider">
              {selectedChallenge ? t("change") : t("select")}
            </span>
          </button>
        </div>

        {selectedChallenge && (
          <>
            <div className={`grid gap-4 bg-gray-50/50 p-5 rounded-3xl border border-gray-100 ${
              selectedChallenge.secondaryMetrics && selectedChallenge.secondaryMetrics.length > 0 
                ? "grid-cols-2" 
                : "grid-cols-1"
            }`}>
              <div className="space-y-2">
                <label className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider block">
                  {t(`challenges.${selectedChallenge.id}.primaryMetric.label` as any) || selectedChallenge.primaryMetric.label} {selectedChallenge.primaryMetric.unit ? `(${t(`challenges.${selectedChallenge.id}.primaryMetric.unit` as any) || selectedChallenge.primaryMetric.unit})` : ""}
                </label>
                <input
                  type={selectedChallenge.primaryMetric.inputType === "text" ? "text" : "number"}
                  step="0.01"
                  required
                  placeholder={t(`challenges.${selectedChallenge.id}.primaryMetric.placeholder` as any) || selectedChallenge.primaryMetric.placeholder}
                  value={metricValues[selectedChallenge.primaryMetric.key] || ""}
                  onChange={e => handleMetricChange(selectedChallenge.primaryMetric.key, e.target.value)}
                  className="w-full bg-white border border-gray-150 rounded-2xl p-4 text-sm font-bold outline-none focus:border-green-500 transition-all shadow-sm"
                />
              </div>

              {selectedChallenge.secondaryMetrics?.map(m => (
                <div key={m.key} className="space-y-2">
                  <label className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider block">
                    {t(`challenges.${selectedChallenge.id}.secondaryMetrics.${m.key}.label` as any) || m.label} {m.unit ? `(${t(`challenges.${selectedChallenge.id}.secondaryMetrics.${m.key}.unit` as any) || m.unit})` : ""}
                  </label>
                  <input
                    type={m.inputType === "text" ? "text" : "number"}
                    step="0.01"
                    required
                    placeholder={t(`challenges.${selectedChallenge.id}.secondaryMetrics.${m.key}.placeholder` as any) || m.placeholder}
                    value={metricValues[m.key] || ""}
                    onChange={e => handleMetricChange(m.key, e.target.value)}
                    className="w-full bg-white border border-gray-150 rounded-2xl p-4 text-sm font-bold outline-none focus:border-green-500 transition-all shadow-sm"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block">{t("shareText")}</label>
              <textarea
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-gray-50 border border-gray-150 rounded-2xl p-4 text-sm focus:outline-none focus:border-green-500 transition-all font-bold min-h-[100px] resize-none shadow-sm"
              />
              <p className="text-[10px] text-gray-400 font-medium px-1 italic">{t("shareTextHint")}</p>
            </div>
          </>
        )}

        <button
          disabled={loading || !selectedChallenge}
          className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-green-100 mt-4 cursor-pointer"
        >
          {loading ? (
            <Spinner size={18} className="animate-spin" />
          ) : (
            <>
              <CheckCircle size={20} weight="bold" />
              <span>{editingPost ? t("saveChanges") : t("shareAndInspire")}</span>
            </>
          )}
        </button>

        {editingPost && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="w-full py-4 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-650 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border border-red-100 mt-2 cursor-pointer"
          >
            <Trash size={20} weight="bold" />
            <span>{t("deletePost")}</span>
          </button>
        )}
      </form>

      {/* SAVING OPTION SELECTOR MODAL */}
      <Drawer.Root open={showOptionModal} onOpenChange={setShowOptionModal}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]" />
          <Drawer.Content className="bg-white rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-[90] max-w-md mx-auto border-t border-gray-100 shadow-2xl flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto flex flex-col">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mb-4" />

              <header className="flex justify-between items-center mb-6 shrink-0">
                <div>
                  <Drawer.Title className="font-black text-xl text-gray-900">{t("selectSavingType")}</Drawer.Title>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{t("selectSavingTypeSubtitle")}</p>
                </div>
                <button
                  onClick={() => setShowOptionModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                >
                  <X size={20} weight="bold" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4">
                {SAVING_CHALLENGES.map(cat => (
                  <div key={cat.category} className="space-y-2.5">
                    <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider px-1">
                      {t(`categories.${cat.category}` as any)}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {cat.items.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedChallenge(item);
                            setMetricValues({});
                            setShowOptionModal(false);
                          }}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all text-xs font-bold cursor-pointer active:scale-95 ${selectedChallenge?.id === item.id
                              ? "bg-green-50 border-green-500 text-green-700"
                              : "bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700"
                            }`}
                        >
                          <span className="text-lg shrink-0">{item.emoji}</span>
                          <span className="flex-1 leading-tight">{t(`challenges.${item.id}.label` as any) || item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
