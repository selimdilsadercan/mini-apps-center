"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  PiggyBank,
  ArrowLeft,
  Plus,
  Trash,
  PencilSimple,
  Coins,
  CalendarBlank,
  CaretRight,
  TrendUp,
  X,
  Spinner,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowsLeftRight,
  SquaresFour,
  ChartLineUp,
  ChartPieSlice,
  Info,
  WarningCircle,
  ShieldCheck,
  Sliders,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { Drawer } from "vaul";
import { createBrowserClient } from "@/lib/api";
import { useTranslations, useLanguage } from "@/contexts/LanguageContext";

const client = createBrowserClient();

// Static FX Rates to TRY for total calculation
const FX_RATES: Record<string, number> = {
  TRY: 1.0,
  USD: 33.0,
  EUR: 35.5,
  GOLD: 2500.0, // Gram gold
};

interface Account {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  created_at: string;
}

interface Target {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  target_date: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  account_name: string | null;
  target_id: string | null;
  target_title: string | null;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

interface PlanSettings {
  monthlyIncome: number;
  fixedExpenses: number;
  targetAmount: number;
  targetMonths: number;
  passiveIncomeTarget: number;
  riskPreference: 'low' | 'medium' | 'high';
  portfolio: {
    stocks: { pct: number; yield: number };
    sukuk: { pct: number; yield: number };
    funds: { pct: number; yield: number };
    cash: { pct: number; yield: number };
  };
}

const PLAN_CACHE_KEY = 'birikim_plan_settings';

const DEFAULT_PLAN_SETTINGS: PlanSettings = {
  monthlyIncome: 65000,
  fixedExpenses: 38000,
  targetAmount: 1000000,
  targetMonths: 36,
  passiveIncomeTarget: 25000,
  riskPreference: 'medium',
  portfolio: {
    stocks: { pct: 40, yield: 35 },
    sukuk: { pct: 30, yield: 28 },
    funds: { pct: 20, yield: 30 },
    cash: { pct: 10, yield: 20 },
  }
};

export default function BirikimPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const t = useTranslations("birikim");
  const { locale } = useLanguage();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulation & Settings states
  const [planSettings, setPlanSettings] = useState<PlanSettings>(DEFAULT_PLAN_SETTINGS);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Modal States
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);

  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"deposit" | "withdraw" | "target_allocation" | "target_refund">("deposit");

  // Load settings from localStorage on client-side mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(PLAN_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setPlanSettings({ ...DEFAULT_PLAN_SETTINGS, ...parsed });
        } catch (e) {
          console.error("Failed to parse plan settings", e);
        }
      }
    }
  }, []);

  const savePlanSettings = (newSettings: PlanSettings) => {
    setPlanSettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PLAN_CACHE_KEY, JSON.stringify(newSettings));
    }
  };

  // Fetch all user savings data
  const fetchData = async () => {
    try {
      setLoading(true);
      if (!user) {
        setAccounts([]);
        setTargets([]);
        setTransactions([]);
        return;
      }
      const res = await client.birikim.getBirikimData(user.id);
      setAccounts(res.accounts || []);
      setTargets(res.targets || []);
      setTransactions(res.transactions || []);
    } catch (error) {
      console.error("fetchData error:", error);
      toast.error(t("errorMsg"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded) {
      fetchData();
    }
  }, [isUserLoaded, user]);

  // Total savings in accounts
  const calculateTotalTRY = () => {
    let total = 0;
    accounts.forEach((acc) => {
      const rate = FX_RATES[acc.currency] || 1.0;
      total += acc.balance * rate;
    });
    return total;
  };

  // Weighted average yield calculation
  const calculateWeightedYield = (settings: PlanSettings = planSettings) => {
    const p = settings.portfolio;
    const total = 
      (p.stocks.pct * p.stocks.yield) +
      (p.sukuk.pct * p.sukuk.yield) +
      (p.funds.pct * p.funds.yield) +
      (p.cash.pct * p.cash.yield);
    return total / 100;
  };

  // Compound interest simulation to find months to target
  const simulateTimeToTarget = (
    current: number,
    monthlyCont: number,
    annualRate: number,
    target: number
  ) => {
    if (current >= target) return 0;
    if (monthlyCont <= 0 && annualRate <= 0) return 999;

    let balance = current;
    const r = (annualRate / 100) / 12;
    let months = 0;

    while (balance < target && months < 1200) {
      balance = balance * (1 + r) + monthlyCont;
      months++;
    }
    return months;
  };

  // Solve for required monthly contribution
  const calculateRequiredMonthly = (
    current: number,
    target: number,
    annualRate: number,
    months: number
  ) => {
    const r = (annualRate / 100) / 12;
    if (r === 0) {
      return Math.max(0, (target - current) / months);
    }
    const compoundFactor = Math.pow(1 + r, months);
    const numerator = target - current * compoundFactor;
    if (numerator <= 0) return 0;
    const denominator = (compoundFactor - 1) / r;
    return numerator / denominator;
  };

  // Format Duration into Years & Months
  const formatDuration = (months: number) => {
    if (months >= 999) return locale === "tr" ? "Mümkün değil" : "Not possible";
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (locale === "tr") {
      if (years === 0) return `${remainingMonths} ay`;
      if (remainingMonths === 0) return `${years} yıl`;
      return `${years} yıl ${remainingMonths} ay`;
    } else {
      if (years === 0) return `${remainingMonths} months`;
      if (remainingMonths === 0) return `${years} years`;
      return `${years} years ${remainingMonths} months`;
    }
  };

  // Format Currency
  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      TRY: "₺",
      USD: "$",
      EUR: "€",
      GOLD: "g Altın",
    };
    if (currency === "GOLD") {
      return `${amount.toLocaleString(locale === "tr" ? "tr-TR" : "en-US")} g`;
    }
    return `${symbols[currency] || ""}${amount.toLocaleString(locale === "tr" ? "tr-TR" : "en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleAccountSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const balance = parseFloat(formData.get("balance") as string) || 0;
    const currency = formData.get("currency") as string;

    try {
      await client.birikim.upsertAccount({
        id: editingAccount?.id,
        userId: user.id,
        name,
        type,
        balance,
        currency,
      });
      toast.success(t("successSave"));
      setShowAccountModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(t("errorMsg"));
    }
  };

  const handleAccountDelete = async (id: string) => {
    if (!user || !confirm(t("delete") + "?")) return;
    try {
      await client.birikim.deleteAccount(id, { userId: user.id });
      toast.success(t("successDelete"));
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(t("errorMsg"));
    }
  };

  const handleTargetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const targetAmount = parseFloat(formData.get("target_amount") as string) || 0;
    const currentAmount = parseFloat(formData.get("current_amount") as string) || 0;
    const currency = formData.get("currency") as string;
    const targetDate = formData.get("target_date") as string;

    try {
      await client.birikim.upsertTarget({
        id: editingTarget?.id,
        userId: user.id,
        title,
        targetAmount,
        currentAmount,
        currency,
        targetDate: targetDate || undefined,
      });
      toast.success(t("successSave"));
      setShowTargetModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(t("errorMsg"));
    }
  };

  const handleTargetDelete = async (id: string) => {
    if (!user || !confirm(t("delete") + "?")) return;
    try {
      await client.birikim.deleteTarget(id, { userId: user.id });
      toast.success(t("successDelete"));
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(t("errorMsg"));
    }
  };

  const handleTxSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const accountId = formData.get("account_id") as string;
    const targetId = formData.get("target_id") as string;
    const amount = parseFloat(formData.get("amount") as string) || 0;
    const description = formData.get("description") as string;

    try {
      await client.birikim.addTransaction({
        userId: user.id,
        accountId: accountId || undefined,
        targetId: targetId || undefined,
        amount,
        type: txType,
        description,
      });
      toast.success(t("successTx"));
      setShowTxModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(t("errorMsg"));
    }
  };

  const handlePlanSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const monthlyIncome = parseFloat(formData.get("monthlyIncome") as string) || 0;
    const fixedExpenses = parseFloat(formData.get("fixedExpenses") as string) || 0;
    const targetAmount = parseFloat(formData.get("targetAmount") as string) || 0;
    const targetMonths = parseInt(formData.get("targetMonths") as string) || 36;
    const passiveIncomeTarget = parseFloat(formData.get("passiveIncomeTarget") as string) || 0;
    const riskPreference = formData.get("riskPreference") as PlanSettings['riskPreference'];

    const stocksPct = parseFloat(formData.get("stocksPct") as string) || 0;
    const stocksYield = parseFloat(formData.get("stocksYield") as string) || 0;
    const sukukPct = parseFloat(formData.get("sukukPct") as string) || 0;
    const sukukYield = parseFloat(formData.get("sukukYield") as string) || 0;
    const fundsPct = parseFloat(formData.get("fundsPct") as string) || 0;
    const fundsYield = parseFloat(formData.get("fundsYield") as string) || 0;
    const cashPct = parseFloat(formData.get("cashPct") as string) || 0;
    const cashYield = parseFloat(formData.get("cashYield") as string) || 0;

    const totalPct = stocksPct + sukukPct + fundsPct + cashPct;
    if (totalPct !== 100) {
      toast.error(locale === "tr" ? `Varlık oranlarının toplamı %100 olmalıdır! (Şu an: %${totalPct})` : `Asset allocations must sum to 100%! (Current: %${totalPct})`);
      return;
    }

    savePlanSettings({
      monthlyIncome,
      fixedExpenses,
      targetAmount,
      targetMonths,
      passiveIncomeTarget,
      riskPreference,
      portfolio: {
        stocks: { pct: stocksPct, yield: stocksYield },
        sukuk: { pct: sukukPct, yield: sukukYield },
        funds: { pct: fundsPct, yield: fundsYield },
        cash: { pct: cashPct, yield: cashYield },
      }
    });

    toast.success(t("successSave"));
    setShowPlanModal(false);
  };

  if (!isUserLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7] text-slate-800">
        <Spinner size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  const totalSavings = calculateTotalTRY();
  const monthlyContribution = Math.max(0, (planSettings.monthlyIncome || 0) - (planSettings.fixedExpenses || 0));
  const weightedYield = calculateWeightedYield();
  const monthsToTarget = simulateTimeToTarget(totalSavings, monthlyContribution, weightedYield, planSettings.targetAmount || 1000000);
  const targetMonths = planSettings.targetMonths || 36;
  const requiredMonthly = calculateRequiredMonthly(totalSavings, planSettings.targetAmount || 1000000, weightedYield, targetMonths);
  const requiredPercent = planSettings.monthlyIncome > 0 ? Math.min(100, Math.round((requiredMonthly / planSettings.monthlyIncome) * 100)) : 0;
  const targetPercent = Math.min(100, Math.round((totalSavings / (planSettings.targetAmount || 1000000)) * 100));

  const getArrivalDateString = () => {
    if (monthsToTarget >= 999) return locale === "tr" ? "Hesaplanamıyor" : "Cannot calculate";
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToTarget);
    return date.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", { year: "numeric", month: "long" });
  };

  const requiredPortfolioForPassive = weightedYield > 0 ? ((planSettings.passiveIncomeTarget || 0) * 12) / (weightedYield / 100) : 0;
  const currentPassiveMonthly = (totalSavings * (weightedYield / 100)) / 12;

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-slate-800 pb-20 relative overflow-hidden font-sans">
      <Toaster position="top-center" />

      {/* Decorative background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-100/40 rounded-full blur-[120px] -z-10" />

      {/* Header */}
      <header className="sticky top-0 bg-[#FAF9F7]/80 backdrop-blur-md border-b border-slate-200/60 z-40 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = getAppRootUrl())}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-950 transition-all bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm h-9"
            >
              <SquaresFour size={16} weight="fill" className="text-indigo-600 shrink-0" />
              <span className="text-xs font-bold">Geri Dön</span>
            </button>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-indigo-600">
                <PiggyBank size={24} weight="duotone" />
                {t("title")}
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">{t("subtitle")}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left Column (Span 2) */}
          <div className="md:col-span-2 space-y-6">
            {/* Total Savings Overview Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-4 top-4 text-indigo-600/10">
            <TrendUp size={80} weight="thin" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Coins size={16} className="text-indigo-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t("totalSavings")}
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight text-slate-900 mb-1">
            {formatCurrency(calculateTotalTRY(), "TRY")}
          </div>
          <p className="text-[10px] text-slate-500">{t("totalSavingsDesc")}</p>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => {
                setTxType("deposit");
                setShowTxModal(true);
              }}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus size={14} weight="bold" />
              {t("logTransaction")}
            </button>
          </div>
        </div>

        {/* Hedef Simülatörü (Goal Simulator Card) */}
        <section className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ChartLineUp size={16} className="text-indigo-600" />
              {locale === "tr" ? "Hedef Simülatörü" : "Goal Simulator"}
            </h2>
            <button
              onClick={() => setShowPlanModal(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100/60 transition-all hover:scale-[1.02]"
            >
              <Sliders size={14} />
              {locale === "tr" ? "Planı Güncelle" : "Update Plan"}
            </button>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {locale === "tr" ? "HEDEF TUTAR" : "TARGET AMOUNT"}
            </span>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {formatCurrency(planSettings.targetAmount, "TRY")}
            </div>
          </div>

          {/* Goal Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-semibold text-slate-500">
                {locale === "tr" ? "İlerleme" : "Progress"}: {formatCurrency(totalSavings, "TRY")}
              </span>
              <span className="font-bold text-indigo-600">{targetPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${targetPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full"
              />
            </div>
          </div>

          {/* Simulation Results Details */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                {locale === "tr" ? "AYLIK YATIRIM" : "MONTHLY SAVED"}
              </span>
              <span className="text-xs font-extrabold text-slate-700">
                {formatCurrency(monthlyContribution, "TRY")}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                {locale === "tr" ? "TAHMİNİ ULAŞMA" : "EST. TIMELINE"}
              </span>
              <span className="text-xs font-extrabold text-indigo-600">
                {formatDuration(monthsToTarget)}
              </span>
              {monthsToTarget < 999 && (
                <span className="block text-[8px] text-slate-400 font-medium">
                  ({getArrivalDateString()})
                </span>
              )}
            </div>
          </div>

          {/* Target Contribution Suggestion Alert Box */}
          <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 flex gap-3 items-start text-xs text-slate-600 mt-2">
            <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium leading-relaxed">
                {locale === "tr" ? (
                  <>
                    Bu hedefe <strong className="text-indigo-700 font-bold">{planSettings.targetMonths} ayda</strong> ulaşmak için aylık gelirinizin <strong className="text-indigo-700 font-bold">%{requiredPercent}</strong>'sini (<strong className="text-indigo-700 font-bold">{formatCurrency(requiredMonthly, "TRY")}</strong>) yatırmanız gerekiyor.
                  </>
                ) : (
                  <>
                    To reach this goal in <strong className="text-indigo-700 font-bold">{planSettings.targetMonths} months</strong>, you need to save <strong className="text-indigo-700 font-bold">%{requiredPercent}</strong> of your monthly income (<strong className="text-indigo-700 font-bold">{formatCurrency(requiredMonthly, "TRY")}</strong>).
                  </>
                )}
              </p>
              <div className="flex gap-2 items-center text-[10px] font-bold text-slate-400 mt-1">
                <span>{locale === "tr" ? "Şu Anki Oran" : "Current Rate"}: %{planSettings.monthlyIncome > 0 ? Math.round((monthlyContribution / planSettings.monthlyIncome) * 100) : 0}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span>{locale === "tr" ? "Beklenen Yıllık Getiri" : "Weighted Return"}: %{weightedYield.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Recommended Asset Allocation Card */}
        {monthlyContribution > 0 && (
          <section className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ChartPieSlice size={16} className="text-emerald-600" />
                {locale === "tr" ? "Aylık Yatırım Dağılım Rehberi" : "Monthly Asset Allocation Guide"}
              </h2>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              {locale === "tr" ? "Bu ayki tasarruflarınızı hedefinize göre şu şekilde dağıtmanız önerilir:" : "It is recommended to distribute your savings for this month as follows:"}
            </p>

            <div className="space-y-3">
              {[
                { key: "stocks", label: locale === "tr" ? "Hisse Senedi" : "Stocks", color: "from-indigo-500 to-indigo-600" },
                { key: "sukuk", label: locale === "tr" ? "Kira Sertifikası (Sukuk)" : "Lease Certificates (Sukuk)", color: "from-emerald-500 to-emerald-600" },
                { key: "funds", label: locale === "tr" ? "Yatırım Fonları" : "Mutual Funds", color: "from-amber-500 to-amber-600" },
                { key: "cash", label: locale === "tr" ? "Nakit / Mevduat" : "Cash / Deposit", color: "from-slate-500 to-slate-600" }
              ].map((item) => {
                const asset = planSettings.portfolio[item.key as keyof typeof planSettings.portfolio];
                const amt = (monthlyContribution * asset.pct) / 100;
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.color}`} />
                        {item.label}
                        <span className="text-[9px] font-bold text-slate-400">({asset.pct}%)</span>
                      </span>
                      <span className="font-black text-slate-800">{formatCurrency(amt, "TRY")}</span>
                    </div>
                    <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden border border-slate-100">
                      <div className={`h-full rounded-full bg-gradient-to-r ${item.color}`} style={{ width: `${asset.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Portfolio weights & Passive Income Card */}
        <section className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <PiggyBank size={16} className="text-indigo-600" />
              {locale === "tr" ? "Portföy & Pasif Gelir" : "Portfolio & Passive Income"}
            </h2>
            <p className="text-[10px] text-slate-500 font-medium">
              {locale === "tr" ? "Portföyünüzün pasif gelir üretme gücü ve hedefleri." : "The passive income generation capability of your portfolio."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="border border-slate-100 bg-slate-50 p-4 rounded-2xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                {locale === "tr" ? "MEVCUT PASİF GELİR" : "CURRENT PASSIVE INC"}
              </span>
              <span className="text-sm font-black text-slate-800 block">
                {formatCurrency(currentPassiveMonthly, "TRY")}
                <span className="text-[10px] text-slate-400 font-bold block normal-case">/{locale === "tr" ? "ay" : "mo"}</span>
              </span>
            </div>

            <div className="border border-slate-100 bg-slate-50 p-4 rounded-2xl space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                {locale === "tr" ? "PASİF GELİR HEDEFİ" : "PASSIVE INC TARGET"}
              </span>
              <span className="text-sm font-black text-indigo-600 block">
                {formatCurrency(planSettings.passiveIncomeTarget, "TRY")}
                <span className="text-[10px] text-slate-400 font-bold block normal-case">/{locale === "tr" ? "ay" : "mo"}</span>
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">{locale === "tr" ? "Hedef için Gereken Portföy" : "Required Target Portfolio"}</span>
              <span className="font-extrabold text-slate-800">{formatCurrency(requiredPortfolioForPassive, "TRY")}</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${Math.min(100, Math.round((totalSavings / (requiredPortfolioForPassive || 1)) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
              <span>{locale === "tr" ? "Tamamlanma" : "Completion"}: {Math.min(100, Math.round((totalSavings / (requiredPortfolioForPassive || 1)) * 100))}%</span>
              <span>{locale === "tr" ? "Yıllık Getiriye Göre" : "Based on Yield"}</span>
            </div>
          </div>
        </section>

      </div> {/* End Left Column */}

      {/* Right Column (Span 1) */}
      <div className="space-y-6">
        {/* Risk Scenarios Card */}
        <section className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-violet-600" />
            {locale === "tr" ? "Alternatif Risk Senaryoları" : "Alternative Risk Scenarios"}
          </h2>
          <p className="text-[10px] text-slate-500 font-medium">
            {locale === "tr" ? "Farklı varlık dağılım stratejilerine göre hedefinize ulaşma süreleri." : "Goal reach times under alternative asset distribution strategies."}
          </p>

          <div className="space-y-2.5">
            {[
              {
                id: "low",
                label: locale === "tr" ? "Düşük Risk (Defansif)" : "Low Risk (Defensive)",
                yieldVal: 24.5,
                color: "text-slate-600 bg-slate-50 border-slate-100",
                desc: locale === "tr" ? "Sukuk ve Nakit ağırlıklı güvenli liman" : "Sukuk and Cash weighted safe harbor"
              },
              {
                id: "medium",
                label: locale === "tr" ? "Orta Risk (Dengeli)" : "Medium Risk (Balanced)",
                yieldVal: 31.2,
                color: "text-indigo-600 bg-indigo-50/50 border-indigo-150 border-indigo-100",
                desc: locale === "tr" ? "Hisse, sukuk ve fonların dengeli dağılımı" : "Balanced weight of stocks, sukuk, and funds"
              },
              {
                id: "high",
                label: locale === "tr" ? "Yüksek Risk (Agresif)" : "High Risk (Aggressive)",
                yieldVal: 35.8,
                color: "text-violet-600 bg-violet-50/50 border-violet-100",
                desc: locale === "tr" ? "Hisse senedi ve fon ağırlıklı büyüme odaklı" : "Growth-oriented stocks and funds focus"
              }
            ].map((sc) => {
              const scMonths = simulateTimeToTarget(totalSavings, monthlyContribution, sc.yieldVal, planSettings.targetAmount);
              const scRequiredMonthly = calculateRequiredMonthly(totalSavings, planSettings.targetAmount, sc.yieldVal, planSettings.targetMonths);
              return (
                <div key={sc.id} className={`border rounded-2xl p-3.5 space-y-1.5 transition-all ${sc.color}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-xs">{sc.label}</span>
                    <span className="text-[10px] font-black">{locale === "tr" ? "Yıllık" : "Annual"} %{sc.yieldVal.toFixed(1)}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium">{sc.desc}</p>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                    <div>
                      <span className="text-slate-400 block">{locale === "tr" ? "Ulaşma Süresi" : "Timeline"}</span>
                      <span className="font-bold text-slate-700">{formatDuration(scMonths)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{locale === "tr" ? "Gereken Aylık Tasarruf" : "Required Saved"}</span>
                      <span className="font-bold text-slate-700">{formatCurrency(scRequiredMonthly, "TRY")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Savings Accounts / Varlıklar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-505 text-slate-500">
              {t("accounts")}
            </h2>
            <button
              onClick={() => {
                setEditingAccount(null);
                setShowAccountModal(true);
              }}
              className="flex items-center gap-1 text-xs text-indigo-600 font-bold hover:underline"
            >
              <Plus size={14} />
              {t("addAccount")}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner className="animate-spin text-indigo-500" size={24} />
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 shadow-sm">
              {t("noAccounts")}
            </div>
          ) : (
            <div className="space-y-2.5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-white border border-slate-200/60 hover:border-slate-300 rounded-2xl p-4 flex items-center justify-between transition-all shadow-sm"
                >
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">{acc.name}</h3>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      {acc.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-slate-900">
                      {formatCurrency(acc.balance, acc.currency)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingAccount(acc);
                          setShowAccountModal(true);
                        }}
                        className="p-1.5 text-slate-550 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        onClick={() => handleAccountDelete(acc.id)}
                        className="p-1.5 text-slate-450 hover:text-rose-500 hover:bg-slate-55 rounded-lg transition-colors"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>       {/* Transaction History */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
            {t("history")}
          </h2>

          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner className="animate-spin text-indigo-500" size={24} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 shadow-sm">
              {t("noHistory")}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {transactions.map((tx) => {
                const isDeposit = tx.type === "deposit" || tx.type === "target_refund";
                return (
                  <div
                    key={tx.id}
                    className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${isDeposit ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                          }`}
                      >
                        {tx.type === "deposit" && <ArrowDownLeft size={16} />}
                        {tx.type === "withdraw" && <ArrowUpRight size={16} />}
                        {tx.type === "target_allocation" && <ArrowsLeftRight size={16} />}
                        {tx.type === "target_refund" && <ArrowsLeftRight size={16} />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">
                          {tx.type === "deposit" && `${t("deposit")} - ${tx.account_name}`}
                          {tx.type === "withdraw" && `${t("withdraw")} - ${tx.account_name}`}
                          {tx.type === "target_allocation" &&
                            `${t("targetAllocation")} → ${tx.target_title}`}
                          {tx.type === "target_refund" &&
                            `${t("targetRefund")} ← ${tx.target_title}`}
                        </div>
                        <p className="text-[10px] text-slate-450">
                          {tx.description ||
                            new Date(tx.created_at).toLocaleDateString(
                              locale === "tr" ? "tr-TR" : "en-US"
                            )}
                        </p>
                      </div>
                    </div>
                    <span className={`font-extrabold ${isDeposit ? "text-emerald-600" : "text-rose-600"}`}>
                      {isDeposit ? "+" : "-"}
                      {tx.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div> {/* End Right Column */}
    </div> {/* End Grid wrapper */}
  </main>

      {/* Account Add/Edit Modal */}
      <Drawer.Root open={showAccountModal} onOpenChange={setShowAccountModal}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white border-t border-slate-200 text-slate-900 rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-50 max-w-md mx-auto flex flex-col">
            <form onSubmit={handleAccountSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="mx-auto w-12 h-1 bg-slate-200 rounded-full mb-2" />
              <div className="flex justify-between items-center mb-2">
                <Drawer.Title className="text-lg font-black text-slate-900">
                  {editingAccount ? t("editAccount") : t("addAccount")}
                </Drawer.Title>
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">
                  {t("accountName")}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingAccount?.name || ""}
                  placeholder="Garanti Bankası TL, Nakit USD..."
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    {t("accountType")}
                  </label>
                  <select
                    name="type"
                    defaultValue={editingAccount?.type || "bank_account"}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                  >
                    <option value="bank_account">Bank Account</option>
                    <option value="cash">Cash</option>
                    <option value="gold">Gold</option>
                    <option value="foreign_currency">Foreign Currency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    {t("currency")}
                  </label>
                  <select
                    name="currency"
                    defaultValue={editingAccount?.currency || "TRY"}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GOLD">GOLD (Gram)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">
                  {t("balance")}
                </label>
                <input
                  type="number"
                  name="balance"
                  step="0.01"
                  required
                  defaultValue={editingAccount?.balance ?? 0}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95 mt-4"
              >
                {t("save")}
              </button>
            </form>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Target Add/Edit Modal */}
      <Drawer.Root open={showTargetModal} onOpenChange={setShowTargetModal}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white border-t border-slate-205 text-slate-900 rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-50 max-w-md mx-auto flex flex-col">
            <form onSubmit={handleTargetSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="mx-auto w-12 h-1 bg-slate-200 rounded-full mb-2" />
              <div className="flex justify-between items-center mb-2">
                <Drawer.Title className="text-lg font-black text-slate-900">
                  {editingTarget ? t("editTarget") : t("addTarget")}
                </Drawer.Title>
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">
                  {t("targetTitle")}
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingTarget?.title || ""}
                  placeholder="Araba Peşinatı, Yeni Laptop..."
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    {t("targetAmount")}
                  </label>
                  <input
                    type="number"
                    name="target_amount"
                    step="0.01"
                    required
                    defaultValue={editingTarget?.target_amount || ""}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    {t("currentAmount")}
                  </label>
                  <input
                    type="number"
                    name="current_amount"
                    step="0.01"
                    required
                    defaultValue={editingTarget?.current_amount ?? 0}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    {t("currency")}
                  </label>
                  <select
                    name="currency"
                    defaultValue={editingTarget?.currency || "TRY"}
                    className="w-full bg-slate-50 border border-slate-255 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GOLD">GOLD (Gram)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    {t("targetDate")}
                  </label>
                  <input
                    type="date"
                    name="target_date"
                    defaultValue={editingTarget?.target_date ? editingTarget.target_date.substring(0, 10) : ""}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95 mt-4"
              >
                {t("save")}
              </button>
            </form>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Transaction Logging Modal */}
      <Drawer.Root open={showTxModal} onOpenChange={setShowTxModal}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white border-t border-slate-205 text-slate-900 rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-50 max-w-md mx-auto flex flex-col">
            <form onSubmit={handleTxSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="mx-auto w-12 h-1 bg-slate-205 rounded-full mb-2" />
              <div className="flex justify-between items-center mb-2">
                <Drawer.Title className="text-lg font-black text-slate-900">
                  {t("logTransaction")}
                </Drawer.Title>
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Transaction Type Tabs */}
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
                {(["deposit", "withdraw", "target_allocation", "target_refund"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTxType(type)}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all capitalize ${txType === type
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    {t(type as any).replace("Para ", "").replace("Hedefe ", "")}
                  </button>
                ))}
              </div>

              {/* Conditionally Render Fields */}
              {(txType === "deposit" ||
                txType === "withdraw" ||
                txType === "target_allocation" ||
                txType === "target_refund") && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500">
                      {t("selectAccount")}
                    </label>
                    <select
                      name="account_id"
                      required={txType === "deposit" || txType === "withdraw"}
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                    >
                      <option value="">-- {t("selectAccount")} --</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({formatCurrency(acc.balance, acc.currency)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              {(txType === "target_allocation" || txType === "target_refund") && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    {t("selectTarget")}
                  </label>
                  <select
                    name="target_id"
                    required
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                  >
                    <option value="">-- {t("selectTarget")} --</option>
                    {targets.map((tgt) => (
                      <option key={tgt.id} value={tgt.id}>
                        {tgt.title} ({formatCurrency(tgt.current_amount, tgt.currency)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">
                  {t("amount")}
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">
                  {t("description")}
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="E.g. Maaş günü birikimi, kumbara eklemesi..."
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95 mt-4"
              >
                {t("save")}
              </button>
            </form>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      {/* Plan Settings Modal */}
      <Drawer.Root open={showPlanModal} onOpenChange={setShowPlanModal}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white border-t border-slate-200 text-slate-900 rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[90vh] outline-none z-50 max-w-md mx-auto flex flex-col">
            <form onSubmit={handlePlanSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="mx-auto w-12 h-1 bg-slate-200 rounded-full mb-2" />
              <div className="flex justify-between items-center mb-2">
                <Drawer.Title className="text-lg font-black text-slate-900">
                  {locale === "tr" ? "Mali Hedef Planı" : "Financial Goal Plan"}
                </Drawer.Title>
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    {locale === "tr" ? "Aylık Gelir (₺)" : "Monthly Income (₺)"}
                  </label>
                  <input
                    type="number"
                    name="monthlyIncome"
                    required
                    defaultValue={planSettings.monthlyIncome}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    {locale === "tr" ? "Sabit Giderler (₺)" : "Fixed Expenses (₺)"}
                  </label>
                  <input
                    type="number"
                    name="fixedExpenses"
                    required
                    defaultValue={planSettings.fixedExpenses}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    {locale === "tr" ? "Hedef Tutar (₺)" : "Target Amount (₺)"}
                  </label>
                  <input
                    type="number"
                    name="targetAmount"
                    required
                    defaultValue={planSettings.targetAmount}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    {locale === "tr" ? "Hedef Timeline (Ay)" : "Target Horizon (Mo)"}
                  </label>
                  <input
                    type="number"
                    name="targetMonths"
                    required
                    defaultValue={planSettings.targetMonths}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    {locale === "tr" ? "Aylık Pasif Gelir Hedefi (₺)" : "Monthly Passive Income Target (₺)"}
                  </label>
                  <input
                    type="number"
                    name="passiveIncomeTarget"
                    required
                    defaultValue={planSettings.passiveIncomeTarget}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">
                  {locale === "tr" ? "Risk Tercihi" : "Risk Preference"}
                </label>
                <select
                  name="riskPreference"
                  defaultValue={planSettings.riskPreference}
                  className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                >
                  <option value="low">{locale === "tr" ? "Düşük Risk (Defansif)" : "Low Risk (Defensive)"}</option>
                  <option value="medium">{locale === "tr" ? "Orta Risk (Dengeli)" : "Medium Risk (Balanced)"}</option>
                  <option value="high">{locale === "tr" ? "Yüksek Risk (Agresif)" : "High Risk (Aggressive)"}</option>
                </select>
              </div>

              {/* Portfolio Allocations details */}
              <div className="border border-slate-100 bg-slate-50 p-4 rounded-2xl space-y-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  {locale === "tr" ? "Portföy Varlık Dağılımı ve Getirileri" : "Portfolio Asset Weights & Expected Yields"}
                </span>

                {[
                  { key: "stocks", label: locale === "tr" ? "Hisse Senedi" : "Stocks" },
                  { key: "sukuk", label: locale === "tr" ? "Kira Sertifikası (Sukuk)" : "Sukuk" },
                  { key: "funds", label: locale === "tr" ? "Yatırım Fonları" : "Funds" },
                  { key: "cash", label: locale === "tr" ? "Nakit / Mevduat" : "Cash" }
                ].map((asset) => {
                  const item = planSettings.portfolio[asset.key as keyof typeof planSettings.portfolio];
                  return (
                    <div key={asset.key} className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 block">{asset.label}</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 gap-1.5">
                          <span className="text-xs text-slate-400 font-bold">%</span>
                          <input
                            type="number"
                            name={`${asset.key}Pct`}
                            required
                            defaultValue={item.pct}
                            placeholder="Oran"
                            className="w-full text-xs font-semibold outline-none text-slate-900"
                          />
                        </div>
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 gap-1.5">
                          <span className="text-xs text-slate-400 font-bold">% getiri</span>
                          <input
                            type="number"
                            name={`${asset.key}Yield`}
                            required
                            defaultValue={item.yield}
                            placeholder="Verim"
                            className="w-full text-xs font-semibold outline-none text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95 mt-4"
              >
                {locale === "tr" ? "Hedefleri ve Planı Güncelle" : "Update Target and Plan"}
              </button>
            </form>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

