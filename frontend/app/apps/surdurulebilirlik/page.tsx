"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import {
  Leaf,
  Plus,
  CheckCircle,
  Sparkle,
  ChatCircleDots,
  X,
  Spinner,
  PencilSimple,
  Trash,
  CaretLeft,
  Clock,
  User,
  Globe,
  ArrowRight,
  ListChecks
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { Drawer } from "vaul";
import { createBrowserClient } from "@/lib/api";
import { SUSTAINABILITY_CHALLENGES, ChallengeItem } from "./data";
import { useTranslations, useLanguage } from "@/contexts/LanguageContext";

const client = createBrowserClient();

export default function SustainabilityPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const t = useTranslations("surdurulebilirlik");
  const { locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<"katalog" | "feed">("katalog");
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeItem | null>(null);

  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    userTotalPoints: 0,
    userMonthPoints: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialPostChallenge, setInitialPostChallenge] = useState<ChallengeItem | undefined>(undefined);
  const [editingPost, setEditingPost] = useState<any | null>(null);

  useEffect(() => {
    if (isUserLoaded) {
      fetchData();
    }
  }, [isUserLoaded, user]);

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] ${
      active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`;

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const promises: Promise<any>[] = [
        client.feed.getEventsByApp("surdurulebilirlik")
      ];

      if (user) {
        promises.push(client.surdurulebilirlik.getStats(user.id));
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
          <Spinner size={32} className="text-emerald-500 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 pb-20">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-2.5">
            <button
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-emerald-600" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black leading-none text-gray-900 flex items-center gap-1.5">
              <Leaf size={18} weight="fill" className="text-emerald-600 shrink-0" />
              <span className="truncate">
                {t("headerTitle")}
              </span>
            </h1>

            <button
              onClick={() => setShowAddModal(true)}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all text-[10px] font-black uppercase tracking-wide"
              aria-label="Paylaş"
            >
              <Plus size={14} weight="bold" />
              <span>{t("share")}</span>
            </button>
          </div>

          <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-gray-200/80 bg-gray-100">
            <button
              onClick={() => setActiveTab("katalog")}
              className={tabClass(activeTab === "katalog")}
            >
              <Sparkle size={14} weight={activeTab === "katalog" ? "fill" : "duotone"} />
              <span>{t("katalogTab")}</span>
            </button>
            <button
              onClick={() => setActiveTab("feed")}
              className={tabClass(activeTab === "feed")}
            >
              <ChatCircleDots size={14} weight={activeTab === "feed" ? "fill" : "duotone"} />
              <span>{t("inspiration")}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-6 pb-8 max-w-xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} className="text-emerald-600 animate-spin" />
          </div>
        ) : activeTab === "katalog" ? (
          <div className="space-y-8">
            {SUSTAINABILITY_CHALLENGES.map((cat) => (
              <div key={cat.category} className="space-y-3">
                <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider px-1">
                  {t(`categories.${cat.category}` as any)}
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {cat.items.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedChallenge(item)}
                      className="w-full flex flex-col items-start gap-2 p-4 bg-white border border-gray-150 hover:bg-gray-50 rounded-2xl text-left transition-all cursor-pointer active:scale-[0.98] shadow-sm group"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm shrink-0 group-hover:scale-125 transition-transform">
                          {item.emoji}
                        </span>
                        <h5 className="text-[11px] font-black text-gray-900 tracking-tight leading-tight line-clamp-2">
                          {item.label}
                        </h5>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 leading-tight line-clamp-3">
                        {item.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {feedPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
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
                  {t("shareFirstStep")}
                </button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {feedPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-5 border border-gray-150 shadow-sm"
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
                        <div className="text-xs font-black text-gray-900 truncate tracking-wider">{post.userName === "Anonim" ? t("anonymous") : post.userName}</div>
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
                        <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                          <div className="text-[11px] font-black text-emerald-600">+{post.amount}</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-700 leading-relaxed mb-3">{post.description}</p>
                    {post.category && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-[9px] font-black text-gray-400 tracking-widest">
                        <span>
                          {(() => {
                            for (const cat of SUSTAINABILITY_CHALLENGES) {
                              const item = cat.items.find(i => i.label === post.category);
                              if (item) return item.emoji;
                            }
                            return "✨";
                          })()}
                        </span>
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
                  <Drawer.Title className="font-black text-xl text-gray-900">{t("stepTitle")}</Drawer.Title>
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
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">{t("stepTitle")}</span>
                    <span className="text-sm font-bold text-gray-800">{selectedChallenge.label}</span>
                  </div>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block">{t("whatCanYouDo")}</label>
                  <p className="text-sm font-bold text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    {selectedChallenge.description}
                  </p>

                  {/* PROMOTIONAL CARD: EKSIK VAR */}
                  {selectedChallenge.id === "shopping_list" && (
                    <button
                      onClick={() => {
                        setSelectedChallenge(null);
                        router.push("/apps/eksik-var");
                      }}
                      className="flex items-center gap-4 bg-gradient-to-br from-amber-50 to-orange-50/30 p-4 rounded-3xl border border-amber-100 hover:border-amber-250 transition-all active:scale-[0.98] group cursor-pointer shadow-sm text-left w-full mt-4"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-amber-100/50">
                        <ListChecks size={24} className="text-amber-600" weight="duotone" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-tight">Eksik Var!</h4>
                        <p className="text-[10px] font-bold text-amber-700/70 leading-relaxed mt-0.5">
                          Alışveriş listeni oluşturmak ve yönetmek için Eksik Var uygulamasını kullanabilirsin.
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/80 group-hover:bg-amber-50 border border-amber-100/20 group-hover:border-amber-200/50 transition-all shrink-0">
                        <ArrowRight size={14} className="text-amber-600" weight="bold" />
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
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-100"
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
  const t = useTranslations("surdurulebilirlik");
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeItem | null>(() => {
    if (initialChallenge) return initialChallenge;
    if (editingPost) {
      for (const cat of SUSTAINABILITY_CHALLENGES) {
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

    if (editingPost && Object.keys(metricValues).length === 0) {
      return;
    }

    let newDesc = selectedChallenge.postTemplate;

    // Replace primary metric
    const primaryKey = selectedChallenge.primaryMetric.key;
    const primaryVal = metricValues[primaryKey] || "";
    newDesc = newDesc.replace(`{${primaryKey}}`, primaryVal || `[${selectedChallenge.primaryMetric.label}]`);

    // Replace secondary metrics
    let foundAmount = "";
    if (selectedChallenge.primaryMetric.key === "impactPoints") {
      foundAmount = primaryVal;
    }

    selectedChallenge.secondaryMetrics?.forEach(m => {
      const val = metricValues[m.key] || "";
      newDesc = newDesc.replace(`{${m.key}}`, val || `[${m.label}]`);
      if (m.key === "impactPoints" && val) {
        foundAmount = val;
      }
    });

    // If no explicit impactPoints metric, use unitValue as default (multiply by count if applicable)
    if (!foundAmount && selectedChallenge.unitValue) {
      const countMetric = [selectedChallenge.primaryMetric, ...(selectedChallenge.secondaryMetrics || [])]
        .find(m => m.inputType === "number" && m.key !== "impactPoints");
      
      if (countMetric) {
        const count = parseFloat(metricValues[countMetric.key]) || 0;
        foundAmount = (count * selectedChallenge.unitValue).toFixed(0);
      } else {
        foundAmount = selectedChallenge.unitValue.toString();
      }
    }

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
          username: user.username || user.fullName || "Anonim",
          userAvatar: user.imageUrl,
          appId: "surdurulebilirlik",
          eventType: "sustainability_step",
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

      if (selectedChallenge?.unitValue) {
        const countMetric = [selectedChallenge.primaryMetric, ...(selectedChallenge.secondaryMetrics || [])]
          .find(m => m.inputType === "number" && m.key !== "impactPoints");
        const pointsMetric = [selectedChallenge.primaryMetric, ...(selectedChallenge.secondaryMetrics || [])]
          .find(m => m.key === "impactPoints");

        if (countMetric && pointsMetric && key === countMetric.key) {
          const count = parseFloat(value) || 0;
          const calculatedPoints = (count * selectedChallenge.unitValue).toFixed(0);
          newValues[pointsMetric.key] = calculatedPoints;
        }
      }

      return newValues;
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        <div className="space-y-2">
          <label className="font-extrabold text-xs text-gray-400 uppercase tracking-wider block">{t("stepType")}</label>
          <button
            type="button"
            onClick={() => setShowOptionModal(true)}
            className="w-full bg-gray-50 border border-gray-150 rounded-2xl p-4 text-sm font-bold text-left flex items-center justify-between hover:bg-gray-100 transition-all shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {selectedChallenge?.emoji || "✨"}
              </span>
              <span className="flex-1 leading-tight">{selectedChallenge ? selectedChallenge.label : t("selectStepType")}</span>
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
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
                  {selectedChallenge.primaryMetric.label} {selectedChallenge.primaryMetric.unit ? `(${selectedChallenge.primaryMetric.unit})` : ""}
                </label>
                <input
                  type={selectedChallenge.primaryMetric.inputType === "text" ? "text" : "number"}
                  required
                  placeholder={selectedChallenge.primaryMetric.placeholder}
                  value={metricValues[selectedChallenge.primaryMetric.key] || ""}
                  onChange={e => handleMetricChange(selectedChallenge.primaryMetric.key, e.target.value)}
                  className="w-full bg-white border border-gray-150 rounded-2xl p-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all shadow-sm"
                />
              </div>

              {selectedChallenge.secondaryMetrics?.map(m => (
                <div key={m.key} className="space-y-2">
                  <label className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider block">
                    {m.label} {m.unit ? `(${m.unit})` : ""}
                  </label>
                  <input
                    type={m.inputType === "text" ? "text" : "number"}
                    required
                    placeholder={m.placeholder}
                    value={metricValues[m.key] || ""}
                    onChange={e => handleMetricChange(m.key, e.target.value)}
                    className="w-full bg-white border border-gray-150 rounded-2xl p-4 text-sm font-bold outline-none focus:border-emerald-500 transition-all shadow-sm"
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
                className="w-full bg-gray-50 border border-gray-150 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500 transition-all font-bold min-h-[100px] resize-none shadow-sm"
              />
              <p className="text-[10px] text-gray-400 font-medium px-1 italic">{t("shareTextHint")}</p>
            </div>
          </>
        )}

        <button
          disabled={loading || !selectedChallenge}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-100 mt-4 cursor-pointer"
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

      {/* OPTION SELECTOR MODAL */}
      <Drawer.Root open={showOptionModal} onOpenChange={setShowOptionModal}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]" />
          <Drawer.Content className="bg-white rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-[90] max-w-md mx-auto border-t border-gray-100 shadow-2xl flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto flex flex-col">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-200 mb-4" />

              <header className="flex justify-between items-center mb-6 shrink-0">
                <div>
                  <Drawer.Title className="font-black text-xl text-gray-900">{t("selectStepType")}</Drawer.Title>
                </div>
                <button
                  onClick={() => setShowOptionModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
                >
                  <X size={20} weight="bold" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4">
                {SUSTAINABILITY_CHALLENGES.map(cat => (
                  <div key={cat.category} className="space-y-2.5">
                    <h4 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider px-1">
                      {t(`categories.${cat.category}` as any)}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
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
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                              : "bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700"
                            }`}
                        >
                          <span className="text-lg shrink-0">{item.emoji}</span>
                          <span className="flex-1 leading-tight">{item.label}</span>
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
