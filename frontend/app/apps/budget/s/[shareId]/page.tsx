"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useParams, useRouter } from "next/navigation";
import { 
  Plus, 
  Trash, 
  CaretLeft, 
  Coins,
  ArrowRight,
  Receipt,
  Scales,
  Tag,
  HandCoins,
  MagnifyingGlass,
  DotsThreeVertical,
  PencilSimple,
  SquaresFour,
  Table,
  ShareNetwork,
  User,
  Info,
  Sparkle,
  ArrowSquareOut,
  Lock
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { budget } from "@/lib/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { AuthModal } from "@/components/auth/AuthModal";

const client = createBrowserClient();

const CATEGORIES = [
  { id: "food", emoji: "🍔", labelTr: "Yiyecek", labelEn: "Food" },
  { id: "drink", emoji: "🥤", labelTr: "İçecek", labelEn: "Drink" },
  { id: "market", emoji: "🛒", labelTr: "Market", labelEn: "Groceries" },
  { id: "transport", emoji: "🚗", labelTr: "Ulaşım", labelEn: "Transport" },
  { id: "lodging", emoji: "🏠", labelTr: "Konaklama", labelEn: "Lodging" },
  { id: "activity", emoji: "🎟️", labelTr: "Aktivite", labelEn: "Activity" },
  { id: "shopping", emoji: "🛍️", labelTr: "Alışveriş", labelEn: "Shopping" },
  { id: "health", emoji: "💊", labelTr: "Sağlık", labelEn: "Health" },
  { id: "entertainment", emoji: "🍿", labelTr: "Eğlence", labelEn: "Entertainment" },
  { id: "other", emoji: "💵", labelTr: "Diğer", labelEn: "Other" },
];

const getCategoryEmoji = (category: string) => {
  return CATEGORIES.find(c => c.id === category)?.emoji || "💵";
};

const getProjectDays = (startStr: string, endStr: string, isTr: boolean) => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const days: { dateStr: string; dayNum: number; label: string }[] = [];
  
  let current = new Date(start);
  let dayNum = 1;
  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    const dayLabel = current.toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' });
    days.push({
      dateStr,
      dayNum,
      label: isTr ? `${dayNum}. Gün (${dayLabel})` : `Day ${dayNum} (${dayLabel})`
    });
    
    current.setDate(current.getDate() + 1);
    dayNum++;
  }
  return days;
};

interface Transaction {
  from: string;
  fromId: string;
  to: string;
  toId: string;
  amount: number;
}

