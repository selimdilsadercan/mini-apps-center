"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Trash, 
  CreditCard, 
  Wallet,
  CheckCircle,
  CaretRight,
  ChartPieSlice,
  Clock,
  CurrencyCircleDollar,
  X,
  Receipt,
  Scan,
  Barcode,
  Stack,
  PencilSimple,
  MagnifyingGlass
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";

import { SERVICE_CATALOG, ServicePreset } from "./data/presets";

const client = createBrowserClient();

// Backend Types
interface Subscription {
  id: string;
  user_id: string;
  name: string;
  plan_name: string;
  region: string;
  price: number;
  currency: string;
  cycle: string;
  category: string;
  color: string;
  icon: string;
  start_date: string;
  created_at: string;
}

function getRenewalDisplayDate(startDate: string, cycle: string): Date {
  const start = new Date(`${startDate}T12:00:00`);
  const renewalDay = start.getDate();
  const now = new Date();
  const year = now.getFullYear();
  const month = cycle === "yearly" ? start.getMonth() : now.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(renewalDay, lastDayOfMonth);
  return new Date(year, month, day, 12, 0, 0);
}

const EMPTY_SUB_FORM: Partial<Subscription> = {
  name: "",
  plan_name: "Standard",
  region: "TR",
  price: 0,
  cycle: "monthly",
  category: "Entertainment",
  color: "#6366F1",
  icon: "💳",
  start_date: new Date().toISOString().split("T")[0],
};

type AddModalStep = "templates" | "plan" | "form";

type CatalogBrand = {
  name: string;
  icon: string;
  color: string;
  category: string;
  plans: ServicePreset[];
};

