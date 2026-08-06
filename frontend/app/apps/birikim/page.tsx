"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  PiggyBank,
  Plus,
  Trash,
  PencilSimple,
  Coins,
  CalendarBlank,
  X,
  Spinner,
  ArrowUpRight,
  ArrowDownLeft,
  Bank,
  Money,
  Certificate,
  Briefcase,
  DotsThreeCircle,
  CurrencyCircleDollar,
  TrendUp,
  CaretLeft,
  CaretRight,
  ArrowLeft,
} from "@phosphor-icons/react";
import { toast, Toaster } from "react-hot-toast";
import { Drawer } from "vaul";
import { createBrowserClient } from "@/lib/api";
import { useTranslations, useLanguage } from "@/contexts/LanguageContext";

const client = createBrowserClient();

// Static FX Rates to TRY for fallback calculations
const FX_RATES: Record<string, number> = {
  TRY: 1.0,
  USD: 33.0,
  EUR: 35.5,
  GOLD: 2500.0, // Gram gold
};

const getNextPaymentDate = (maturityStr: string, frequencyMonths: number) => {
  const maturity = new Date(maturityStr);
  const now = new Date();
  let paymentDate = new Date(maturity);
  while (paymentDate > now) {
    const nextBack = new Date(paymentDate);
    nextBack.setMonth(nextBack.getMonth() - frequencyMonths);
    if (nextBack < now) {
      break; // paymentDate is the next coupon date
    }
    paymentDate = nextBack;
  }
  return paymentDate;
};

const getPrevPaymentDate = (nextPaymentDate: Date, frequencyMonths: number) => {
  const prev = new Date(nextPaymentDate);
  prev.setMonth(prev.getMonth() - frequencyMonths);
  return prev;
};