export default function SharedProjectPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { shareId } = useParams() as { shareId: string };
  const router = useRouter(); 
  const { locale } = useLanguage();
  const isTr = locale === "tr";

  const [project, setProject] = useState<budget.Project | null>(null);
  const [members, setMembers] = useState<budget.Member[]>([]);
  const [expenses, setExpenses] = useState<budget.Expense[]>([]);
  const [shares, setShares] = useState<budget.ExpenseShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"expenses" | "balances">("expenses");
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [inlineSavingId, setInlineSavingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingExpense, setEditingExpense] = useState<budget.Expense | null>(null);

  // Calculations
  const [totalSpent, setTotalSpent] = useState(0);
  const [mySpent, setMySpent] = useState(0);
  const [myDurableSpent, setMyDurableSpent] = useState(0);
  const [memberBalances, setMemberBalances] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (shareId) {
      fetchProjectDetails();
      const savedMemberId = localStorage.getItem(`budget_member_${shareId}`);
      if (savedMemberId) {
        setSelectedMemberId(savedMemberId);
      } else {
        setIsIdentityModalOpen(true);
      }
    }
  }, [shareId]);

  const fetchProjectDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // Fetch internal user ID if signed in
      let currentInternalUserId = internalUserId;
      if (isUserLoaded && user?.id && !currentInternalUserId) {
        const userRes = await client.users.getOrCreateUser({
          clerkId: user.id,
          username: user.username || user.firstName || "User",
          fullName: user.fullName || undefined,
          avatarUrl: user.imageUrl || undefined
        });
        if (userRes.user) {
          currentInternalUserId = userRes.user.id;
          setInternalUserId(currentInternalUserId);
        }
      }

      const res = await client.budget.getProjectDetailsByShareId(shareId);
      setProject(res.project);
      setMembers(res.members);
      setExpenses(res.expenses);
      setShares(res.shares);

      // Auto-link logic: If signed in, check if already linked to a member
      if (currentInternalUserId) {
        const linkedMember = res.members.find(m => m.userId === currentInternalUserId);
        if (linkedMember) {
          setSelectedMemberId(linkedMember.id);
          localStorage.setItem(`budget_member_${shareId}`, linkedMember.id);
          setIsIdentityModalOpen(false);
        } else {
          // If not linked yet, but we have a selected identity from guest mode, link it!
          const guestMemberId = localStorage.getItem(`budget_member_${shareId}`);
          if (guestMemberId) {
            const guestMember = res.members.find(m => m.id === guestMemberId);
            if (guestMember && !guestMember.userId) {
              try {
                await client.budget.updateMemberUserId({
                  memberId: guestMember.id,
                  userId: currentInternalUserId
                });
                toast.success(isTr ? "Hesabın bu seyahatle eşleştirildi!" : "Account linked to this trip!");
                // Update local state
                setSelectedMemberId(guestMemberId);
                setIsIdentityModalOpen(false);
                // Refresh members to show it's linked
                const updatedRes = await client.budget.getProjectDetailsByShareId(shareId);
                setMembers(updatedRes.members);
              } catch (err) {
                console.error("Failed to auto-link member:", err);
              }
            }
          }
        }
      }

      calculateBalances(res.members, res.expenses, res.shares, selectedMemberId);
    } catch (error) {
      console.error(error);
      toast.error(isTr ? "Proje detayları yüklenirken hata oluştu" : "Failed to load details");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded) {
      fetchProjectDetails(true);
    }
  }, [isUserLoaded, user]);

  useEffect(() => {
    if (members.length > 0 && expenses.length > 0) {
      calculateBalances(members, expenses, shares, selectedMemberId);
    }
  }, [selectedMemberId, members, expenses, shares]);

  const calculateBalances = (
    currentMembers: budget.Member[],
    currentExpenses: budget.Expense[],
    currentShares: budget.ExpenseShare[],
    memberId: string | null
  ) => {
    const myMember = currentMembers.find(m => m.id === memberId);
    
    const visibleExpenses = currentExpenses.filter(e => {
      const expenseShares = currentShares.filter(s => s.expenseId === e.id);
      const otherSharers = expenseShares.filter(s => s.memberId !== e.payerMemberId);
      if (otherSharers.length > 0) return true;
      return myMember && e.payerMemberId === myMember.id;
    });

    const total = visibleExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    setTotalSpent(total);
    
    if (myMember) {
      const myShares = currentShares.filter(s => s.memberId === myMember.id);
      const myConsumableTotal = myShares
        .filter(s => {
          const exp = currentExpenses.find(e => e.id === s.expenseId);
          return exp && !exp.expenseDate.startsWith("1970-01-01");
        })
        .reduce((sum, s) => sum + Number(s.shareAmount), 0);
        
      const myDurableTotal = myShares
        .filter(s => {
          const exp = currentExpenses.find(e => e.id === s.expenseId);
          return exp && exp.expenseDate.startsWith("1970-01-01");
        })
        .reduce((sum, s) => sum + Number(s.shareAmount), 0);

      setMySpent(myConsumableTotal);
      setMyDurableSpent(myDurableTotal);
    }

    const balances: Record<string, number> = {};
    currentMembers.forEach(m => {
      balances[m.id] = 0;
    });

    currentExpenses.forEach(e => {
      const amount = Number(e.amount);
      const payerId = e.payerMemberId;
      if (balances[payerId] !== undefined) {
        balances[payerId] += amount;
      }
    });

    currentShares.forEach(s => {
      const shareAmount = Number(s.shareAmount);
      const memberId = s.memberId;
      if (balances[memberId] !== undefined) {
        balances[memberId] -= shareAmount;
      }
    });

    setMemberBalances(balances);

    const debtors: { id: string; name: string; amount: number }[] = [];
    const creditors: { id: string; name: string; amount: number }[] = [];

    currentMembers.forEach(m => {
      const bal = balances[m.id] || 0;
      if (bal < -0.01) {
        debtors.push({ id: m.id, name: m.name, amount: -bal });
      } else if (bal > 0.01) {
        creditors.push({ id: m.id, name: m.name, amount: bal });
      }
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const calculatedTransactions: Transaction[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const settleAmount = Math.min(debtor.amount, creditor.amount);
      
      if (settleAmount > 0.01) {
        calculatedTransactions.push({
          from: debtor.name,
          fromId: debtor.id,
          to: creditor.name,
          toId: creditor.id,
          amount: parseFloat(settleAmount.toFixed(2))
        });
      }

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;
      if (debtor.amount <= 0.01) dIdx++;
      if (creditor.amount <= 0.01) cIdx++;
    }

    setTransactions(calculatedTransactions);
  };

  const selectIdentity = async (memberId: string) => {
    setSelectedMemberId(memberId);
    localStorage.setItem(`budget_member_${shareId}`, memberId);
    setIsIdentityModalOpen(false);

    // If signed in but not linked, link this member to the account
    if (isUserLoaded && user?.id && internalUserId) {
      const member = members.find(m => m.id === memberId);
      if (member && !member.userId) {
        try {
          await client.budget.updateMemberUserId({
            memberId: member.id,
            userId: internalUserId
          });
          toast.success(isTr ? "Hesabın bu seyahatle eşleştirildi!" : "Account linked to this trip!");
          fetchProjectDetails(true);
        } catch (err) {
          console.error("Failed to link member:", err);
        }
      }
    }
  };

  const handleShare = () => {
    if (!project) return;
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast.success(isTr ? "Paylaşım linki kopyalandı!" : "Share link copied!");
  };

  const handleInlineSave = async (expense: budget.Expense, field: string, value: any) => {
    try {
      setInlineSavingId(expense.id);
      let updatedTitle = expense.title;
      let updatedAmount = Number(expense.amount);
      let updatedPayerId = expense.payerMemberId;
      let updatedCategory = expense.category;
      let updatedDate = expense.expenseDate;

      if (field === "title") updatedTitle = value;
      if (field === "amount") updatedAmount = Number(value);
      if (field === "payerMemberId") updatedPayerId = value;
      if (field === "category") updatedCategory = value;
      if (field === "expenseDate") updatedDate = value || null;

      let updatedSharesPayload: { member_id: string; share_amount: number }[] = [];
      const oldShares = shares.filter(s => s.expenseId === expense.id);
      const oldAmount = Number(expense.amount);

      if (field === "amount" && oldAmount > 0) {
        const scaleRatio = updatedAmount / oldAmount;
        updatedSharesPayload = oldShares.map(s => ({
          member_id: s.memberId,
          share_amount: parseFloat((Number(s.shareAmount) * scaleRatio).toFixed(2))
        }));
      } else {
        updatedSharesPayload = oldShares.map(s => ({
          member_id: s.memberId,
          share_amount: Number(s.shareAmount)
        }));
      }

      if (updatedSharesPayload.length === 0) {
        if (members.length <= 1) {
          updatedSharesPayload = [{ member_id: members[0]?.id, share_amount: updatedAmount }];
        } else {
          const equalShare = parseFloat((updatedAmount / members.length).toFixed(2));
          updatedSharesPayload = members.map(m => ({ member_id: m.id, share_amount: equalShare }));
        }
      }

      await client.budget.updateExpense({
        expenseId: expense.id,
        title: updatedTitle,
        amount: updatedAmount,
        payerMemberId: updatedPayerId,
        category: updatedCategory,
        shares: updatedSharesPayload,
        expenseDate: updatedDate || undefined
      });
      
      await fetchProjectDetails(true);
      toast.success(isTr ? "Değişiklik kaydedildi" : "Change saved");
    } catch (err) {
      console.error("inline save error:", err);
      toast.error(isTr ? "Değişiklik kaydedilemedi" : "Failed to save change");
    } finally {
      setInlineSavingId(null);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await client.budget.deleteExpense(id);
      toast.success(isTr ? "Harcama silindi" : "Expense deleted");
      fetchProjectDetails(true);
    } catch (err) {
      toast.error(isTr ? "Harcama silinemedi" : "Failed to delete expense");
    }
  };

  const getPayerName = (payerId: string) => {
    return members.find(m => m.id === payerId)?.name || (isTr ? "Bilinmeyen" : "Unknown");
  };

  const getMyNetBalance = () => {
    if (!selectedMemberId) return 0;
    return memberBalances[selectedMemberId] || 0;
  };

  const formatVal = (val: number) => {
    return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getCurrencySymbol = (code?: string) => {
    if (code === 'USD') return '$';
    if (code === 'EUR') return '€';
    return '₺';
  };

  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return isTr ? "Genel" : "General";
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const simpleDateStr = `${yyyy}-${mm}-${dd}`;

    if (simpleDateStr === "1970-01-01") {
      return isTr ? "Kalıcı" : "Durable";
    }

    if (project?.startDate && project?.endDate) {
      const days = getProjectDays(project.startDate, project.endDate, isTr);
      const matchedDay = days.find(day => day.dateStr === simpleDateStr);
      if (matchedDay) {
        return matchedDay.label;
      }
    }

    return d.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const t = {
    expenses: isTr ? "Harcamalar" : "Expenses",
    balances: isTr ? "Dengeler" : "Balances",
    totalSpent: isTr ? "Toplam Harcamalar" : "Total Expenses",
    myPaid: isTr ? "Harcamalarım" : "My Expenses",
    myDurable: isTr ? "Kalıcı Aldıklarım" : "Durable Items",
    netStatus: isTr ? "Senin Durumun" : "Your Status",
    addExpense: isTr ? "Gider Ekle" : "Add Expense",
    debtText: isTr ? "Tüm Önerilen Geri Ödemeleri Gör" : "See all suggested repayments",
    noExpenses: isTr ? "Henüz harcama girilmemiş" : "No expenses recorded yet",
    loadingText: isTr ? "Yükleniyor..." : "Loading...",
    delete: isTr ? "Sil" : "Delete",
    back: isTr ? "Bütçelerim" : "My Budgets",
    whoPaid: isTr ? "tarafından ödendi" : "paid by"
  };

  const filteredExpenses = expenses.filter(e => {
    const expenseShares = shares.filter(s => s.expenseId === e.id);
    const otherSharers = expenseShares.filter(s => s.memberId !== e.payerMemberId);
    const isPrivate = otherSharers.length === 0;
    const isMine = selectedMemberId && e.payerMemberId === selectedMemberId;
    if (isPrivate && !isMine) return false;
    if (categoryFilter === "all") return true;
    return e.category === categoryFilter;
  });

  const groupedExpenses: Record<string, budget.Expense[]> = {};
  filteredExpenses.forEach(exp => {
    const dateKey = getFormattedDate(exp.expenseDate);
    if (!groupedExpenses[dateKey]) {
      groupedExpenses[dateKey] = [];
    }
    groupedExpenses[dateKey].push(exp);
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 font-sans selection:bg-blue-100">
      <Toaster position="top-center" />

      {/* Identity Selection Overlay */}
      <AnimatePresence>
        {isIdentityModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl overflow-hidden"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 text-3xl">
                  👋
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {isTr ? "Hoş Geldin!" : "Welcome!"}
                </h2>
                <p className="text-gray-500 text-xs font-medium">
                  {isTr ? "Devam etmek için gruptaki ismini seçer misin?" : "Please select your name to continue."}
                </p>
              </div>

              {/* Instruction Banner */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 mb-6 text-white shadow-lg shadow-blue-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Sparkle size={48} weight="fill" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={16} weight="bold" className="text-blue-200" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100">
                      {isTr ? "Biliyor muydun?" : "Did you know?"}
                    </span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed mb-3">
                    {isTr 
                      ? "Burada sadece ortak değil, kimsenin görmediği kişisel harcamalarını da takip edebilirsin!" 
                      : "You can track your private expenses here too, visible only to you!"}
                  </p>
                  <button 
                    onClick={() => window.open(getAppRootUrl(), '_blank')}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-lg text-[10px] font-bold backdrop-blur-sm"
                  >
                    {isTr ? "Everything App'i Keşfet" : "Explore Everything App"}
                    <ArrowSquareOut size={12} weight="bold" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1 scrollbar-thin">
                {members.map(member => {
                  const isLinked = !!member.userId;
                  return (
                    <button
                      key={member.id}
                      disabled={isLinked}
                      onClick={() => selectIdentity(member.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-[0.98] group ${
                        isLinked 
                          ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed" 
                          : "bg-white border-gray-100 hover:bg-blue-50 hover:border-blue-100 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] shadow-sm ${
                          isLinked ? "bg-gray-200 text-gray-400" : "bg-blue-50 text-blue-500 group-hover:bg-white"
                        }`}>
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className={`text-xs font-bold ${isLinked ? "text-gray-400" : "text-gray-700"}`}>
                          {member.name}
                        </span>
                      </div>
                      {isLinked && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                          <Lock size={10} weight="fill" />
                          {isTr ? "BAĞLI" : "LINKED"}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-1/4 -right-1/4 w-[80%] h-[80%] rounded-full blur-[120px] opacity-15 bg-blue-200" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[80%] h-[80%] rounded-full blur-[120px] opacity-15 bg-pink-100" />
      </div>

      <main className={`flex-1 px-4 py-8 pb-36 mx-auto w-full flex flex-col relative z-10 transition-all duration-300 ${viewMode === "table" ? "max-w-md md:max-w-2xl lg:max-w-4xl" : "max-w-md"}`}>
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => router.push("/apps/budget")}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-gray-500 hover:text-gray-900 border border-gray-200/60 transition-all active:scale-90 shadow-sm"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            {project && (
              <div className="flex items-center gap-2">
                {expenses.length > 0 && activeTab === "expenses" && (
                  <div className="bg-white border border-gray-200 rounded-lg p-0.5 flex shadow-sm gap-0.5">
                    <button
                      onClick={() => setViewMode("cards")}
                      className={`p-1.5 rounded-[6px] transition-all ${viewMode === "cards" ? "bg-gray-100 text-gray-900 shadow-inner" : "text-gray-400 hover:text-gray-900"}`}
                      title={isTr ? "Kartlar" : "Cards"}
                    >
                      <SquaresFour size={16} weight="bold" />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-1.5 rounded-[6px] transition-all ${viewMode === "table" ? "bg-gray-100 text-gray-900 shadow-inner" : "text-gray-400 hover:text-gray-900"}`}
                      title={isTr ? "Tablo (Excel)" : "Table (Excel)"}
                    >
                      <Table size={16} weight="bold" />
                    </button>
                  </div>
                )}

                <button 
                  onClick={handleShare}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-gray-500 hover:text-gray-900 border border-gray-200/60 transition-all active:scale-90 shadow-sm pointer-events-auto"
                  title={isTr ? "Paylaş" : "Share"}
                >
                  <ShareNetwork size={18} weight="bold" />
                </button>

                <button 
                  onClick={() => setIsIdentityModalOpen(true)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-gray-500 hover:text-gray-900 border border-gray-200/60 transition-all active:scale-90 shadow-sm pointer-events-auto"
                  title={isTr ? "Kimliği Değiştir" : "Change Identity"}
                >
                  <User size={18} weight="bold" />
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm font-medium animate-pulse">{t.loadingText}</div>
        ) : !project ? (
          <div className="py-20 text-center text-red-500 font-bold">{isTr ? "Proje bulunamadı" : "Project not found"}</div>
        ) : (
          <>
            <div className="w-full max-w-md mx-auto">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-white border border-gray-200/60 flex items-center justify-center text-4xl shadow-sm mb-3 select-none">
                  {project.emoji || "🏖️"}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {project.name}
                </h1>
                {selectedMemberId && (
                  <p className="text-xs text-blue-600 font-bold mt-1 uppercase tracking-widest">
                    {members.find(m => m.id === selectedMemberId)?.name}
                  </p>
                )}
              </div>

              {members.length > 1 && (
                <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-6 shadow-sm">
                  <button 
                    onClick={() => setActiveTab("expenses")} 
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "expenses" ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-900"}`}
                  >
                    {t.expenses}
                  </button>
                  <button 
                    onClick={() => setActiveTab("balances")} 
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "balances" ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-900"}`}
                  >
                    {t.balances}
                  </button>
                </div>
              )}

              <div className="flex justify-around bg-white border border-gray-200 rounded-2xl py-4 px-2 mb-6 shadow-sm">
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">{t.myPaid}</span>
                  <span className="text-sm font-extrabold text-gray-900">
                    {getCurrencySymbol(project.currency)}{formatVal(mySpent)}
                  </span>
                </div>
                <div className="w-[1px] bg-gray-200" />
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">{t.myDurable}</span>
                  <span className="text-sm font-extrabold text-gray-900">
                    {getCurrencySymbol(project.currency)}{formatVal(myDurableSpent)}
                  </span>
                </div>
              </div>
            </div>

            {activeTab === "expenses" && (
              <div className="flex-1 space-y-4">
                {filteredExpenses.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center shadow-sm">
                    <Receipt size={32} className="text-gray-300 mb-4" />
                    <p className="text-gray-400 text-xs font-semibold">{t.noExpenses}</p>
                  </div>
                ) : viewMode === "cards" ? (
                  <div className="space-y-6">
                    {Object.entries(groupedExpenses).sort((a, b) => {
                      const dateA = a[1][0]?.expenseDate || "";
                      const dateB = b[1][0]?.expenseDate || "";
                      const getWeight = (dStr: string) => {
                        if (!dStr) return 1;
                        if (dStr.startsWith("1970-01-01")) return 0;
                        return new Date(dStr).getTime() + 1000;
                      };
                      return getWeight(dateB) - getWeight(dateA);
                    }).map(([date, items]) => (
                      <div key={date} className="space-y-3">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{date}</h3>
                        <div className="space-y-2">
                          {items.map(expense => (
                            <div
                              key={expense.id}
                              onClick={() => {
                                setEditingExpense(expense);
                                setIsExpenseOpen(true);
                              }}
                              className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center group transition-all shadow-sm hover:bg-gray-50 cursor-pointer"
                            >
                              <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-[#FAF9F7] border border-gray-100 flex items-center justify-center text-xl shadow-inner select-none">
                                  {getCategoryEmoji(expense.category)}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-gray-900 tracking-tight">
                                    {expense.title}
                                  </h4>
                                  <p className="text-[10px] text-gray-400 font-medium">
                                    {(() => {
                                      const total = Number(expense.amount);
                                      const payerName = getPayerName(expense.payerMemberId);
                                      const isMePayer = expense.payerMemberId === selectedMemberId;
                                      const totalStr = `${getCurrencySymbol(project.currency)}${formatVal(total)}`;
                                      const payerStr = isMePayer ? (isTr ? "sen ödedin" : "you paid") : (isTr ? `${payerName} ödedi` : `paid by ${payerName}`);
                                      return `${isTr ? "Toplam" : "Total"}: ${totalStr}, ${payerStr}`;
                                    })()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col items-end justify-center min-h-[44px]">
                                <span className="text-sm font-extrabold text-gray-900">
                                  {(() => {
                                    const myShare = shares.find(s => s.expenseId === expense.id && s.memberId === selectedMemberId);
                                    const myShareAmount = myShare ? Number(myShare.shareAmount) : 0;
                                    return `${getCurrencySymbol(project.currency)}${formatVal(myShareAmount)}`;
                                  })()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-[1.6rem] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[9px]">
                            <th className="p-3 w-14 text-center">{isTr ? "KAT" : "CAT"}</th>
                            <th className="p-3 min-w-[120px]">{isTr ? "BAŞLIK" : "TITLE"}</th>
                            <th className="p-3 w-24">{isTr ? "TUTAR" : "AMOUNT"}</th>
                            <th className="p-3 w-24">{isTr ? "PAYIM" : "MY SHARE"}</th>
                            <th className="p-3 w-28">{isTr ? "ÖDEYEN" : "PAYER"}</th>
                            <th className="p-3 w-32">{isTr ? "TARİH/GÜN" : "DATE/DAY"}</th>
                            <th className="p-3 w-10 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-900">
                          {filteredExpenses.map((expense) => {
                            const isSaving = inlineSavingId === expense.id;
                            return (
                              <tr key={expense.id} className="hover:bg-gray-50/50 transition-all group/row">
                                <td className="p-1.5 text-center">
                                  <select
                                    value={expense.category}
                                    onChange={(e) => handleInlineSave(expense, "category", e.target.value)}
                                    className="bg-transparent border-none text-lg p-1.5 cursor-pointer focus:ring-0 focus:outline-none w-12 text-center"
                                  >
                                    {CATEGORIES.map(cat => (
                                      <option key={cat.id} value={cat.id}>{cat.emoji}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-1.5">
                                  <input
                                    type="text"
                                    defaultValue={expense.title}
                                    onBlur={(e) => {
                                      if (e.target.value.trim() && e.target.value !== expense.title) {
                                        handleInlineSave(expense, "title", e.target.value);
                                      }
                                    }}
                                    className="bg-transparent border-none w-full p-1.5 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded font-bold text-gray-800 text-xs focus:outline-none"
                                  />
                                </td>
                                <td className="p-1.5">
                                  <div className="flex items-center gap-0.5 bg-transparent border-none rounded">
                                    <span className="text-gray-400 font-bold text-[10px] pl-1">{getCurrencySymbol(project.currency)}</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      defaultValue={expense.amount}
                                      onBlur={(e) => {
                                        const parsed = parseFloat(e.target.value);
                                        if (!isNaN(parsed) && parsed !== Number(expense.amount) && parsed > 0) {
                                          handleInlineSave(expense, "amount", parsed);
                                        } else {
                                          e.target.value = String(expense.amount);
                                        }
                                      }}
                                      className="bg-transparent border-none w-full p-1.5 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded font-extrabold text-gray-900 text-xs text-right focus:outline-none"
                                    />
                                  </div>
                                </td>
                                <td className="p-1.5 text-right">
                                  <span className="text-gray-400 font-bold text-[10px] mr-1">{getCurrencySymbol(project.currency)}</span>
                                  <span className="font-extrabold text-gray-900 text-xs">
                                    {(() => {
                                      const myShare = shares.find(s => s.expenseId === expense.id && s.memberId === selectedMemberId);
                                      return formatVal(myShare ? Number(myShare.shareAmount) : 0);
                                    })()}
                                  </span>
                                </td>
                                <td className="p-1.5">
                                  <select
                                    value={expense.payerMemberId}
                                    onChange={(e) => handleInlineSave(expense, "payerMemberId", e.target.value)}
                                    className="bg-transparent border-none w-full p-1.5 cursor-pointer font-bold text-gray-700 text-xs focus:ring-0 focus:outline-none"
                                  >
                                    {members.map(m => (
                                      <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="p-1.5">
                                  {project.startDate && project.endDate ? (
                                    <select
                                      value={expense.expenseDate ? expense.expenseDate.split('T')[0] : ""}
                                      onChange={(e) => handleInlineSave(expense, "expenseDate", e.target.value)}
                                      className="bg-transparent border-none w-full p-1.5 cursor-pointer font-bold text-gray-700 text-xs focus:ring-0 focus:outline-none"
                                    >
                                      <option value="">{isTr ? "Genel" : "General"}</option>
                                      <option value="1970-01-01">{isTr ? "Kalıcı" : "Durable"}</option>
                                      {getProjectDays(project.startDate, project.endDate, isTr).map(day => (
                                        <option key={day.dateStr} value={day.dateStr}>{day.label}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="date"
                                      defaultValue={expense.expenseDate ? expense.expenseDate.split('T')[0] : ""}
                                      onChange={(e) => handleInlineSave(expense, "expenseDate", e.target.value)}
                                      className="bg-transparent border-none w-full p-1 cursor-pointer font-bold text-gray-700 text-xs focus:ring-0 focus:outline-none"
                                    />
                                  )}
                                </td>
                                <td className="p-1.5 text-center">
                                  <div className="flex items-center justify-center">
                                    {isSaving ? (
                                      <div className="w-3.5 h-3.5 border border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteExpense(expense.id)}
                                        className="opacity-0 group-hover/row:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all active:scale-95"
                                      >
                                        <Trash size={14} weight="bold" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "balances" && (
              <div className="flex-1 space-y-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF9F7] border border-gray-100 flex items-center justify-center text-3xl select-none shadow-inner">
                      💸
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                        {t.netStatus}
                      </h4>
                      <p className={`text-base font-extrabold truncate ${Math.abs(getMyNetBalance()) < 0.01 ? 'text-gray-400' : getMyNetBalance() > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {Math.abs(getMyNetBalance()) < 0.01
                          ? (isTr ? 'Dengedesin' : 'You are settled up')
                          : getMyNetBalance() > 0 
                            ? `${isTr ? 'Alacağın Var' : 'You are owed'}: ${getCurrencySymbol(project.currency)}${formatVal(getMyNetBalance())}`
                            : `${isTr ? 'Senin Borcun' : 'Your Debt'}: ${getCurrencySymbol(project.currency)}${formatVal(Math.abs(getMyNetBalance()))}`}
                      </p>
                    </div>
                  </div>

                {transactions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                      {isTr ? "Önerilen Transferler" : "Suggested Repayments"}
                    </h3>
                    <div className="space-y-2">
                      {transactions.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-600">{t.from}</span>
                            <ArrowRight size={14} className="text-blue-600" />
                            <span className="text-xs font-bold text-gray-900">{t.to}</span>
                          </div>
                          <span className="text-xs font-extrabold text-blue-600">
                            {getCurrencySymbol(project.currency)}{formatVal(t.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                    {t.balances}
                  </h3>
                  <div className="space-y-2">
                    {members.map(member => {
                      const bal = memberBalances[member.id] || 0;
                      const isMe = member.id === selectedMemberId;
                      return (
                        <div key={member.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center font-bold text-gray-400 text-xs select-none">
                              {member.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 tracking-tight">{member.name}</h4>
                              {isMe && (
                                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{isTr ? "BEN" : "ME"}</span>
                              )}
                            </div>
                          </div>
                          <span className={`text-sm font-extrabold ${Math.abs(bal) < 0.01 ? 'text-gray-400' : bal > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {Math.abs(bal) < 0.01 
                              ? `${getCurrencySymbol(project.currency)}${formatVal(0)}`
                              : bal > 0 
                                ? `+${getCurrencySymbol(project.currency)}${formatVal(bal)}` 
                                : `-${getCurrencySymbol(project.currency)}${formatVal(Math.abs(bal))}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {!loading && project && selectedMemberId && (
        <div className="fixed bottom-10 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-[50]">
          <Drawer.Root open={isExpenseOpen} onOpenChange={(open) => {
            setIsExpenseOpen(open);
            if (!open) setEditingExpense(null);
          }}>
            <Drawer.Trigger asChild>
              <button 
                onClick={() => setEditingExpense(null)}
                className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-[0_10px_25px_rgba(37,99,235,0.25)] flex items-center justify-center active:scale-[0.9] transition-all hover:scale-105"
              >
                <Plus size={28} weight="bold" />
              </button>
            </Drawer.Trigger>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 select-none pointer-events-none">{editingExpense ? (isTr ? "Gideri Düzenle" : "Edit Expense") : t.addExpense}</span>
            
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
              <Drawer.Content className="bg-white text-gray-900 flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-md mx-auto border-t border-gray-200">
                <div className="p-6 overflow-y-auto">
                  <div className="mx-auto w-12 h-1 rounded-full bg-gray-200 mb-6" />
                  <div className="flex justify-between items-center mb-6">
                    <Drawer.Title className="text-xl font-bold flex items-center gap-2">
                      <span>💵</span> {editingExpense ? (isTr ? "Gideri Düzenle" : "Edit Expense") : (isTr ? "Gider Ekle" : "Add Expense")}
                    </Drawer.Title>
                    {editingExpense && (
                      <button
                        onClick={async () => {
                          const confirmDelete = window.confirm(isTr ? "Bu harcamayı silmek istediğinizden emin misiniz?" : "Are you sure you want to delete this expense?");
                          if (confirmDelete) {
                            try {
                              await client.budget.deleteExpense(editingExpense.id);
                              toast.success(isTr ? "Harcama silindi" : "Expense deleted");
                              setIsExpenseOpen(false);
                              setEditingExpense(null);
                              fetchProjectDetails(true);
                            } catch (err) {
                              toast.error(isTr ? "Harcama silinemedi" : "Failed to delete expense");
                            }
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all active:scale-95"
                      >
                        <Trash size={20} weight="bold" />
                      </button>
                    )}
                  </div>
                  
                  <AddExpenseForm 
                    project={project} 
                    members={members} 
                    projectShares={shares}
                    editingExpense={editingExpense}
                    isTr={isTr}
                    getCurrencySymbol={getCurrencySymbol}
                    onComplete={() => {
                      setIsExpenseOpen(false);
                      setEditingExpense(null);
                      fetchProjectDetails(true);
                    }} 
                    defaultPayerId={selectedMemberId}
                  />
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </div>
      )}
    </div>
  );
}

function AddExpenseForm({ 
  project, 
  members, 
  projectShares,
  editingExpense,
  onComplete,
  isTr,
  getCurrencySymbol,
  defaultPayerId
}: { 
  project: budget.Project; 
  members: budget.Member[]; 
  projectShares: budget.ExpenseShare[];
  editingExpense: budget.Expense | null;
  onComplete: () => void;
  isTr: boolean;
  getCurrencySymbol: (code?: string) => string;
  defaultPayerId?: string;
}) {
  const [formData, setFormData] = useState({
    title: editingExpense?.title || "",
    amount: editingExpense?.amount ? String(editingExpense.amount) : "",
    payerId: editingExpense?.payerMemberId || defaultPayerId || members[0]?.id || "",
    category: editingExpense?.category || "other",
    expenseDate: editingExpense?.expenseDate 
      ? editingExpense.expenseDate.split('T')[0] 
      : (() => {
          const todayStr = new Date().toLocaleDateString('en-CA');
          const projectStart = project.startDate?.split('T')[0];
          const projectEnd = project.endDate?.split('T')[0];
          const isTodayInRange = projectStart && projectEnd && todayStr >= projectStart && todayStr <= projectEnd;
          return isTodayInRange ? todayStr : (projectStart || todayStr);
        })(),
  });

  const dateRangeLabel = (() => {
    if (!project.startDate || !project.endDate) return "-";
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = start.toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { month: 'short' });
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${startDay} - ${endDay} ${startMonth}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  })();

  const [selectedShares, setSelectedShares] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (editingExpense) {
      const expShares = projectShares.filter(s => s.expenseId === editingExpense.id);
      members.forEach(m => {
        initial[m.id] = expShares.some(s => s.memberId === m.id);
      });
    } else {
      members.forEach(m => {
        initial[m.id] = true;
      });
    }
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [splitMode, setSplitMode] = useState<"equal" | "ratio" | "amount">("equal");
  const [ratios, setRatios] = useState<Record<string, string>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      title: editingExpense?.title || "",
      amount: editingExpense?.amount ? String(editingExpense.amount) : "",
      payerId: editingExpense?.payerMemberId || defaultPayerId || members[0]?.id || "",
      category: editingExpense?.category || "other",
      expenseDate: editingExpense?.expenseDate 
        ? editingExpense.expenseDate.split('T')[0] 
        : (() => {
            const todayStr = new Date().toLocaleDateString('en-CA');
            const projectStart = project.startDate?.split('T')[0];
            const projectEnd = project.endDate?.split('T')[0];
            const isTodayInRange = projectStart && projectEnd && todayStr >= projectStart && todayStr <= projectEnd;
            return isTodayInRange ? todayStr : (projectStart || todayStr);
          })(),
    });

    const initialShares: Record<string, boolean> = {};
    if (editingExpense) {
      const expShares = projectShares.filter(s => s.expenseId === editingExpense.id);
      members.forEach(m => {
        initialShares[m.id] = expShares.some(s => s.memberId === m.id);
      });
    } else {
      members.forEach(m => {
        initialShares[m.id] = true;
      });
    }
    setSelectedShares(initialShares);

    const initialAmounts: Record<string, string> = {};
    if (editingExpense) {
      const expShares = projectShares.filter(s => s.expenseId === editingExpense.id);
      expShares.forEach(s => {
        initialAmounts[s.memberId] = String(s.shareAmount);
      });
    }
    setAmounts(initialAmounts);

    const initialRatios: Record<string, string> = {};
    members.forEach(m => {
      initialRatios[m.id] = "1";
    });
    setRatios(initialRatios);

    if (editingExpense) {
      const expShares = projectShares.filter(s => s.expenseId === editingExpense.id);
      if (expShares.length > 0) {
        const firstAmount = expShares[0].shareAmount;
        const allEqual = expShares.every(s => s.shareAmount === firstAmount);
        setSplitMode(allEqual ? "equal" : "amount");
      }
    } else {
      setSplitMode("equal");
    }
  }, [editingExpense, members, projectShares, defaultPayerId]);

  const toggleShare = (memberId: string) => {
    setSelectedShares(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const handleRatioChange = (memberId: string, val: string) => {
    setRatios(prev => ({
      ...prev,
      [memberId]: val
    }));
  };

  const handleAmountChange = (memberId: string, val: string) => {
    setAmounts(prev => ({
      ...prev,
      [memberId]: val
    }));
  };

  const calculatedRatioAmounts = (() => {
    const totalAmount = parseFloat(formData.amount) || 0;
    const activeRatios: Record<string, number> = {};
    let totalRatioSum = 0;
    members.forEach(m => {
      if (selectedShares[m.id]) {
        const rVal = parseFloat(ratios[m.id] ?? "1");
        const r = isNaN(rVal) || rVal < 0 ? 0 : rVal;
        activeRatios[m.id] = r;
        totalRatioSum += r;
      } else {
        activeRatios[m.id] = 0;
      }
    });
    const calculated: Record<string, number> = {};
    members.forEach(m => {
      if (selectedShares[m.id] && totalRatioSum > 0) {
        calculated[m.id] = (activeRatios[m.id] / totalRatioSum) * totalAmount;
      } else {
        calculated[m.id] = 0;
      }
    });
    return calculated;
  })();

  const sumOfAmounts = (() => {
    let sum = 0;
    members.forEach(m => {
      if (selectedShares[m.id]) {
        const val = parseFloat(amounts[m.id] ?? "0");
        sum += isNaN(val) ? 0 : val;
      }
    });
    return sum;
  })();

  const formatVal = (val: number) => {
    return new Intl.NumberFormat(isTr ? "tr-TR" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error(isTr ? "Lütfen geçerli bir tutar girin" : "Please enter a valid amount");
      return;
    }

    let sharesPayload: { member_id: string; share_amount: number }[] = [];
    if (members.length <= 1) {
      if (members.length === 0) return;
      sharesPayload = [{ member_id: members[0].id, share_amount: amountVal }];
    } else {
      const checkedCount = Object.values(selectedShares).filter(Boolean).length;
      if (checkedCount === 0) {
        toast.error(isTr ? "En az bir katılımcı seçmelisiniz" : "Must select at least one member for split");
        return;
      }
      if (splitMode === "equal") {
        const rawShare = amountVal / checkedCount;
        const shareAmount = parseFloat(rawShare.toFixed(2));
        sharesPayload = Object.entries(selectedShares)
          .filter(([_, selected]) => selected)
          .map(([memberId]) => ({ member_id: memberId, share_amount: shareAmount }));
      } else if (splitMode === "ratio") {
        let totalRatioSum = 0;
        members.forEach(m => {
          if (selectedShares[m.id]) {
            const rVal = parseFloat(ratios[m.id] ?? "1");
            totalRatioSum += isNaN(rVal) || rVal < 0 ? 0 : rVal;
          }
        });
        if (totalRatioSum <= 0) {
          toast.error(isTr ? "Geçersiz pay oranları!" : "Invalid share ratios!");
          return;
        }
        sharesPayload = members
          .filter(m => selectedShares[m.id])
          .map(m => {
            const rVal = parseFloat(ratios[m.id] ?? "1");
            const r = isNaN(rVal) || rVal < 0 ? 0 : rVal;
            const shareAmount = parseFloat(((r / totalRatioSum) * amountVal).toFixed(2));
            return { member_id: m.id, share_amount: shareAmount };
          });
      } else if (splitMode === "amount") {
        if (Math.abs(sumOfAmounts - amountVal) > 0.02) {
          toast.error(isTr ? "Girilen tutarların toplamı gider tutarına eşit olmalıdır!" : "Sum of amounts must equal the total expense amount!");
          return;
        }
        sharesPayload = members
          .filter(m => selectedShares[m.id])
          .map(m => {
            const shareVal = parseFloat(amounts[m.id] ?? "0");
            return { member_id: m.id, share_amount: isNaN(shareVal) ? 0 : parseFloat(shareVal.toFixed(2)) };
          });
      }
    }

    try {
      setLoading(true);
      if (editingExpense) {
        await client.budget.updateExpense({
          expenseId: editingExpense.id,
          title: formData.title,
          amount: amountVal,
          payerMemberId: formData.payerId,
          category: formData.category,
          shares: sharesPayload,
          expenseDate: formData.expenseDate || undefined
        });
        toast.success(isTr ? "Gider güncellendi" : "Expense updated");
      } else {
        await client.budget.addExpense({
          projectId: project.id,
          title: formData.title,
          amount: amountVal,
          payerMemberId: formData.payerId,
          category: formData.category,
          shares: sharesPayload,
          expenseDate: formData.expenseDate || undefined
        });
        toast.success(isTr ? "Gider eklendi" : "Expense added");
      }
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error("Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-8 text-sm text-gray-800">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
          {isTr ? "Kategori" : "Category"}
        </label>
        <div className="grid grid-cols-5 gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = formData.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.id })}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all active:scale-95 ${
                  isSelected ? "bg-blue-50 border-blue-500 text-blue-600 shadow-sm font-semibold" : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }`}
              >
                <span className="text-2xl mb-1 select-none">{cat.emoji}</span>
                <span className="text-[9px] font-bold tracking-tight text-center truncate w-full">
                  {isTr ? cat.labelTr : cat.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
          {isTr ? "Başlık" : "Title"}
        </label>
        <input required placeholder={isTr ? "Örneğin: Pizza, Market..." : "e.g. Pizza, Fuel..."} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
            {isTr ? "Tutar" : "Amount"} ({getCurrencySymbol(project.currency)})
          </label>
          <input type="number" step="0.01" required placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
            {isTr ? "Ödeyen" : "Who Paid?"}
          </label>
          <select value={formData.payerId} onChange={e => setFormData({...formData, payerId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold">
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
          {isTr ? "Tarih / Gün" : "Date / Day"}
        </label>
        {project.startDate && project.endDate ? (
          <div className="flex gap-2 overflow-x-auto flex-nowrap pb-2 -mx-6 px-6 scrollbar-none">
            {[...getProjectDays(project.startDate, project.endDate, isTr)].reverse().map((day) => {
              const isSelected = formData.expenseDate === day.dateStr;
              const dayText = isTr ? `${day.dayNum}. Gün` : `Day ${day.dayNum}`;
              const dateStrObj = new Date(day.dateStr);
              const dateText = dateStrObj.toLocaleDateString(isTr ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' });
              return (
                <button key={day.dateStr} type="button" onClick={() => setFormData({ ...formData, expenseDate: day.dateStr })} className={`flex flex-col items-center justify-center min-w-[72px] py-2 px-3 rounded-xl border text-xs transition-all active:scale-95 flex-shrink-0 ${isSelected ? "bg-blue-50 border-blue-500 text-blue-600 font-bold shadow-sm" : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 hover:text-gray-700 font-semibold"}`}>
                  <span>{dayText}</span>
                  <span className="text-[10px] text-gray-400 font-medium mt-0.5">({dateText})</span>
                </button>
              );
            })}
            <button type="button" onClick={() => setFormData({ ...formData, expenseDate: "" })} className={`flex flex-col items-center justify-center min-w-[72px] py-2 px-3 rounded-xl border text-xs transition-all active:scale-95 flex-shrink-0 ${formData.expenseDate === "" ? "bg-blue-50 border-blue-500 text-blue-600 font-bold shadow-sm" : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 hover:text-gray-700 font-semibold"}`}>
              <span>{isTr ? "Genel" : "General"}</span>
              <span className="text-[10px] text-gray-400 font-medium mt-0.5">{dateRangeLabel}</span>
            </button>
            <button type="button" onClick={() => setFormData({ ...formData, expenseDate: "1970-01-01" })} className={`flex flex-col items-center justify-center min-w-[72px] py-2 px-3 rounded-xl border text-xs transition-all active:scale-95 flex-shrink-0 ${formData.expenseDate === "1970-01-01" ? "bg-blue-50 border-blue-500 text-blue-600 font-bold shadow-sm" : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 hover:text-gray-700 font-semibold"}`}>
              <span>{isTr ? "Kalıcı" : "Durable"}</span>
              <span className="text-[10px] text-gray-400 font-medium mt-0.5">{isTr ? "Ekipman" : "Gear"}</span>
            </button>
          </div>
        ) : (
          <input type="date" value={formData.expenseDate} onChange={e => setFormData({...formData, expenseDate: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold cursor-pointer" />
        )}
      </div>

      {members.length > 1 && (
        <div className="space-y-2.5">
          <div className="flex justify-between items-center pl-1">
            <label className="flex items-center gap-2.5 text-xs font-bold text-gray-950 select-none cursor-pointer">
              <input type="checkbox" checked={Object.values(selectedShares).every(Boolean)} onChange={(e) => {
                const checked = e.target.checked;
                const updated: Record<string, boolean> = {};
                members.forEach(m => { updated[m.id] = checked; });
                setSelectedShares(updated);
              }} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4" />
              <span>{isTr ? "Böl" : "Split"}</span>
            </label>
            <select value={splitMode} onChange={(e) => setSplitMode(e.target.value as any)} className="bg-transparent text-xs font-bold text-gray-500 border-none outline-none focus:ring-0 cursor-pointer hover:text-gray-900 transition-colors pr-6">
              <option value="equal">{isTr ? "Eşit Olarak" : "Equally"}</option>
              <option value="ratio">{isTr ? "Paylara Göre" : "By Shares"}</option>
              <option value="amount">{isTr ? "Tutar Olarak" : "By Amounts"}</option>
            </select>
          </div>
          <div className="border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100 bg-white">
            {members.map(m => {
              const isChecked = !!selectedShares[m.id];
              const amountVal = parseFloat(formData.amount) || 0;
              const checkedCount = Object.values(selectedShares).filter(Boolean).length;
              const equalSplitAmount = checkedCount > 0 ? amountVal / checkedCount : 0;
              let displayValue = "";
              if (splitMode === "equal") {
                displayValue = isChecked ? `${getCurrencySymbol(project.currency)}${formatVal(equalSplitAmount)}` : `${getCurrencySymbol(project.currency)}0,00`;
              }
              return (
                <div key={m.id} className="flex justify-between items-center p-3.5 hover:bg-gray-50 transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0">
                    <input type="checkbox" checked={isChecked} onChange={() => toggleShare(m.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4.5 h-4.5" />
                    <span className="text-xs font-bold text-gray-700 truncate">{m.name}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {splitMode === "equal" && <span className="text-xs font-bold text-gray-400">{displayValue}</span>}
                    {splitMode === "ratio" && (
                      <div className="flex items-center gap-1.5">
                        <input type="number" disabled={!isChecked} min="0" step="any" placeholder="1" value={ratios[m.id] ?? (isChecked ? "1" : "0")} onChange={(e) => handleRatioChange(m.id, e.target.value)} className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-right text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40" />
                        {isChecked && <span className="text-[10px] text-gray-400 font-bold min-w-[50px] text-right">({getCurrencySymbol(project.currency)}{formatVal(calculatedRatioAmounts[m.id] || 0)})</span>}
                      </div>
                    )}
                    {splitMode === "amount" && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-gray-400">{getCurrencySymbol(project.currency)}</span>
                        <input type="number" disabled={!isChecked} min="0" step="0.01" placeholder="0.00" value={amounts[m.id] ?? ""} onChange={(e) => handleAmountChange(m.id, e.target.value)} className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-right text-xs font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {splitMode === "amount" && Math.abs(sumOfAmounts - (parseFloat(formData.amount) || 0)) > 0.02 && (
        <p className="text-[10px] font-bold text-red-500 pl-1">
          {isTr ? `Toplam tutar (${getCurrencySymbol(project.currency)}${formatVal(parseFloat(formData.amount) || 0)}) ile girilen tutarların toplamı (${getCurrencySymbol(project.currency)}${formatVal(sumOfAmounts)}) eşleşmiyor.` : `Total amount (${getCurrencySymbol(project.currency)}${formatVal(parseFloat(formData.amount) || 0)}) does not match sum of amounts (${getCurrencySymbol(project.currency)}${formatVal(sumOfAmounts)}).`}
        </p>
      )}

      <motion.button disabled={loading} whileTap={{ scale: 0.98 }} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold shadow-md h-12 flex items-center justify-center gap-2 active:scale-95 transition-all mt-4">
        {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <span>{isTr ? "Kaydet" : "Save"}</span>}
      </motion.button>
    </form>
  );
}
