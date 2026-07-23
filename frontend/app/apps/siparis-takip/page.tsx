"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Plus, UserPlus, Phone, InstagramLogo, Storefront, Calendar, MapPin, Notepad, CheckCircle, Warning, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { Toaster, toast } from "react-hot-toast";
import SiparisTakipShell from "./components/SiparisTakipShell";
import CustomerDrawer from "./components/CustomerDrawer";
import OrderDrawer from "./components/OrderDrawer";
import {
  getSummaryAction,
  getCustomersAction,
  getOrdersAction,
  upsertCustomerAction,
  upsertOrderAction,
  deleteCustomerAction,
  deleteOrderAction,
} from "./actions";
import { Customer, Order, SummaryStats } from "./types";

type TabType = "active" | "completed" | "customers";

export default function SiparisTakipPage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState("");

  // Drawers state
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSaving, setCustomerSaving] = useState(false);

  const [orderDrawerOpen, setOrderDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderSaving, setOrderSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    void loadData();
  }, [isLoaded, user?.id]);

  async function loadData() {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [statsRes, custRes, ordRes] = await Promise.all([
        getSummaryAction(user.id),
        getCustomersAction(user.id),
        getOrdersAction(user.id),
      ]);

      if (statsRes.error || custRes.error || ordRes.error) {
        toast.error(`Hata: ${statsRes.error || custRes.error || ordRes.error}`);
        console.error("Load data errors:", { stats: statsRes.error, customers: custRes.error, orders: ordRes.error });
      }

      setStats(statsRes.data);
      setCustomers(custRes.data ?? []);
      setOrders(ordRes.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  // Refresh helper
  async function refreshStatsAndOrders() {
    if (!user) return;
    const [statsRes, ordRes] = await Promise.all([
      getSummaryAction(user.id),
      getOrdersAction(user.id),
    ]);
    setStats(statsRes.data);
    setOrders(ordRes.data ?? []);
  }

  async function refreshAll() {
    if (!user) return;
    const [statsRes, custRes, ordRes] = await Promise.all([
      getSummaryAction(user.id),
      getCustomersAction(user.id),
      getOrdersAction(user.id),
    ]);
    setStats(statsRes.data);
    setCustomers(custRes.data ?? []);
    setOrders(ordRes.data ?? []);
  }

  // Customer handlers
  async function handleCustomerSubmit(data: {
    id?: string | null;
    name: string;
    phone: string;
    instagramUsername: string;
    address: string;
    notes: string;
  }) {
    if (!user) return;
    setCustomerSaving(true);
    try {
      const res = await upsertCustomerAction({
        ...data,
        userId: user.id,
      });

      if (res.error || !res.data) {
        toast.error(res.error || "Müşteri kaydedilemedi");
      } else {
        toast.success(data.id ? "Müşteri güncellendi" : "Müşteri oluşturuldu");
        setCustomerDrawerOpen(false);
        await refreshAll();
      }
    } finally {
      setCustomerSaving(false);
    }
  }

  async function handleCustomerDelete(customerId: string) {
    if (!user) return;
    const res = await deleteCustomerAction(customerId, user.id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Müşteri silindi");
      setCustomerDrawerOpen(false);
      await refreshAll();
    }
  }

  // Order handlers
  async function handleOrderSubmit(data: {
    id?: string | null;
    customerId: string;
    title: string;
    price: number;
    paidAmount: number;
    status: "received" | "in_progress" | "ready" | "delivered" | "cancelled";
    orderDate: string;
    deadline?: string | null;
    materialsNotes?: string | null;
    notes?: string | null;
  }) {
    if (!user) return;
    setOrderSaving(true);
    try {
      const res = await upsertOrderAction({
        ...data,
        userId: user.id,
      });

      if (res.error || !res.data) {
        toast.error(res.error || "Sipariş kaydedilemedi");
      } else {
        toast.success(data.id ? "Sipariş güncellendi" : "Sipariş kaydedildi");
        setOrderDrawerOpen(false);
        await refreshStatsAndOrders();
      }
    } finally {
      setOrderSaving(false);
    }
  }

  async function handleOrderDelete(orderId: string) {
    if (!user) return;
    const res = await deleteOrderAction(orderId, user.id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Sipariş silindi");
      setOrderDrawerOpen(false);
      await refreshStatsAndOrders();
    }
  }

  async function handleStatusChange(order: Order, nextStatus: Order["status"]) {
    if (!user) return;
    const res = await upsertOrderAction({
      id: order.id,
      userId: user.id,
      customerId: order.customerId,
      title: order.title,
      price: order.price,
      paidAmount: order.paidAmount,
      status: nextStatus,
      orderDate: order.orderDate,
      deadline: order.deadline,
      materialsNotes: order.materialsNotes,
      notes: order.notes,
    });

    if (res.error) {
      toast.error("Durum güncellenemedi");
    } else {
      toast.success("Sipariş durumu güncellendi");
      await refreshStatsAndOrders();
    }
  }

  // Formatting helpers
  const formatMoney = (val: number) => `₺${val.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
  
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Filter lists
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.instagramUsername && c.instagramUsername.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeOrders = orders.filter(o => 
    ["received", "in_progress", "ready"].includes(o.status) &&
    (o.title.toLowerCase().includes(searchQuery.toLowerCase()) || o.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const completedOrders = orders.filter(o => 
    ["delivered", "cancelled"].includes(o.status) &&
    (o.title.toLowerCase().includes(searchQuery.toLowerCase()) || o.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isLoaded || loading) {
    return (
      <SiparisTakipShell>
        <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </SiparisTakipShell>
    );
  }

  if (!user) {
    return (
      <SiparisTakipShell>
        <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center p-6 shadow-sm">
          <Storefront size={40} className="text-pink-500 mb-4" weight="duotone" />
          <p className="text-sm font-bold text-app-muted">Siparişlerinizi yönetmek için giriş yapın.</p>
        </div>
      </SiparisTakipShell>
    );
  }

  return (
    <SiparisTakipShell
      headerRight={
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setCustomerDrawerOpen(true);
            }}
            className="w-8 h-8 rounded-lg border border-app-border bg-app-surface flex items-center justify-center text-app-muted hover:text-pink-500 transition-all active:scale-95"
            title="Yeni Müşteri Ekle"
          >
            <UserPlus size={16} weight="bold" />
          </button>
          <button
            onClick={() => {
              setSelectedOrder(null);
              setOrderDrawerOpen(true);
            }}
            disabled={customers.length === 0}
            className="w-8 h-8 rounded-lg border border-app-border bg-app-surface flex items-center justify-center text-app-muted hover:text-pink-500 transition-all active:scale-95 disabled:opacity-50"
            title="Yeni Sipariş Ekle"
          >
            <Plus size={16} weight="bold" />
          </button>
        </div>
      }
    >
      <Toaster position="top-center" />

      {/* 1. Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-app-surface p-4 rounded-2xl border border-app-border shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black text-app-muted uppercase tracking-widest">
              Toplam Kazanç
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-500">
                {formatMoney(stats.totalEarnings)}
              </span>
            </div>
            <p className="text-[9px] text-app-muted font-bold mt-1">Ödemesi alınan siparişler</p>
          </div>

          <div className="bg-app-surface p-4 rounded-2xl border border-app-border shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black text-app-muted uppercase tracking-widest">
              Bekleyen Tahsilat
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-xl font-black text-amber-500">
                {formatMoney(stats.pendingPayments)}
              </span>
            </div>
            <p className="text-[9px] text-app-muted font-bold mt-1">Kalan / kapora dışı tutarlar</p>
          </div>
        </div>
      )}

      {/* 2. Navigation / Tabs */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              activeTab === "active"
                ? "bg-app-surface shadow-sm text-pink-600 dark:text-pink-400"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            Aktif ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              activeTab === "completed"
                ? "bg-app-surface shadow-sm text-pink-600 dark:text-pink-400"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            Tamamlanan ({completedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              activeTab === "customers"
                ? "bg-app-surface shadow-sm text-pink-600 dark:text-pink-400"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            Müşteriler ({customers.length})
          </button>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="relative mb-4">
        <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeTab === "customers"
              ? "Müşteri adı veya instagram ile ara..."
              : "Sipariş başlığı veya müşteri adı ile ara..."
          }
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-app-surface border border-app-border text-xs font-bold text-app-text outline-none focus:border-pink-500/40 placeholder:text-app-muted"
        />
      </div>

      {/* 4. Main Lists Content */}
      <div className="space-y-3">
        {/* Empty state: No customers registered */}
        {customers.length === 0 && (
          <div className="text-center py-10 bg-app-surface rounded-2xl border border-app-border p-6 shadow-sm">
            <Sparkle size={36} className="mx-auto text-pink-500 mb-3" weight="duotone" />
            <p className="text-sm font-bold text-app-text mb-1">Müşteri listeniz boş</p>
            <p className="text-xs text-app-muted mb-4">Sipariş eklemeden önce en az bir müşteri oluşturmalısınız.</p>
            <button
              onClick={() => {
                setSelectedCustomer(null);
                setCustomerDrawerOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-black active:scale-95 transition-all"
            >
              <UserPlus size={14} weight="bold" />
              İlk Müşteriyi Ekle
            </button>
          </div>
        )}

        {/* Tab 1: Active Orders */}
        {customers.length > 0 && activeTab === "active" && (
          <>
            {activeOrders.length === 0 ? (
              <div className="text-center py-12 text-app-muted text-xs font-bold">
                Aktif sipariş bulunmuyor.
              </div>
            ) : (
              activeOrders.map(order => {
                const isPaidAll = order.paidAmount >= order.price;
                const remaining = order.price - order.paidAmount;

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrder(order);
                      setOrderDrawerOpen(true);
                    }}
                    className="p-4 bg-app-surface rounded-2xl border border-app-border hover:border-pink-500/30 transition-all cursor-pointer shadow-sm relative overflow-hidden"
                  >
                    {/* Top row: Customer name & status badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-xs font-black uppercase text-app-muted">
                          {order.customerName}
                        </h4>
                        <h3 className="text-sm font-bold text-app-text mt-0.5">
                          {order.title}
                        </h3>
                      </div>
                      
                      {/* Status Badges */}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        order.status === "received" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30" :
                        order.status === "in_progress" ? "bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30" :
                        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30" // ready
                      }`}>
                        {order.status === "received" ? "Alındı" :
                         order.status === "in_progress" ? "Örülüyor" : "Hazır"}
                      </span>
                    </div>

                    {/* Middle row: materials info if any */}
                    {order.materialsNotes && (
                      <p className="text-xs text-app-muted flex items-center gap-1 mb-2.5">
                        <Notepad size={14} className="text-pink-500 shrink-0" />
                        <span className="truncate">{order.materialsNotes}</span>
                      </p>
                    )}

                    {/* Divider */}
                    <div className="h-[1px] bg-app-border my-2.5 w-full" />

                    {/* Bottom row: Prices, deadline and Actions */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4 text-app-muted">
                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-pink-500" />
                          <span className={`font-bold ${
                            order.deadline && new Date(order.deadline) < new Date() && order.status !== "ready"
                              ? "text-red-500"
                              : ""
                          }`}>
                            {formatDate(order.deadline)}
                          </span>
                        </div>
                        <div className="font-bold">
                          Kalan: <span className={remaining > 0 ? "text-amber-500 font-extrabold" : "text-emerald-600 font-extrabold"}>
                            {remaining > 0 ? formatMoney(remaining) : "Ödendi"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <span className="font-black text-app-text">{formatMoney(order.price)}</span>
                        {order.status !== "ready" && (
                          <button
                            onClick={() => handleStatusChange(order, "ready")}
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/30 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30"
                            title="Hazır olarak işaretle"
                          >
                            <CheckCircle size={14} weight="bold" />
                          </button>
                        )}
                        {order.status === "ready" && (
                          <button
                            onClick={() => handleStatusChange(order, "delivered")}
                            className="p-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/30 text-pink-600 text-[10px] font-black uppercase tracking-wider"
                          >
                            Teslim Et
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Tab 2: Completed Orders */}
        {customers.length > 0 && activeTab === "completed" && (
          <>
            {completedOrders.length === 0 ? (
              <div className="text-center py-12 text-app-muted text-xs font-bold">
                Tamamlanan sipariş bulunmuyor.
              </div>
            ) : (
              completedOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setOrderDrawerOpen(true);
                  }}
                  className="p-4 bg-app-surface rounded-2xl border border-app-border hover:border-pink-500/30 transition-all cursor-pointer shadow-sm opacity-80"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-xs font-black uppercase text-app-muted">
                        {order.customerName}
                      </h4>
                      <h3 className="text-sm font-bold text-app-text mt-0.5 line-through">
                        {order.title}
                      </h3>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      order.status === "delivered" ? "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400" : "bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/30"
                    }`}>
                      {order.status === "delivered" ? "Teslim Edildi" : "İptal"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-app-muted mt-4">
                    <span>Teslim: {formatDate(order.orderDate)}</span>
                    <span className="font-black text-app-text">{formatMoney(order.price)}</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Tab 3: Customers List */}
        {customers.length > 0 && activeTab === "customers" && (
          <>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-app-muted text-xs font-bold">
                Müşteri bulunamadı.
              </div>
            ) : (
              filteredCustomers.map(customer => (
                <div
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setCustomerDrawerOpen(true);
                  }}
                  className="p-4 bg-app-surface rounded-2xl border border-app-border hover:border-pink-500/30 transition-all cursor-pointer shadow-sm relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-app-text">{customer.name}</h3>
                      
                      <div className="flex flex-col gap-1 mt-2 text-xs text-app-muted font-bold">
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone size={13} className="text-pink-500" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.instagramUsername && (
                          <div className="flex items-center gap-1">
                            <InstagramLogo size={13} className="text-pink-500" />
                            <span>@{customer.instagramUsername}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center gap-1">
                            <MapPin size={13} className="text-pink-500 shrink-0" />
                            <span className="truncate max-w-[200px]">{customer.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2.5 py-1 rounded-xl bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 text-[10px] font-black uppercase tracking-wider">
                        {customer.orderCount} Sipariş
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Customer Drawer */}
      <CustomerDrawer
        open={customerDrawerOpen}
        onOpenChange={setCustomerDrawerOpen}
        customer={selectedCustomer}
        onSubmit={handleCustomerSubmit}
        onDelete={handleCustomerDelete}
        saving={customerSaving}
      />

      {/* Order Drawer */}
      <OrderDrawer
        open={orderDrawerOpen}
        onOpenChange={setOrderDrawerOpen}
        order={selectedOrder}
        customers={customers}
        onSubmit={handleOrderSubmit}
        onDelete={handleOrderDelete}
        onOpenAddCustomer={() => {
          setSelectedCustomer(null);
          setCustomerDrawerOpen(true);
        }}
        saving={orderSaving}
      />
    </SiparisTakipShell>
  );
}
