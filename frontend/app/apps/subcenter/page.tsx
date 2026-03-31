"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Trash, 
  CreditCard, 
  Calendar,
  Wallet,
  CheckCircle,
  CaretRight,
  ChartPieSlice,
  Info,
  Clock,
  CurrencyCircleDollar,
  X
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import Client, { Local } from "@/lib/client";
import { useUser } from "@clerk/clerk-react";

const client = new Client(Local);

// Backend Types
interface Subscription {
  id: string;
  user_id: string;
  name: string;
  price: number;
  currency: string;
  cycle: string;
  category: string;
  color: string;
  icon: string;
  start_date: string;
  created_at: string;
}

const PRESETS = [
  { name: "Netflix", price: 149.99, color: "#E50914", category: "Entertainment", icon: "🎬" },
  { name: "Spotify", price: 59.99, color: "#1DB954", category: "Music", icon: "🎵" },
  { name: "YouTube Premium", price: 79.99, color: "#FF0000", category: "Entertainment", icon: "📺" },
  { name: "iCloud+", price: 12.99, color: "#3B82F6", category: "Cloud", icon: "☁️" },
  { name: "Amazon Prime", price: 39.00, color: "#FF9900", category: "Entertainment", icon: "📦" },
  { name: "ChatGPT Plus", price: 650.00, color: "#10A37F", category: "AI", icon: "🤖" },
];

export default function SubscriptionCenter() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // UI States for Form
  const [newSub, setNewSub] = useState<Partial<Subscription>>({
    name: "",
    price: 0,
    cycle: "monthly",
    category: "Entertainment",
    color: "#6366F1",
    icon: "💳",
    start_date: new Date().toISOString().split('T')[0]
  });

  const fetchSubscriptions = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const resp = await client.subcenter.getUserSubscriptions(user.id);
      setSubscriptions(resp.subscriptions);
    } catch (err) {
      console.error("Failed to load subs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isUserLoaded && user?.id) {
      fetchSubscriptions();
    }
  }, [isUserLoaded, user?.id]);

  const addPreset = (preset: any) => {
    setNewSub({
      name: preset.name,
      price: preset.price,
      cycle: "monthly",
      category: preset.category,
      color: preset.color,
      icon: preset.icon,
      start_date: new Date().toISOString().split('T')[0]
    });
    setShowAddModal(true);
  };

  const handleSaveSubscription = async () => {
    if (!user?.id || !newSub.name || !newSub.price) return;
    
    try {
      const resp = await client.subcenter.createSubscription({
        userId: user.id,
        name: newSub.name,
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
        setShowAddModal(false);
        setNewSub({ name: "", price: 0, cycle: "monthly", category: "Entertainment", color: "#6366F1", icon: "💳" });
      }
    } catch (err) {
      console.error("Create error:", err);
    }
  };

  const removeSub = async (id: string) => {
    if (!user?.id) return;
    try {
      const resp = await client.subcenter.deleteSubscription(id, { userId: user.id });
      if (resp.success) {
        setSubscriptions(subscriptions.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Stats
  const monthlyTotal = useMemo(() => {
    return subscriptions.reduce((acc, sub) => acc + (sub.cycle === 'monthly' ? sub.price : sub.price / 12), 0);
  }, [subscriptions]);

  const yearlyTotal = useMemo(() => monthlyTotal * 12, [monthlyTotal]);

  if (!isUserLoaded) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 transition-all active:scale-95"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Subscription Center</h1>
              <p className="text-[11px] text-slate-500 font-medium">Keep track of your monthly spending</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full shadow-lg shadow-indigo-200 transition-all active:scale-95 font-semibold text-sm"
          >
            <Plus size={16} weight="bold" />
            <span>Add Manual</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 space-y-12">
        
        {/* Quick Add Presets (Like your Hub Icons) */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
             <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest px-1">Quick Presets</h3>
             <div className="h-px bg-slate-200 flex-1" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
            {PRESETS.map((preset, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addPreset(preset)}
                className="flex-shrink-0 flex flex-col items-center justify-center gap-3 bg-white hover:bg-slate-50 p-6 rounded-[1.8rem] border border-slate-200 shadow-sm transition-all w-[110px]"
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner-white"
                  style={{ backgroundColor: preset.color + '08', border: `1px solid ${preset.color}20` }}
                >
                  {preset.icon}
                </div>
                <span className="text-[11px] font-bold text-slate-600 text-center">{preset.name}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Subscription List (Chill Card Style) */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
             <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest px-1">Active Plans</h3>
             <div className="h-px bg-slate-200 flex-1" />
             <div className="flex items-center gap-2 group cursor-pointer">
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{subscriptions.length} Found</span>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {subscriptions.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="sm:col-span-2 flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-200 border-dashed"
                >
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                    <CreditCard size={32} />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">Your list is currently empty</p>
                </motion.div>
              ) : (
                subscriptions.map((sub, idx) => (
                  <motion.div
                    key={sub.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="group relative bg-white p-5 rounded-[2rem] border border-slate-200/80 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner relative overflow-hidden"
                          style={{ backgroundColor: sub.color + '05', border: `1px solid ${sub.color}15` }}
                        >
                           <div className="absolute top-0 right-0 w-8 h-8 rounded-full blur-xl opacity-20" style={{ backgroundColor: sub.color }} />
                           <span className="relative z-10">{sub.icon}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-slate-800">{sub.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{sub.category}</span>
                             <div className="w-1 h-1 rounded-full bg-slate-200" />
                             <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-md uppercase tracking-tighter">{sub.cycle}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                         <div className="flex items-baseline gap-0.5">
                            <span className="text-sm font-bold text-slate-400">₺</span>
                            <span className="text-xl font-black text-slate-900">{sub.price.toFixed(2)}</span>
                         </div>
                         <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                               <Clock size={10} weight="bold" />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase">Next: {new Date(sub.start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                         </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                       <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors">
                          <Info size={14} />
                          <span>PLAN DETAILS</span>
                       </button>
                       <button 
                        onClick={() => removeSub(sub.id)}
                        className="w-8 h-8 rounded-full bg-white hover:bg-red-50 border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all active:scale-90"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>

      </main>

      {/* Floating Plus for Mobile */}
      <div className="fixed bottom-10 right-8 flex justify-center sm:hidden">
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-300 transition-transform active:scale-95"
        >
          <Plus size={28} weight="bold" className="text-white" />
        </button>
      </div>

      {/* Manual Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden border border-slate-100"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">New Subscription</h2>
                  <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-full text-slate-400">
                    <X size={18} weight="bold" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Plan Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Netflix, Gym..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-all font-sans"
                      value={newSub.name}
                      onChange={(e) => setNewSub({...newSub, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Price</label>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all font-mono"
                        value={newSub.price || ""}
                        onChange={(e) => setNewSub({...newSub, price: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cycle</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                        value={newSub.cycle}
                        onChange={(e) => setNewSub({...newSub, cycle: e.target.value})}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Category</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                       {["Entertainment", "Music", "Cloud", "AI", "Other"].map((cat) => (
                         <button
                           key={cat}
                           onClick={() => setNewSub({...newSub, category: cat})}
                           className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all uppercase tracking-tight ${newSub.category === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                         >
                           {cat}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveSubscription}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                >
                  <Plus size={18} weight="bold" />
                  Save Subscription
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
