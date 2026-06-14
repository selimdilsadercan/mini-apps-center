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

export default function BirikimPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const t = useTranslations("birikim");
  const { locale } = useLanguage();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [showTargetModal, setShowTargetModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<Target | null>(null);

  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"deposit" | "withdraw" | "target_allocation" | "target_refund">("deposit");

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

  // Total calculation helper
  const calculateTotalTRY = () => {
    let total = 0;
    accounts.forEach((acc) => {
      const rate = FX_RATES[acc.currency] || 1.0;
      total += acc.balance * rate;
    });
    targets.forEach((tgt) => {
      const rate = FX_RATES[tgt.currency] || 1.0;
      total += tgt.current_amount * rate;
    });
    return total;
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

  if (!isUserLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <Spinner size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 relative overflow-hidden font-sans">
      <Toaster position="top-center" />

      {/* Decorative background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] -z-10" />

      {/* Header */}
      <header className="sticky top-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 z-40 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = getAppRootUrl())}
              className="p-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-xl transition-all active:scale-95 text-slate-300"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-indigo-400">
                <PiggyBank size={24} weight="duotone" />
                {t("title")}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">{t("subtitle")}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {/* Total Savings Overview Card */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/80 border border-indigo-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-4 top-4 text-indigo-500/20">
            <TrendUp size={80} weight="thin" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Coins size={16} className="text-indigo-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t("totalSavings")}
            </span>
          </div>
          <div className="text-3xl font-black tracking-tight text-white mb-1">
            {formatCurrency(calculateTotalTRY(), "TRY")}
          </div>
          <p className="text-[10px] text-slate-400">{t("totalSavingsDesc")}</p>

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

        {/* Savings Targets / Goals */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
              {t("targets")}
            </h2>
            <button
              onClick={() => {
                setEditingTarget(null);
                setShowTargetModal(true);
              }}
              className="flex items-center gap-1 text-xs text-indigo-400 font-bold hover:underline"
            >
              <Plus size={14} />
              {t("addTarget")}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner className="animate-spin text-indigo-500" size={24} />
            </div>
          ) : targets.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 text-center text-xs text-slate-500">
              {t("noTargets")}
            </div>
          ) : (
            <div className="space-y-3">
              {targets.map((tgt) => {
                const percent = Math.min(
                  Math.round((tgt.current_amount / tgt.target_amount) * 100),
                  100
                );
                return (
                  <div
                    key={tgt.id}
                    className="bg-slate-900/60 border border-slate-900 hover:border-slate-800 rounded-2xl p-4 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-sm text-slate-200">{tgt.title}</h3>
                        {tgt.target_date && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                            <CalendarBlank size={12} />
                            {new Date(tgt.target_date).toLocaleDateString(
                              locale === "tr" ? "tr-TR" : "en-US"
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingTarget(tgt);
                            setShowTargetModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <PencilSimple size={14} />
                        </button>
                        <button
                          onClick={() => handleTargetDelete(tgt.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline mb-1.5 text-xs">
                      <span className="font-semibold text-slate-400">
                        {formatCurrency(tgt.current_amount, tgt.currency)} /{" "}
                        {formatCurrency(tgt.target_amount, tgt.currency)}
                      </span>
                      <span className="font-bold text-indigo-400">{percent}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Savings Accounts / Varlıklar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
              {t("accounts")}
            </h2>
            <button
              onClick={() => {
                setEditingAccount(null);
                setShowAccountModal(true);
              }}
              className="flex items-center gap-1 text-xs text-indigo-400 font-bold hover:underline"
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
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 text-center text-xs text-slate-500">
              {t("noAccounts")}
            </div>
          ) : (
            <div className="space-y-2.5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-slate-900/40 border border-slate-900 hover:border-slate-850 rounded-2xl p-4 flex items-center justify-between transition-all"
                >
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">{acc.name}</h3>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      {acc.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-slate-200">
                      {formatCurrency(acc.balance, acc.currency)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingAccount(acc);
                          setShowAccountModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        onClick={() => handleAccountDelete(acc.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-450 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Transaction History */}
        <section className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">
            {t("history")}
          </h2>

          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner className="animate-spin text-indigo-500" size={24} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 text-center text-xs text-slate-500">
              {t("noHistory")}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {transactions.map((tx) => {
                const isDeposit = tx.type === "deposit" || tx.type === "target_refund";
                return (
                  <div
                    key={tx.id}
                    className="bg-slate-900/20 border border-slate-900/50 rounded-xl p-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isDeposit ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {tx.type === "deposit" && <ArrowDownLeft size={16} />}
                        {tx.type === "withdraw" && <ArrowUpRight size={16} />}
                        {tx.type === "target_allocation" && <ArrowsLeftRight size={16} />}
                        {tx.type === "target_refund" && <ArrowsLeftRight size={16} />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200">
                          {tx.type === "deposit" && `${t("deposit")} - ${tx.account_name}`}
                          {tx.type === "withdraw" && `${t("withdraw")} - ${tx.account_name}`}
                          {tx.type === "target_allocation" &&
                            `${t("targetAllocation")} → ${tx.target_title}`}
                          {tx.type === "target_refund" &&
                            `${t("targetRefund")} ← ${tx.target_title}`}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {tx.description ||
                            new Date(tx.created_at).toLocaleDateString(
                              locale === "tr" ? "tr-TR" : "en-US"
                            )}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold ${isDeposit ? "text-emerald-400" : "text-rose-450"}`}>
                      {isDeposit ? "+" : "-"}
                      {tx.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Account Add/Edit Modal */}
      <Drawer.Root open={showAccountModal} onOpenChange={setShowAccountModal}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-slate-900 border-t border-slate-800 text-slate-100 rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-50 max-w-md mx-auto flex flex-col">
            <form onSubmit={handleAccountSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="mx-auto w-12 h-1 bg-slate-800 rounded-full mb-2" />
              <div className="flex justify-between items-center mb-2">
                <Drawer.Title className="text-lg font-black text-white">
                  {editingAccount ? t("editAccount") : t("addAccount")}
                </Drawer.Title>
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="p-1 hover:bg-slate-850 rounded-lg text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  {t("accountName")}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingAccount?.name || ""}
                  placeholder="Garanti Bankası TL, Nakit USD..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    {t("accountType")}
                  </label>
                  <select
                    name="type"
                    defaultValue={editingAccount?.type || "bank_account"}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-white"
                  >
                    <option value="bank_account">Bank Account</option>
                    <option value="cash">Cash</option>
                    <option value="gold">Gold</option>
                    <option value="foreign_currency">Foreign Currency</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    {t("currency")}
                  </label>
                  <select
                    name="currency"
                    defaultValue={editingAccount?.currency || "TRY"}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-white"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GOLD">GOLD (Gram)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  {t("balance")}
                </label>
                <input
                  type="number"
                  name="balance"
                  step="0.01"
                  required
                  defaultValue={editingAccount?.balance ?? 0}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-white"
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
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-slate-900 border-t border-slate-800 text-slate-100 rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-50 max-w-md mx-auto flex flex-col">
            <form onSubmit={handleTargetSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="mx-auto w-12 h-1 bg-slate-800 rounded-full mb-2" />
              <div className="flex justify-between items-center mb-2">
                <Drawer.Title className="text-lg font-black text-white">
                  {editingTarget ? t("editTarget") : t("addTarget")}
                </Drawer.Title>
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="p-1 hover:bg-slate-855 rounded-lg text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  {t("targetTitle")}
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingTarget?.title || ""}
                  placeholder="Araba Peşinatı, Yeni Laptop..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    {t("targetAmount")}
                  </label>
                  <input
                    type="number"
                    name="target_amount"
                    step="0.01"
                    required
                    defaultValue={editingTarget?.target_amount || ""}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    {t("currentAmount")}
                  </label>
                  <input
                    type="number"
                    name="current_amount"
                    step="0.01"
                    required
                    defaultValue={editingTarget?.current_amount ?? 0}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    {t("currency")}
                  </label>
                  <select
                    name="currency"
                    defaultValue={editingTarget?.currency || "TRY"}
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-white"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GOLD">GOLD (Gram)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    {t("targetDate")}
                  </label>
                  <input
                    type="date"
                    name="target_date"
                    defaultValue={editingTarget?.target_date ? editingTarget.target_date.substring(0, 10) : ""}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-white"
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
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-slate-900 border-t border-slate-800 text-slate-100 rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-50 max-w-md mx-auto flex flex-col">
            <form onSubmit={handleTxSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="mx-auto w-12 h-1 bg-slate-800 rounded-full mb-2" />
              <div className="flex justify-between items-center mb-2">
                <Drawer.Title className="text-lg font-black text-white">
                  {t("logTransaction")}
                </Drawer.Title>
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="p-1 hover:bg-slate-850 rounded-lg text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Transaction Type Tabs */}
              <div className="bg-slate-950 p-1 rounded-xl flex gap-1 border border-slate-850">
                {(["deposit", "withdraw", "target_allocation", "target_refund"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTxType(type)}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all capitalize ${
                      txType === type
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
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
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    {t("selectAccount")}
                  </label>
                  <select
                    name="account_id"
                    required={txType === "deposit" || txType === "withdraw"}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-white"
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
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    {t("selectTarget")}
                  </label>
                  <select
                    name="target_id"
                    required
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-white"
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
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  {t("amount")}
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  {t("description")}
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="E.g. Maaş günü birikimi, kumbara eklemesi..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-white"
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
    </div>
  );
}
