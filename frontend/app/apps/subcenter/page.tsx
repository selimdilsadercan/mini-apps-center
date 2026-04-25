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
  X,
  Receipt,
  Scan,
  Barcode,
  Globe,
  Stack,
  PencilSimple
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";

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

export default function SubscriptionCenter() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // UI States for Form
  const [newSub, setNewSub] = useState<Partial<Subscription>>({
    name: "",
    plan_name: "Standard",
    region: "TR",
    price: 0,
    cycle: "monthly",
    category: "Entertainment",
    color: "#6366F1",
    icon: "💳",
    start_date: new Date().toISOString().split('T')[0]
  });

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

  const addPreset = (preset: ServicePreset) => {
    setEditingId(null);
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
      start_date: new Date().toISOString().split('T')[0]
    });
    setShowAddModal(true);
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
      start_date: new Date(sub.start_date).toISOString().split('T')[0]
    });
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

      setShowAddModal(false);
      setEditingId(null);
      setNewSub({ name: "", plan_name: "Standard", region: "TR", price: 0, cycle: "monthly", category: "Entertainment", color: "#6366F1", icon: "💳" });
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
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Global Billing Hub</p>
            </div>
          </div>
          
          <button onClick={() => { setEditingId(null); setShowAddModal(true); }} className="flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all active:scale-95 font-black text-[11px] uppercase tracking-widest cursor-pointer">
            <Plus size={16} weight="bold" />
            <span>Issue Bill</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 space-y-12">
        
        {/* Service Catalog Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
               <Globe size={18} weight="bold" />
             </div>
             <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Service Catalog (v2026)</h3>
             <div className="h-px bg-slate-200 flex-1" />
          </div>
          
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide px-1">
            {Array.from(new Set(SERVICE_CATALOG.map(s => s.name))).map((serviceName, idx) => {
              const preset = SERVICE_CATALOG.find(p => p.name === serviceName)!;
              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => addPreset(preset)}
                  className="flex-shrink-0 flex flex-col items-center justify-center gap-4 bg-white hover:bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 transition-all w-[130px] group text-center cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl bg-slate-50 border border-slate-100">
                    {preset.icon || "💳"}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter leading-tight break-words">{preset.name}</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{SERVICE_CATALOG.filter(p => p.name === serviceName).length} Plans</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* User Invoices Feed */}
        <section className="space-y-8">
           <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <h3 className="text-sm font-black text-slate-800 uppercase">Active Invoices</h3>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{subscriptions.length} records active</span>
              </div>
              <div className="text-right">
                 <span className="block text-[10px] font-black text-slate-400 uppercase tracking-tighter">Running Total/mo</span>
                 <span className="text-2xl font-black text-indigo-600 tracking-tighter leading-none">₺ {monthlyTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
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
                    {/* PAPER RECEIPT CARD */}
                    <div className="bg-[#FCFBF9] min-h-[380px] shadow-2xl shadow-indigo-200/20 flex flex-col border border-slate-200/60 relative group-hover:-translate-y-2 transition-transform duration-500">
                       
                       {/* Header Section */}
                       <div className="px-6 py-6 border-b border-dashed border-slate-300">
                          <div className="flex justify-between items-start mb-4">
                             <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-white border border-slate-100 shadow-sm relative">
                                <span className="relative z-10">{sub.icon}</span>
                                <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                             </div>
                             <div className="text-right">
                                <span className="block text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Doc Code</span>
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">#{sub.id.substring(0, 8).toUpperCase()}</span>
                             </div>
                          </div>
                          <div>
                             <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">{sub.name}</h4>
                             <div className="flex items-center gap-2 mt-2">
                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">
                                   {sub.plan_name}
                                </span>
                                <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded uppercase">
                                   {sub.region}
                                </span>
                             </div>
                          </div>
                       </div>

                       {/* Receipt Items (Realistic Breakdown) */}
                       <div className="flex-1 px-6 py-8 flex flex-col relative overflow-hidden">
                          <div className="space-y-4 font-mono">
                             <div className="space-y-2 border-b border-slate-100 pb-4 opacity-70">
                                <div className="flex justify-between items-baseline">
                                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Base Subscription</span>
                                   <span className="text-[10px] font-bold text-slate-600">₺ {(sub.price * 0.8333).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">VAT / KDV (20%)</span>
                                   <span className="text-[10px] font-bold text-slate-600">₺ {(sub.price * 0.1667).toFixed(2)}</span>
                                </div>
                             </div>
                             
                             <div className="flex justify-between items-baseline pt-2">
                                <span className="text-[12px] font-black text-slate-900 uppercase">Grand Total</span>
                                <span className="text-xl font-black text-indigo-600 tracking-tighter">₺ {sub.price.toFixed(2)}</span>
                             </div>
                          </div>

                          <div className="mt-8 pt-4 border-t-2 border-slate-50 space-y-2">
                              <div className="flex items-center gap-2">
                                 <Calendar size={12} weight="bold" className="text-slate-400" />
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Next Renewal</span>
                              </div>
                              <div className="flex flex-col gap-1">
                                 <span className="text-xs font-black text-slate-800 uppercase">
                                    {new Date(sub.start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                 </span>
                                 {(() => {
                                    const diff = new Date(sub.start_date).getTime() - new Date().getTime();
                                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                    return (
                                       <span className={`text-[10px] font-bold uppercase tracking-widest ${days <= 3 ? 'text-red-500 font-black' : 'text-slate-400 opacity-60'}`}>
                                          {days > 0 ? `(in ${days} days)` : days === 0 ? "(today)" : `(${Math.abs(days)} days ago)`}
                                       </span>
                                    );
                                 })()}
                              </div>
                          </div>

                       </div>

                       {/* Action Footer */}
                       <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-200/50 flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              <Info size={14} weight="bold" />
                              Report
                           </div>
                           
                           <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleEdit(sub)}
                                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-100 rounded-full transition-all active:scale-90 cursor-pointer"
                              >
                                <PencilSimple size={18} weight="bold" />
                              </button>
                              <button 
                                onClick={() => setShowDeleteConfirm(sub.id)} 
                                className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-white border border-transparent hover:border-slate-100 rounded-full transition-all active:scale-90 cursor-pointer"
                              >
                                <Trash size={18} weight="bold" />
                              </button>
                           </div>
                       </div>

                       {/* Zigzag Scissors Bottom */}
                       <div className="absolute left-0 bottom-0 w-full flex pointer-events-none">
                          {Array.from({ length: 40 }).map((_, i) => (
                             <div key={i} className="flex-shrink-0 w-4 h-4 bg-[#F3F4F6] rotate-45 transform translate-y-2 -translate-x-1" />
                          ))}
                       </div>
                    </div>

                    {/* Stamp Effect on Hover */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-700 scale-150 opacity-0 group-hover:opacity-20 group-hover:scale-95 -rotate-12">
                       <div className="border-[8px] border-emerald-600 text-emerald-600 px-8 py-3 rounded-2xl font-black text-5xl uppercase tracking-[0.3em]">
                         Paid
                       </div>
                    </div>
                  </motion.div>
                ))}
             </AnimatePresence>
           </div>
        </section>
      </main>

      {/* Manual Add / Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden" >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 font-bold">
                        {editingId ? <PencilSimple size={24} weight="bold" /> : <Stack size={24} weight="bold" />}
                     </div>
                     <h2 className="text-xl font-black text-slate-800 uppercase">
                        {editingId ? "Correct Bill" : "Issue New Bill"}
                     </h2>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-full text-slate-300 cursor-pointer">
                    <X size={20} weight="bold" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Plan Picker from Catalog */}
                  {SERVICE_CATALOG.some(p => p.name === newSub.name) && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Quick Select Plan</label>
                       <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide font-bold italic">
                          {SERVICE_CATALOG.filter(p => p.name === newSub.name).map((p, i) => (
                             <button
                                key={i}
                                onClick={() => {
                                  setNewSub({
                                    ...newSub,
                                    plan_name: p.plan_name,
                                    price: p.price,
                                    region: p.region,
                                    currency: p.currency,
                                    category: p.category,
                                    color: p.color
                                  });
                                }}
                                className={`flex-shrink-0 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                  newSub.plan_name === p.plan_name 
                                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                                    : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                                }`}
                             >
                               {p.plan_name} - ₺{p.price}
                             </button>
                          ))}
                       </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Vendor / Service</label>
                    <input type="text" placeholder="e.g. Netflix, YouTube" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all uppercase" value={newSub.name} onChange={(e) => setNewSub({...newSub, name: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Plan Level</label>
                      <input type="text" placeholder="Family, Basic..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all uppercase" value={newSub.plan_name} onChange={(e) => setNewSub({...newSub, plan_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Region</label>
                      <input type="text" placeholder="TR, US..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-indigo-600 focus:bg-white transition-all uppercase" value={newSub.region} onChange={(e) => setNewSub({...newSub, region: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Amount (₺)</label>
                      <input type="number" placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black font-mono focus:outline-none focus:border-indigo-500 transition-all" value={newSub.price || ""} onChange={(e) => setNewSub({...newSub, price: parseFloat(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-1">Cycle</label>
                      <div className="relative">
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer uppercase" value={newSub.cycle} onChange={(e) => setNewSub({...newSub, cycle: e.target.value})} >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold uppercase tracking-tighter text-[10px]">v</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={handleSaveSubscription} className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.4em] text-[12px] mt-4" >
                  <CheckCircle size={24} weight="fill" />
                  {editingId ? "Update Bill" : "Finalize Invoice"}
                </button>
              </div>
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
               <h3 className="text-xl font-black text-slate-800 uppercase mb-2">Void Receipt?</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                  This transaction will be permanently removed from your billing history.
               </p>
               
               <div className="grid grid-cols-2 gap-4 mt-10">
                  <button 
                    disabled={isDeleting}
                    onClick={() => setShowDeleteConfirm(null)} 
                    className="py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Keep It
                  </button>
                  <button 
                    disabled={isDeleting}
                    onClick={() => removeSub(showDeleteConfirm!)} 
                    className="py-4 rounded-2xl bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-700 shadow-lg shadow-red-200 transition-all cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isDeleting && (
                       <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {isDeleting ? "Processing..." : "void & delete"}
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
