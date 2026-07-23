"use client";

import { useEffect, useState } from "react";
import { X, Trash, Plus } from "@phosphor-icons/react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Order, Customer } from "../types";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

interface OrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  customers: Customer[];
  onSubmit: (data: {
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
  }) => Promise<void>;
  onDelete?: (orderId: string) => Promise<void>;
  onOpenAddCustomer?: () => void;
  saving: boolean;
}

export default function OrderDrawer({
  open,
  onOpenChange,
  order,
  customers,
  onSubmit,
  onDelete,
  onOpenAddCustomer,
  saving,
}: OrderDrawerProps) {
  const [customerId, setCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [status, setStatus] = useState<"received" | "in_progress" | "ready" | "delivered" | "cancelled">("received");
  const [orderDate, setOrderDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [materialsNotes, setMaterialsNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { confirm } = useConfirmDialog();

  useEffect(() => {
    // Format date as YYYY-MM-DD
    const todayStr = new Date().toISOString().split("T")[0];

    if (order) {
      setCustomerId(order.customerId || "");
      setTitle(order.title || "");
      setPrice(order.price || 0);
      setPaidAmount(order.paidAmount || 0);
      setStatus(order.status || "received");
      setOrderDate(order.orderDate ? order.orderDate.split("T")[0] : todayStr);
      setDeadline(order.deadline ? order.deadline.split("T")[0] : "");
      setMaterialsNotes(order.materialsNotes || "");
      setNotes(order.notes || "");
    } else {
      setCustomerId(customers[0]?.id || "");
      setTitle("");
      setPrice(0);
      setPaidAmount(0);
      setStatus("received");
      setOrderDate(todayStr);
      setDeadline("");
      setMaterialsNotes("");
      setNotes("");
    }
  }, [order, open, customers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !title.trim()) return;
    await onSubmit({
      id: order?.id || null,
      customerId,
      title: title.trim(),
      price,
      paidAmount,
      status,
      orderDate,
      deadline: deadline || null,
      materialsNotes: materialsNotes.trim() || null,
      notes: notes.trim() || null,
    });
  }

  async function handleDeleteClick() {
    if (!order || !onDelete) return;
    const isConfirmed = await confirm({
      title: "Siparişi Sil",
      description: `${order.title} siparişini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      confirmText: "Sil",
      cancelText: "Vazgeç",
    });

    if (isConfirmed) {
      setDeleting(true);
      try {
        await onDelete(order.id);
      } finally {
        setDeleting(false);
      }
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-xl mx-auto rounded-t-3xl border-t border-app-border bg-app-surface max-h-[85vh] flex flex-col">
        <DrawerHeader className="px-4 pt-2 pb-0 text-left shrink-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-base font-black text-app-text uppercase tracking-tight">
              {order ? "Siparişi Düzenle" : "Yeni Sipariş Ekle"}
            </DrawerTitle>
            <div className="flex items-center gap-2">
              {order && onDelete && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={deleting || saving}
                  className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                  title="Siparişi Sil"
                >
                  <Trash size={16} weight="bold" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full bg-app-surface-muted flex items-center justify-center text-app-muted hover:text-app-text transition-all active:scale-95"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          </div>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 pb-6 pt-3 space-y-4">
          {/* Customer Selection */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
                Müşteri *
              </label>
              {onOpenAddCustomer && (
                <button
                  type="button"
                  onClick={onOpenAddCustomer}
                  className="text-xs text-pink-500 font-bold flex items-center gap-0.5 hover:underline"
                >
                  <Plus size={12} weight="bold" /> Yeni Müşteri Ekle
                </button>
              )}
            </div>
            {customers.length === 0 ? (
              <div className="p-3 bg-app-surface-muted rounded-xl border border-app-border text-center text-xs font-bold text-app-muted">
                Henüz müşteri eklenmemiş. Lütfen önce yeni müşteri ekleyin.
              </div>
            ) : (
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40"
              >
                <option value="" disabled>Müşteri Seçin</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.instagramUsername ? `(@${c.instagramUsername})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Order Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
              Sipariş Edilen İş / Ürün *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: 90x90 Mavi Bebek Battaniyesi"
              required
              className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40 placeholder:text-app-muted"
            />
          </div>

          {/* Price & Paid Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
                Toplam Fiyat (₺)
              </label>
              <input
                value={price || ""}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="0"
                type="number"
                min="0"
                className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40 placeholder:text-app-muted"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
                Ödenen / Kapora (₺)
              </label>
              <input
                value={paidAmount || ""}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                placeholder="0"
                type="number"
                min="0"
                className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40 placeholder:text-app-muted"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
              Durum
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40"
            >
              <option value="received">Alındı (Yeni)</option>
              <option value="in_progress">Örülüyor / Yapılıyor</option>
              <option value="ready">Hazır (Teslime Hazır)</option>
              <option value="delivered">Teslim Edildi / Gönderildi</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
                Sipariş Tarihi
              </label>
              <input
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                type="date"
                required
                className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
                Teslim Hedefi / Deadline
              </label>
              <input
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                type="date"
                className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40"
              />
            </div>
          </div>

          {/* Materials Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
              Kullanılan İpler / Malzemeler (Marka, Renk Kodu vb.)
            </label>
            <input
              value={materialsNotes}
              onChange={(e) => setMaterialsNotes(e.target.value)}
              placeholder="Örn: Alize Diva Baby Pink - 182 (3 yumak), Şiş No: 3.5"
              className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40 placeholder:text-app-muted"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
              Detaylı Notlar
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örnek model bağlantısı, özel ölçüler, istekler..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40 placeholder:text-app-muted resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !customerId || !title.trim() || deleting}
            className="w-full py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {saving ? "Kaydediliyor..." : order ? "Siparişi Güncelle" : "Siparişi Kaydet"}
          </button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