const calculateSukukYield = (
  nominal: number,
  purchaseDateStr: string | null,
  maturityStr: string,
  frequencyMonths: number,
  rentRatePerPeriod: number
) => {
  const gross = (nominal * rentRatePerPeriod) / 100;
  if (!purchaseDateStr) {
    return {
      gross,
      accrued: 0,
      net: gross,
      nextDate: getNextPaymentDate(maturityStr, frequencyMonths),
      prevDate: null,
      daysTotal: 0,
      daysAccrued: 0,
    };
  }

  const nextDate = getNextPaymentDate(maturityStr, frequencyMonths);
  const prevDate = getPrevPaymentDate(nextDate, frequencyMonths);
  const purchaseDate = new Date(purchaseDateStr);

  const daysTotal = Math.round((nextDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
  let daysAccrued = Math.round((purchaseDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysAccrued < 0) daysAccrued = 0;
  if (daysAccrued > daysTotal) daysAccrued = daysTotal;

  const accrued = gross * (daysAccrued / daysTotal);
  const net = gross - accrued;

  return {
    gross,
    accrued,
    net,
    nextDate,
    prevDate,
    daysTotal,
    daysAccrued,
  };
};

const STATIC_GOLD = [
  { symbol: "GOLD_GRAM", name: "Gram Altın", currency: "GOLD" },
  { symbol: "GOLD_CEYREK", name: "Çeyrek Altın", currency: "TRY" },
  { symbol: "GOLD_YARIM", name: "Yarım Altın", currency: "TRY" },
  { symbol: "GOLD_TAM", name: "Tam Altın", currency: "TRY" },
  { symbol: "SILVER_GRAM", name: "Gram Gümüş", currency: "TRY" }
];

const STATIC_FX = [
  { symbol: "USD", name: "Amerikan Doları ($)", currency: "USD" },
  { symbol: "EUR", name: "Euro (€)", currency: "EUR" },
  { symbol: "GBP", name: "İngiliz Sterlini (£)", currency: "GBP" },
  { symbol: "CHF", name: "İsviçre Frangı (CHF)", currency: "CHF" }
];

interface Account {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  purchase_date?: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  account_name: string | null;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Live prices catalog fetched from backend
  const [livePrices, setLivePrices] = useState<Record<string, any>>({});

  // Modal States
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"deposit" | "withdraw">("deposit");

  // Multi-step form states for adding assets
  const [addStep, setAddStep] = useState<1 | 2 | 3>(1);
  const [tempType, setTempType] = useState<string>("");
  const [tempName, setTempName] = useState<string>("");
  const [tempCurrency, setTempCurrency] = useState<string>("TRY");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [balanceInputVal, setBalanceInputVal] = useState<number>(0);
  const [tempPurchaseDate, setTempPurchaseDate] = useState<string>("");
  const [selectedInstrument, setSelectedInstrument] = useState<any | null>(null);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "bank_account":
        return <Bank size={18} className="text-blue-500 shrink-0" />;
      case "cash":
        return <Money size={18} className="text-emerald-500 shrink-0" />;
      case "gold":
        return <Coins size={18} className="text-amber-550 shrink-0" />;
      case "foreign_currency":
        return <CurrencyCircleDollar size={18} className="text-teal-500 shrink-0" />;
      case "sukuk":
        return <Certificate size={18} className="text-emerald-600 shrink-0" />;
      case "stock":
        return <TrendUp size={18} className="text-indigo-600 shrink-0" />;
      case "fund":
        return <Briefcase size={18} className="text-purple-500 shrink-0" />;
      default:
        return <DotsThreeCircle size={18} className="text-slate-400 shrink-0" />;
    }
  };

  const ASSET_TYPES = [
    { value: "stock", label: t("type_stock"), icon: <TrendUp size={24} className="text-indigo-600" /> },
    { value: "sukuk", label: t("type_sukuk"), icon: <Certificate size={24} className="text-emerald-600" /> },
    { value: "fund", label: t("type_fund"), icon: <Briefcase size={24} className="text-purple-500" /> },
    { value: "gold", label: t("type_gold"), icon: <Coins size={24} className="text-amber-550" /> },
    { value: "foreign_currency", label: t("type_foreign_currency"), icon: <CurrencyCircleDollar size={24} className="text-teal-500" /> },
    { value: "cash", label: t("type_cash"), icon: <Money size={24} className="text-emerald-500" /> },
    { value: "other", label: t("type_other"), icon: <DotsThreeCircle size={24} className="text-slate-400" /> },
  ];

  const getSearchList = () => {
    switch (tempType) {
      case "gold":
        return STATIC_GOLD;
      case "foreign_currency":
        return STATIC_FX;
      default:
        return [];
    }
  };

  // Debounced search trigger for stocks, funds, and sukuk
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    if (tempType === "gold" || tempType === "foreign_currency") return;

    setSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await client.birikim.searchInstruments({
          query: q,
          assetType: tempType,
        });
        setSearchResults(res.results || []);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, tempType]);

  // Fetch all user savings data & live prices
  const fetchData = async () => {
    try {
      setLoading(true);
      if (!user) {
        setAccounts([]);
        setTransactions([]);
        return;
      }
      const res = await client.birikim.getBirikimData(user.id);
      setAccounts(res.accounts || []);
      setTransactions(res.transactions || []);

      // Fetch unified live prices in parallel
      const pricePromises = (res.accounts || []).map(async (acc) => {
        if (acc.type === "cash" || acc.type === "other") return null;
        try {
          const priceRes = await client.birikim.getUnifiedPrice({
            symbol: acc.name,
            assetType: acc.type,
          });
          return { id: acc.id, data: priceRes };
        } catch (err) {
          console.warn(`Failed to fetch live price for ${acc.name}:`, err);
          return null;
        }
      });

      const prices = await Promise.all(pricePromises);
      const priceMap: Record<string, any> = {};
      prices.forEach((p) => {
        if (p) priceMap[p.id] = p.data;
      });
      setLivePrices(priceMap);
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
      const live = livePrices[acc.id];
      if (live) {
        const val = acc.type === "sukuk" ? (acc.balance * live.price) / 100 : acc.balance * live.price;
        total += val;
      } else {
        const rate = FX_RATES[acc.currency] || 1.0;
        total += acc.balance * rate;
      }
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
    const type = tempType || editingAccount?.type || "stock";
    const balance = parseFloat(formData.get("balance") as string) || 0;
    const currency = formData.get("currency") as string;
    const purchaseDate = tempPurchaseDate || undefined;

    try {
      await client.birikim.upsertAccount({
        id: editingAccount?.id,
        userId: user.id,
        name,
        type,
        balance,
        currency,
        purchaseDate,
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

  const handleTxSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const accountId = formData.get("account_id") as string;
    const amount = parseFloat(formData.get("amount") as string) || 0;
    const description = formData.get("description") as string;

    try {
      await client.birikim.addTransaction({
        userId: user.id,
        accountId: accountId || undefined,
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

  const isSearchableType = tempType === "stock" || tempType === "fund" || tempType === "sukuk";

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-slate-800 pb-20 relative overflow-hidden font-sans">
      <Toaster position="top-center" />

      {/* Decorative background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100/30 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-100/30 rounded-full blur-[120px] -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { window.location.href = getAppRootUrl(); }}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-slate-500 hover:text-slate-900 transition-all bg-white rounded-lg border border-gray-200/60 active:scale-95"
            >
              <CaretLeft size={14} weight="bold" className="text-indigo-600" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-slate-900 flex items-center gap-1.5">
              <PiggyBank size={18} weight="fill" className="text-indigo-600 shrink-0" />
              <span>
                {t("title").includes("&") ? (
                  <>
                    {t("title").split("&")[0]}<span className="text-indigo-600">{t("title").split("&")[1]}</span>
                  </>
                ) : (
                  t("title")
                )}
              </span>
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4 pb-8 space-y-6">
        {/* Total Savings Overview Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
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
        </div>

        {/* Savings Accounts / Varlıklar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Coins size={16} className="text-indigo-600" />
              {t("accounts")}
            </h2>
            <button
              onClick={() => {
                setEditingAccount(null);
                setTempType("");
                setTempName("");
                setTempCurrency("TRY");
                setAddStep(1);
                setSearchQuery("");
                setSearchResults([]);
                setBalanceInputVal(0);
                setTempPurchaseDate("");
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
            <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center text-xs text-slate-400 shadow-sm">
              {t("noAccounts")}
            </div>
          ) : (
            <div className="space-y-2.5">
              {accounts.map((acc) => {
                const live = livePrices[acc.id];
                const balanceValue = live
                  ? (acc.type === "sukuk" ? (acc.balance * live.price) / 100 : acc.balance * live.price)
                  : acc.balance * (FX_RATES[acc.currency] || 1.0);

                return (
                  <div
                    key={acc.id}
                    className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col transition-all shadow-sm gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                          {getAccountIcon(acc.type)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 leading-snug">{acc.name}</h3>
                          <span className="text-[10px] font-semibold text-slate-400 tracking-wide block">
                            {t("type_" + acc.type)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-black text-slate-900 block">
                            {formatCurrency(balanceValue, "TRY")}
                          </span>
                          {live && (
                            <span className="text-[9px] text-slate-400 font-semibold block">
                              {acc.balance.toLocaleString()} {acc.currency === "GOLD" ? "g" : acc.currency}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingAccount(acc);
                              setTempType(acc.type);
                              setTempName(acc.name);
                              setTempCurrency(acc.currency);
                              setBalanceInputVal(acc.balance);
                              setTempPurchaseDate(acc.purchase_date || "");
                              setSelectedInstrument(livePrices[acc.id] || null);
                              setAddStep(3);
                              setShowAccountModal(true);
                            }}
                            className="p-1.5 text-slate-455 hover:text-indigo-600 hover:bg-slate-55 rounded-lg transition-colors"
                          >
                            <PencilSimple size={14} />
                          </button>
                          <button
                            onClick={() => handleAccountDelete(acc.id)}
                            className="p-1.5 text-slate-455 hover:text-rose-500 hover:bg-slate-55 rounded-lg transition-colors"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Live Pricing Details Footer Block */}
                    {live && (
                      <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px] text-slate-500 font-medium">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Kaynak: {live.source} ({live.priceDelay === "15_min" ? "15 dk Gecikmeli" : "Gün Sonu / Günlük"})</span>
                          <span>Birim Fiyat: {formatCurrency(live.price, live.currency)}</span>
                        </div>

                        {/* Extra coupon calendar details if Sukuk */}
                        {acc.type === "sukuk" && live.maturityDate && (
                          <>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Periyot: {live.paymentFrequencyMonths || 6} Ay</span>
                              <span>Kira Oranı: %{live.periodicRate || live.rentRatePerPeriod || 0}</span>
                            </div>
                            {acc.purchase_date && (
                              <div className="flex justify-between items-center text-slate-400">
                                <span>Alış Tarihi: {new Date(acc.purchase_date).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US")}</span>
                                <span>Nominal Değer: {acc.balance.toLocaleString()}</span>
                              </div>
                            )}
                            {(() => {
                              const rentRate = live.periodicRate || live.rentRatePerPeriod || 0;
                              const freq = live.paymentFrequencyMonths || 6;
                              const yields = calculateSukukYield(
                                acc.balance,
                                acc.purchase_date || null,
                                live.maturityDate,
                                freq,
                                rentRate
                              );
                              return (
                                <div className="bg-indigo-50/50 p-2.5 rounded-xl mt-1.5 space-y-1.5 text-[10px] text-slate-650 font-semibold">
                                  <div className="flex justify-between items-center font-bold text-slate-800">
                                    <span>Sonraki Brüt Ödeme ({yields.nextDate.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", { year: "numeric", month: "short", day: "numeric" })}):</span>
                                    <span className="text-emerald-600 font-extrabold">{formatCurrency(yields.gross, "TRY")}</span>
                                  </div>
                                  {acc.purchase_date && (
                                    <>
                                      <div className="flex justify-between items-center text-slate-500 font-medium">
                                        <span>Alışta Ödenen Birikmiş Kira:</span>
                                        <span className="text-rose-500 font-bold">-{formatCurrency(yields.accrued, "TRY")}</span>
                                      </div>
                                      <div className="flex justify-between items-center font-black border-t border-slate-100 pt-1 text-indigo-650">
                                        <span>Net Dönem Getirisi:</span>
                                        <span>{formatCurrency(yields.net, "TRY")}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    )}
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
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-white border-t border-slate-200 text-slate-900 rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-50 max-w-md mx-auto flex flex-col">
            <div className="p-6 overflow-y-auto space-y-4 font-sans">
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

              {/* Step 1: Select Type */}
              {addStep === 1 && (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {locale === "tr" ? "Eklenecek Varlık Türünü Seçin" : "Select Asset Type to Add"}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {ASSET_TYPES.map((tItem) => (
                      <button
                        key={tItem.value}
                        type="button"
                        onClick={() => {
                          setTempType(tItem.value);
                          if (tItem.value === "cash" || tItem.value === "other") {
                            setTempName(tItem.value === "cash" ? (locale === "tr" ? "Nakit TL" : "Cash TRY") : "");
                            setTempCurrency("TRY");
                            setBalanceInputVal(0);
                            setAddStep(3);
                          } else {
                            setAddStep(2);
                          }
                        }}
                        className="flex flex-col items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl transition-all active:scale-95 text-center cursor-pointer"
                      >
                        {tItem.icon}
                        <span className="text-xs font-extrabold text-slate-700 leading-tight">
                          {tItem.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Search/Autocomplete Asset */}
              {addStep === 2 && (
                <div className="space-y-4 flex flex-col max-h-[60vh]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAddStep(1)}
                      className="p-1.5 hover:bg-slate-150 rounded-lg text-slate-500"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {locale === "tr" ? "Varlık Arama / Seçme" : "Search / Select Asset"}
                    </span>
                  </div>

                  {isSearchableType ? (
                    <>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={
                          tempType === "stock"
                            ? (locale === "tr" ? "Hisse ara (Örn: THYAO, EREGL)..." : "Search stock (e.g. THYAO, EREGL)...")
                            : tempType === "fund"
                              ? (locale === "tr" ? "Yatırım fonu ara (Örn: MAC, TTE)..." : "Search fund (e.g. MAC, TTE)...")
                              : (locale === "tr" ? "Kira sertifikası ara (Örn: TRD07)..." : "Search sukuk (e.g. TRD07)...")
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                        autoFocus
                      />

                      <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[40vh] pr-1 mt-2">
                        {searching ? (
                          <div className="flex items-center justify-center py-6 text-xs text-slate-400 gap-1.5">
                            <Spinner size={16} className="animate-spin text-indigo-650" />
                            {locale === "tr" ? "Aranıyor..." : "Searching..."}
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400">
                            {locale === "tr"
                              ? "Sonuç bulunamadı. Arama kutusuna tam kodu yazmayı deneyin."
                              : "No results found. Try typing the full code in the search box."}
                          </div>
                        ) : (
                          searchResults.map((item) => (
                            <button
                              key={item.symbol}
                              type="button"
                              onClick={() => {
                                setTempName(item.symbol);
                                setTempCurrency(item.currency || "TRY");
                                setSelectedInstrument(item);
                                setBalanceInputVal(0);
                                setAddStep(3);
                                setSearchQuery("");
                                setSearchResults([]);
                              }}
                              className="w-full text-left p-3 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all flex items-center justify-between cursor-pointer"
                            >
                              <div>
                                <div className="text-sm font-black text-slate-900">{item.symbol}</div>
                                <div className="text-xs text-slate-500">{item.name}</div>
                              </div>
                              <CaretRight size={16} className="text-slate-400" />
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    // Gold & FX list directly
                    <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[50vh] pr-1">
                      {getSearchList().map((item) => (
                        <button
                          key={item.symbol}
                          type="button"
                          onClick={() => {
                            setTempName(item.symbol);
                            setTempCurrency(item.currency || "TRY");
                            setBalanceInputVal(0);
                            setAddStep(3);
                          }}
                          className="w-full text-left p-3 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="text-sm font-black text-slate-900">{item.symbol}</div>
                            <div className="text-xs text-slate-500">{item.name}</div>
                          </div>
                          <CaretRight size={16} className="text-slate-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Details & Save */}
              {addStep === 3 && (
                (() => {
                  const activeMeta = selectedInstrument || (editingAccount ? livePrices[editingAccount.id] : null);
                  return (
                    <form onSubmit={handleAccountSubmit} className="space-y-4">
                      {!editingAccount && (
                        <button
                          type="button"
                          onClick={() => {
                            setAddStep(2);
                          }}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors font-bold mb-2 cursor-pointer"
                        >
                          <ArrowLeft size={12} />
                          {locale === "tr" ? "Geri Dön" : "Go Back"}
                        </button>
                      )}

                      {/* Selected Asset Info Header Card */}
                      <div className="p-3.5 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl flex gap-3 items-center">
                        <div className="p-2.5 bg-white border border-indigo-100 rounded-xl flex items-center justify-center shadow-sm">
                          {getAccountIcon(tempType || editingAccount?.type || "")}
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            {t("type_" + (tempType || editingAccount?.type))}
                          </div>
                          <div className="text-sm font-black text-slate-900 leading-tight">
                            {tempName || editingAccount?.name || (locale === "tr" ? "Yeni Varlık" : "New Asset")}
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Info Alert box inside details view */}
                      {activeMeta && (
                        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-[10px] text-slate-600 leading-relaxed space-y-1">
                          <p className="font-extrabold text-indigo-800">
                            {locale === "tr" ? "📢 Canlı Piyasa Bilgileri Bağlandı" : "📢 Live Market Data Connected"}
                          </p>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 font-semibold text-slate-500">
                            <span>Sembol: {activeMeta.isin || tempName}</span>
                            <span>Fiyat: {formatCurrency(activeMeta.referencePrice || activeMeta.price, activeMeta.currency)}</span>
                            <span className="col-span-2">Kaynak: {activeMeta.priceSource || activeMeta.source} ({activeMeta.priceDelay === "15_min" ? "15 dk gecikmeli" : "Günlük"})</span>
                            {activeMeta.maturityDate && (
                              <>
                                <span>Vade: {activeMeta.maturityDate}</span>
                                <span>Kira Oranı: %{activeMeta.rentRatePerPeriod || activeMeta.periodicRate}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500">
                          {t("accountName")}
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          defaultValue={tempName || editingAccount?.name}
                          placeholder="e.g. THYAO, Altın Portföyü..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                        />
                      </div>

                      {/* Optional purchase date input for sukuk */}
                      {tempType === "sukuk" && (
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">
                            {locale === "tr" ? "Alış / Valör Tarihi" : "Purchase / Value Date"}
                          </label>
                          <input
                            type="date"
                            name="purchase_date"
                            required
                            value={tempPurchaseDate}
                            onChange={(e) => setTempPurchaseDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                          />
                        </div>
                      )}

                      {/* Dynamic Yield displays for Sukuk */}
                      {tempType === "sukuk" && activeMeta && (
                        (() => {
                          const rentRate = activeMeta.periodicRate || activeMeta.rentRatePerPeriod || 0;
                          const freq = activeMeta.paymentFrequencyMonths || 6;
                          const maturity = activeMeta.maturityDate;

                          const yields = calculateSukukYield(
                            balanceInputVal,
                            tempPurchaseDate || null,
                            maturity,
                            freq,
                            rentRate
                          );

                          return (
                            <div className="bg-indigo-50/60 border border-indigo-150 rounded-2xl p-4 text-[10px] space-y-2">
                              <div className="font-extrabold text-indigo-900 uppercase tracking-wider text-[9px]">
                                {locale === "tr" ? "📊 DÖNEMSEL GETİRİ HESAPLAMALARI" : "📊 PERIODIC YIELD CALCULATIONS"}
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-slate-600 font-medium">
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase">{locale === "tr" ? "Sonraki Ödeme Tarihi" : "Next Payment Date"}</span>
                                  <span className="font-black text-slate-800">{yields.nextDate.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>

                                <div className="flex flex-col">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase">{locale === "tr" ? "Brüt Dönem Kirası" : "Gross Period Rent"}</span>
                                  <span className="font-black text-emerald-600">{formatCurrency(yields.gross, "TRY")}</span>
                                </div>

                                {tempPurchaseDate && (
                                  <>
                                    <div className="flex flex-col">
                                      <span className="text-[9px] text-slate-400 font-bold uppercase">
                                        {locale === "tr" ? `Birikmiş Kira (${yields.daysAccrued}/${yields.daysTotal} Gün)` : `Accrued Rent (${yields.daysAccrued}/${yields.daysTotal} Days)`}
                                      </span>
                                      <span className="font-bold text-rose-500">-{formatCurrency(yields.accrued, "TRY")}</span>
                                    </div>

                                    <div className="flex flex-col">
                                      <span className="text-[9px] text-slate-400 font-bold uppercase">{locale === "tr" ? "Net Dönem Getiriniz" : "Your Net Period Yield"}</span>
                                      <span className="font-black text-indigo-650">{formatCurrency(yields.net, "TRY")}</span>
                                    </div>
                                  </>
                                )}
                              </div>

                              {tempPurchaseDate && (
                                <div className="text-[9px] text-slate-500 leading-relaxed pt-1.5 border-t border-slate-100 italic">
                                  {locale === "tr"
                                    ? `* ${yields.daysAccrued} günlük birikmiş kira (${formatCurrency(yields.accrued, "TRY")}) satın alırken temiz fiyata ek olarak satıcıya ödendiği için, sonraki ödeme gününde alacağınız brüt ${formatCurrency(yields.gross, "TRY")} içinden düşülerek net dönem getirinize yansıtılmıştır.`
                                    : `* Since ${yields.daysAccrued} days of accrued rent (${formatCurrency(yields.accrued, "TRY")}) was paid to the previous owner at purchase, it is subtracted from your gross payment (${formatCurrency(yields.gross, "TRY")}) to show your net period return.`}
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center">
                            <span>
                              {tempType === "stock" || tempType === "fund"
                                ? (locale === "tr" ? "Adet / Lot Miktarı" : "Quantity / Shares")
                                : tempType === "sukuk"
                                  ? (locale === "tr" ? "Nominal Değer (Adet)" : "Nominal Qty")
                                  : tempType === "gold" && tempName === "GOLD_GRAM"
                                    ? (locale === "tr" ? "Miktar (Gram)" : "Quantity (g)")
                                    : tempType === "foreign_currency"
                                      ? (locale === "tr" ? "Miktar (Döviz Tutarı)" : "Quantity (FX Amount)")
                                      : t("balance")}
                            </span>
                          </label>
                          <input
                            type="number"
                            name="balance"
                            step="0.0001"
                            required
                            value={balanceInputVal}
                            onChange={(e) => setBalanceInputVal(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-500">
                            {t("currency")}
                          </label>
                          <select
                            name="currency"
                            defaultValue={tempCurrency}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-indigo-500 transition-all text-slate-900"
                          >
                            <option value="TRY">TRY (₺)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GOLD">GOLD (Gram)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95 mt-4 cursor-pointer"
                      >
                        {t("save")}
                      </button>
                    </form>
                  );
                })()
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