export default function SubscriptionCenter() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { locale } = useLanguage();
  const t = useTranslations("subcenter");
  const dateLocale = locale === "tr" ? "tr-TR" : "en-US";

  const formatRenewalDate = (date: Date) =>
    date.toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });

  const formatMoney = (price: number, fractionDigits = 2) =>
    price.toLocaleString(dateLocale, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalStep, setAddModalStep] = useState<AddModalStep>("templates");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedBrandName, setSelectedBrandName] = useState<string | null>(null);
  const [newSub, setNewSub] = useState<Partial<Subscription>>({ ...EMPTY_SUB_FORM });

  const catalogBrands = useMemo<CatalogBrand[]>(() => {
    const byName = new Map<string, ServicePreset[]>();
    for (const preset of SERVICE_CATALOG) {
      const list = byName.get(preset.name) ?? [];
      list.push(preset);
      byName.set(preset.name, list);
    }
    return Array.from(byName.entries()).map(([name, plans]) => ({
      name,
      icon: plans[0].icon,
      color: plans[0].color,
      category: plans[0].category,
      plans,
    }));
  }, []);

  const filteredBrands = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    if (!q) return catalogBrands;
    return catalogBrands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.plans.some((p) => p.plan_name.toLowerCase().includes(q))
    );
  }, [catalogBrands, templateSearch]);

  const plansForSelectedBrand = useMemo(
    () => (selectedBrandName ? SERVICE_CATALOG.filter((p) => p.name === selectedBrandName) : []),
    [selectedBrandName]
  );

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const subsResp = await client.subcenter.getUserSubscriptions(user.id);
      setSubscriptions(subsResp.subscriptions);
    } catch (err) {
      console.error("Failed to load subs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded && user?.id) {
      fetchData();
    }
  }, [isUserLoaded, user?.id]);

  const applyPreset = (preset: ServicePreset) => {
    setNewSub({
      name: preset.name,
      plan_name: preset.plan_name,
      region: preset.region,
      price: preset.price,
      currency: preset.currency,
      cycle: "monthly",
      category: preset.category,
      color: preset.color,
      icon: preset.icon,
      start_date: new Date().toISOString().split("T")[0],
    });
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setAddModalStep("templates");
    setTemplateSearch("");
    setSelectedBrandName(null);
    setNewSub({ ...EMPTY_SUB_FORM });
  };

  useEffect(() => {
    if (!showAddModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAddModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showAddModal]);

  const openIssueBill = () => {
    setEditingId(null);
    setNewSub({ ...EMPTY_SUB_FORM });
    setAddModalStep("templates");
    setShowAddModal(true);
  };

  const selectBrand = (brand: CatalogBrand) => {
    setSelectedBrandName(brand.name);
    applyPreset(brand.plans[0]);
    setAddModalStep(brand.plans.length > 1 ? "plan" : "form");
  };

  const selectPlan = (preset: ServicePreset) => {
    applyPreset(preset);
    setAddModalStep("form");
  };

  const goBackFromForm = () => {
    if (selectedBrandName && plansForSelectedBrand.length > 1) {
      setAddModalStep("plan");
      return;
    }
    setSelectedBrandName(null);
    setAddModalStep("templates");
  };

  const goBackFromPlan = () => {
    setSelectedBrandName(null);
    setAddModalStep("templates");
  };

  const startCustomSubscription = () => {
    setSelectedBrandName(null);
    setNewSub({ ...EMPTY_SUB_FORM });
    setAddModalStep("form");
  };

  const handleEdit = (sub: Subscription) => {
    setEditingId(sub.id);
    setNewSub({
      name: sub.name,
      plan_name: sub.plan_name,
      region: sub.region,
      price: sub.price,
      cycle: sub.cycle,
      category: sub.category,
      color: sub.color,
      icon: sub.icon,
      start_date: new Date(sub.start_date).toISOString().split("T")[0],
    });
    setAddModalStep("form");
    setShowAddModal(true);
  };

  const handleSaveSubscription = async () => {
    if (!user?.id || !newSub.name || !newSub.price) return;
    
    try {
      if (editingId) {
        const resp = await client.subcenter.updateSubscription(editingId, {
          userId: user.id,
          name: newSub.name,
          planName: newSub.plan_name || "Standard",
          region: newSub.region || "TR",
          price: newSub.price,
          currency: "TRY",
          cycle: newSub.cycle || "monthly",
          category: newSub.category || "Other",
          color: newSub.color || "#6366F1",
          icon: newSub.icon || "💳",
          startDate: newSub.start_date || new Date().toISOString().split('T')[0]
        });
        
        if (resp.subscription) {
          setSubscriptions(subscriptions.map(s => s.id === editingId ? resp.subscription! : s));
        }
      } else {
        const resp = await client.subcenter.createSubscription({
          userId: user.id,
          name: newSub.name,
          planName: newSub.plan_name,
          region: newSub.region,
          price: newSub.price,
          currency: "TRY",
          cycle: newSub.cycle || "monthly",
          category: newSub.category || "Other",
          color: newSub.color || "#6366F1",
          icon: newSub.icon || "💳",
          startDate: newSub.start_date || new Date().toISOString().split('T')[0]
        });

        if (resp.subscription) {
          setSubscriptions([resp.subscription, ...subscriptions]);
        }
      }

      closeAddModal();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const removeSub = async (id: string) => {
    if (!user?.id || !id) return;
    try {
      setIsDeleting(true);
      const resp = await client.subcenter.deleteSubscription(id, { userId: user.id });
      if (resp.success) {
        setSubscriptions(subscriptions.filter(s => s.id !== id));
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const monthlyTotal = useMemo(() => {
    return subscriptions.reduce((acc, sub) => acc + (sub.cycle === 'monthly' ? sub.price : sub.price / 12), 0);
  }, [subscriptions]);

  if (!isUserLoaded) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F3F4F6] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* Top Printer Bar */}
      <div className="h-3 bg-slate-300 border-b border-slate-400 w-full" />

      {/* Main Container */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm px-6">
        <div className="max-w-5xl mx-auto h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 transition-all active:scale-95 shadow-sm cursor-pointer">
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase leading-none">
                <Receipt size={24} weight="fill" className="text-indigo-600" />
                SubCenter
              </h1>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">{t("subtitle")}</p>
            </div>
          </div>
          
          <button onClick={openIssueBill} className="flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all active:scale-95 font-black text-[11px] uppercase tracking-widest cursor-pointer">
            <Plus size={16} weight="bold" />
            <span>{t("issueBill")}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
        <section className="space-y-8">
           <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <h3 className="text-sm font-black text-slate-800 uppercase">{t("activeInvoices")}</h3>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{t("recordsActive", { count: subscriptions.length })}</span>
              </div>
              <div className="text-right">
                 <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t("runningTotalMo")}</span>
                 <span className="text-2xl font-black text-indigo-600 tracking-tighter leading-none">₺ {formatMoney(monthlyTotal)}</span>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
             <AnimatePresence mode="popLayout">
                {subscriptions.map((sub) => (
                  <motion.div
                    key={sub.id}
                    layoutId={sub.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative group"
                  >
                    {/* Receipt card */}
                    <div className="bg-[#FAFAF8] shadow-sm flex flex-col overflow-hidden group-hover:shadow-md transition-shadow duration-300 border-y border-dashed border-slate-300">
                       <div className="border-x border-dashed border-slate-300 px-3 py-1.5">
                          <div className="border-b border-dashed border-slate-200 pb-1.5 mb-1.5">
                             <div className="flex gap-3 items-stretch">
                                <div className="shrink-0 flex flex-col items-center gap-1.5 text-center">
                                   <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 max-w-[7rem]">{sub.name}</h4>
                                   <div className="w-16 h-16 flex items-center justify-center bg-white border border-dashed border-slate-200">
                                      <span className="text-4xl leading-none">{sub.icon}</span>
                                   </div>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col items-end justify-between text-right">
                                   <div>
                                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide leading-none">
                                         {t("renewalDate")}
                                      </p>
                                      <p className="text-sm text-slate-700 font-mono tabular-nums leading-tight mt-0.5">
                                         {formatRenewalDate(getRenewalDisplayDate(sub.start_date, sub.cycle))}
                                      </p>
                                   </div>
                                   <p className="text-lg font-bold text-slate-900 font-mono tabular-nums leading-none">
                                      ₺{formatMoney(sub.price)}
                                   </p>
                                </div>
                             </div>
                          </div>

                          <div className="flex items-center justify-end gap-0.5 -mx-0.5">
                          <button
                            onClick={() => handleEdit(sub)}
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors active:scale-95 cursor-pointer"
                          >
                            <PencilSimple size={17} weight="bold" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(sub.id)}
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors active:scale-95 cursor-pointer"
                          >
                            <Trash size={17} weight="bold" />
                          </button>
                          </div>
                       </div>

                       <div
                         className="h-1.5 w-full border-x border-dashed border-slate-300"
                         style={{
                           background: `linear-gradient(135deg, #F3F4F6 25%, transparent 25%) -3px 0 / 6px 6px,
                                      linear-gradient(225deg, #F3F4F6 25%, transparent 25%) -3px 0 / 6px 6px`,
                           backgroundColor: "#FAFAF8",
                         }}
                       />
                    </div>
                  </motion.div>
                ))}
             </AnimatePresence>
           </div>
        </section>
      </main>

      {/* Issue Bill: templates → form */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAddModal} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-h-[85vh] bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden flex flex-col ${addModalStep === "templates" && !editingId ? "max-w-xl" : "max-w-md"}`}>
              <div className="p-6 pb-4 flex items-center justify-between shrink-0 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  {((addModalStep === "form" && !editingId) || addModalStep === "plan") && (
                    <button
                      onClick={addModalStep === "plan" ? goBackFromPlan : goBackFromForm}
                      className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 transition-all cursor-pointer"
                    >
                      <ArrowLeft size={16} weight="bold" />
                    </button>
                  )}
                  <div className="w-10 h-10 shrink-0 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                    {editingId ? <PencilSimple size={20} weight="bold" /> : <Stack size={20} weight="bold" />}
                  </div>
                  <h2 className="text-base font-black text-slate-800 uppercase truncate">
                    {editingId
                      ? t("editBill")
                      : addModalStep === "templates"
                        ? t("selectTemplate")
                        : addModalStep === "plan"
                          ? t("selectPlan")
                          : t("billDetails")}
                  </h2>
                </div>
                <button onClick={closeAddModal} className="w-9 h-9 shrink-0 flex items-center justify-center hover:bg-slate-50 rounded-full text-slate-300 cursor-pointer">
                  <X size={18} weight="bold" />
                </button>
              </div>

              {addModalStep === "templates" && !editingId ? (
                <>
                  <div className="shrink-0 px-4 pt-3 pb-1">
                    <div className="relative">
                      <MagnifyingGlass size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="search"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder={t("templateSearchPlaceholder")}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
                    {filteredBrands.length === 0 ? (
                      <p className="text-center text-sm font-bold text-slate-400 py-8">{t("noTemplatesFound")}</p>
                    ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredBrands.map((brand) => (
                        <button
                          key={brand.name}
                          onClick={() => selectBrand(brand)}
                          className="flex flex-col items-center justify-center gap-2 p-4 min-h-[7.5rem] rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all text-center cursor-pointer"
                        >
                          <span className="text-4xl leading-none">{brand.icon}</span>
                          <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">{brand.name}</p>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                            {t("planCount", { count: brand.plans.length })}
                          </span>
                        </button>
                      ))}
                    </div>
                    )}
                  </div>
                  <div className="shrink-0 p-4 pt-2 border-t border-slate-100 bg-white">
                    <button
                      onClick={startCustomSubscription}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 font-bold text-sm transition-all cursor-pointer"
                    >
                      <Plus size={18} weight="bold" />
                      {t("addCustomSubscription")}
                    </button>
                  </div>
                </>
              ) : addModalStep === "plan" && !editingId ? (
                <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
                  <p className="text-center text-sm font-bold text-slate-600 mb-4">{selectedBrandName}</p>
                  <div className="space-y-2">
                    {plansForSelectedBrand.map((preset, i) => (
                      <button
                        key={`${preset.plan_name}-${i}`}
                        onClick={() => selectPlan(preset)}
                        className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                          newSub.plan_name === preset.plan_name
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${newSub.plan_name === preset.plan_name ? "text-white" : "text-slate-800"}`}>
                            {preset.plan_name}
                          </p>
                          <p className={`text-[10px] font-medium uppercase tracking-wide ${newSub.plan_name === preset.plan_name ? "text-slate-300" : "text-slate-400"}`}>
                            {preset.region}
                          </p>
                        </div>
                        <span className={`text-sm font-bold font-mono tabular-nums shrink-0 ${newSub.plan_name === preset.plan_name ? "text-white" : "text-slate-700"}`}>
                          {preset.currency === "TRY" ? "₺" : "$"}
                          {formatMoney(preset.price, preset.price % 1 === 0 ? 0 : 2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 min-h-0">
                  {SERVICE_CATALOG.some((p) => p.name === newSub.name) && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">{t("quickPlan")}</label>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {SERVICE_CATALOG.filter((p) => p.name === newSub.name).map((p, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              setNewSub({
                                ...newSub,
                                plan_name: p.plan_name,
                                price: p.price,
                                region: p.region,
                                currency: p.currency,
                                category: p.category,
                                color: p.color,
                                icon: p.icon,
                              })
                            }
                            className={`flex-shrink-0 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
                              newSub.plan_name === p.plan_name
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                            }`}
                          >
                            {p.plan_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">{t("service")}</label>
                    <input type="text" placeholder={t("servicePlaceholder")} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all" value={newSub.name} onChange={(e) => setNewSub({ ...newSub, name: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">{t("planLevel")}</label>
                      <input type="text" placeholder={t("planPlaceholder")} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all" value={newSub.plan_name} onChange={(e) => setNewSub({ ...newSub, plan_name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">{t("region")}</label>
                      <input type="text" placeholder={t("regionPlaceholder")} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase" value={newSub.region} onChange={(e) => setNewSub({ ...newSub, region: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">{t("amount")}</label>
                      <input type="number" placeholder={t("amountPlaceholder")} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-black font-mono focus:outline-none focus:border-indigo-500 transition-all" value={newSub.price || ""} onChange={(e) => setNewSub({ ...newSub, price: parseFloat(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">{t("cycle")}</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer" value={newSub.cycle} onChange={(e) => setNewSub({ ...newSub, cycle: e.target.value })}>
                        <option value="monthly">{t("monthly")}</option>
                        <option value="yearly">{t("yearly")}</option>
                      </select>
                    </div>
                  </div>

                  <button onClick={handleSaveSubscription} className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[11px]">
                    <CheckCircle size={22} weight="fill" />
                    {editingId ? t("update") : t("saveBill")}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110]" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-[2.5rem] shadow-2xl z-[111] overflow-hidden p-8 text-center" >
               <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6 shadow-sm border border-red-100">
                  <Trash size={32} weight="fill" />
               </div>
               <h3 className="text-xl font-black text-slate-800 uppercase mb-2">{t("voidReceiptTitle")}</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                  {t("voidReceiptDescription")}
               </p>
               
               <div className="grid grid-cols-2 gap-4 mt-10">
                  <button 
                    disabled={isDeleting}
                    onClick={() => setShowDeleteConfirm(null)} 
                    className="py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {t("keepIt")}
                  </button>
                  <button 
                    disabled={isDeleting}
                    onClick={() => removeSub(showDeleteConfirm!)} 
                    className="py-4 rounded-2xl bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-700 shadow-lg shadow-red-200 transition-all cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isDeleting && (
                       <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {isDeleting ? t("processing") : t("voidDelete")}
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
