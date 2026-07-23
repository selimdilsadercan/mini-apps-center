"use client";

import { useEffect, useState } from "react";
import { X, Trash } from "@phosphor-icons/react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Customer } from "../types";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

interface CustomerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSubmit: (data: {
    id?: string | null;
    name: string;
    phone: string;
    instagramUsername: string;
    address: string;
    notes: string;
  }) => Promise<void>;
  onDelete?: (customerId: string) => Promise<void>;
  saving: boolean;
}

export default function CustomerDrawer({
  open,
  onOpenChange,
  customer,
  onSubmit,
  onDelete,
  saving,
}: CustomerDrawerProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { confirm } = useConfirmDialog();

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setPhone(customer.phone || "");
      setInstagram(customer.instagramUsername || "");
      setAddress(customer.address || "");
      setNotes(customer.notes || "");
    } else {
      setName("");
      setPhone("");
      setInstagram("");
      setAddress("");
      setNotes("");
    }
  }, [customer, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit({
      id: customer?.id || null,
      name: name.trim(),
      phone: phone.trim(),
      instagramUsername: instagram.trim().replace(/^@/, ""), // Remove leading @ if typed
      address: address.trim(),
      notes: notes.trim(),
    });
  }

  async function handleDeleteClick() {
    if (!customer || !onDelete) return;
    const isConfirmed = await confirm({
      title: "Müşteriyi Sil",
      description: `${customer.name} isimli müşteriyi silmek istediğinize emin misiniz? Eğer bu müşteriye ait siparişler varsa silme işlemi başarısız olacaktır.`,
      confirmText: "Sil",
      cancelText: "Vazgeç",
    });

    if (isConfirmed) {
      setDeleting(true);
      try {
        await onDelete(customer.id);
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
              {customer ? "Müşteriyi Düzenle" : "Yeni Müşteri"}
            </DrawerTitle>
            <div className="flex items-center gap-2">
              {customer && onDelete && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={deleting || saving}
                  className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                  title="Müşteriyi Sil"
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
          <div className="space-y-1">
            <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
              Ad Soyad *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Ayşe Yılmaz"
              required
              className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40 placeholder:text-app-muted"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
                Telefon
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Örn: 05551234567"
                type="tel"
                className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40 placeholder:text-app-muted"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
                Instagram
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-sm font-bold text-app-muted">@</span>
                <input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="kullanici_adi"
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40 placeholder:text-app-muted"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
              Adres
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Teslimat adresi..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40 placeholder:text-app-muted resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-app-muted uppercase tracking-widest block">
              Notlar (Ölçü, Tercihler vb.)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Müşteriyle ilgili genel notlar..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-app-surface-muted border border-app-border text-sm font-bold text-app-text outline-none focus:border-pink-500/40 placeholder:text-app-muted resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !name.trim() || deleting}
            className="w-full py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {saving ? "Kaydediliyor..." : customer ? "Değişiklikleri Kaydet" : "Müşteri Oluştur"}
          </button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
