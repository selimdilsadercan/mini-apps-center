"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { workplaces } from "@/lib/client";
import { PlaceCard, Checkbox } from "../components/PlaceCard";
import { Coffee, MagnifyingGlass, WifiHigh, Car, Plug, ShieldCheck } from "@phosphor-icons/react";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";

export default function AdminQueuePage() {
  const t = useTranslations("workplaces");
  const { user, isLoaded } = useUser();
  const client = useMemo(() => createBrowserClient(), []);
  const router = useRouter();

  const [places, setPlaces] = useState<workplaces.Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState<workplaces.Place | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    note: "",
    url: "",
    wifi: false,
    parking: false,
    power_outlets: false,
    quiet_level: 3,
    tags: "",
  });

  const checkAdminAndFetch = useCallback(async () => {
    if (!user?.id) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const adminRes = await client.users.checkAdmin(user.id);
      setIsAdmin(adminRes.isAdmin);

      if (!adminRes.isAdmin) {
        toast.error("Yetkisiz erişim. Yetkili kullanıcı girişi yapın.");
        router.push("/apps/workplaces");
        return;
      }

      const res = await client.workplaces.listPendingPlaces(user.id);
      setPlaces(res.places ?? []);
    } catch (err) {
      console.error("Admin check or fetch failed:", err);
      toast.error("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, client, router]);

  useEffect(() => {
    if (isLoaded) {
      checkAdminAndFetch();
    }
  }, [isLoaded, checkAdminAndFetch]);

  const handleApprove = async (placeId: string) => {
    if (!user?.id) return;
    try {
      await client.workplaces.approvePlace({
        placeId,
        userId: user.id,
      });
      toast.success("Mekan onaylandı ve yayına alındı.");
      setPlaces((prev) => prev.filter((p) => p.id !== placeId));
    } catch (err) {
      console.error("Failed to approve place:", err);
      toast.error("Mekan onaylanamadı.");
    }
  };

  const handleReject = async (placeId: string) => {
    if (!user?.id) return;
    if (!window.confirm("Bu öneriyi silmek/reddetmek istediğinize emin misiniz?")) return;
    try {
      await client.workplaces.deletePlace({
        placeId,
        userId: user.id,
      });
      toast.success("Öneri reddedildi ve silindi.");
      setPlaces((prev) => prev.filter((p) => p.id !== placeId));
    } catch (err) {
      console.error("Failed to reject place:", err);
      toast.error("Mekan silinemedi.");
    }
  };

  const handleEditClick = (place: workplaces.Place) => {
    setEditingPlace(place);
    setEditForm({
      name: place.name,
      note: place.note || "",
      url: place.url || "",
      wifi: place.wifi || false,
      parking: place.parking || false,
      power_outlets: place.power_outlets || false,
      quiet_level: place.quiet_level || 3,
      tags: place.tags.join(", "),
    });
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingPlace(null);
  };

  const handleUpdatePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlace || !user?.id) return;

    try {
      await client.workplaces.updatePlace({
        id: editingPlace.id,
        userId: user.id,
        name: editForm.name,
        note: editForm.note,
        url: editForm.url,
        wifi: editForm.wifi,
        parking: editForm.parking,
        power_outlets: editForm.power_outlets,
        quiet_level: editForm.quiet_level,
        tags: editForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Mekan başarıyla güncellendi.");
      handleCloseModal();
      // Reload pending queue
      const res = await client.workplaces.listPendingPlaces(user.id);
      setPlaces(res.places ?? []);
    } catch (err) {
      console.error("Failed to update pending place:", err);
      toast.error("Güncelleme başarısız.");
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin" />
        <p className="text-neutral-500 font-medium">{t("loading")}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-28">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 to-neutral-800 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <ShieldCheck size={32} weight="fill" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Öneri Onay Havuzu</h1>
            <p className="text-white/80 text-xs mt-1">
              Kullanıcılar tarafından önerilen mekanları inceleyin, düzenleyin, onaylayın veya silin.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        {places.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {places.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onToggleFavorite={() => {}}
                  onToggleVisited={() => {}}
                  isAdmin={true}
                  isPending={true}
                  onApprove={handleApprove}
                  onDelete={handleReject}
                  onEdit={handleEditClick}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-neutral-300">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coffee size={32} className="text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900">Bekleyen Öneri Yok</h3>
            <p className="text-neutral-500 text-sm mt-2">Şu an onaylanmayı bekleyen herhangi bir mekan önerisi bulunmuyor.</p>
          </div>
        )}
      </div>

      {/* Edit Pending Place Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-6 border-b">
                <h2 className="text-xl font-bold text-neutral-900">Öneriyi Düzenle</h2>
                <p className="text-neutral-500 text-sm mt-1">Önerilen mekana ait bilgileri onay öncesinde güncelleyebilirsiniz.</p>
              </div>
              <form onSubmit={handleUpdatePlace} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">{t("modal.name")}</label>
                  <input
                    required
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">{t("modal.notes")}</label>
                  <textarea
                    value={editForm.note}
                    onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all h-24 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">{t("modal.mapsUrl")}</label>
                  <input
                    type="url"
                    value={editForm.url}
                    onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 py-2">
                  <Checkbox
                    label={t("filters.wifi")}
                    checked={editForm.wifi}
                    onChange={(checked) => setEditForm({ ...editForm, wifi: checked })}
                    icon={<WifiHigh />}
                  />
                  <Checkbox
                    label={t("filters.parking")}
                    checked={editForm.parking}
                    onChange={(checked) => setEditForm({ ...editForm, parking: checked })}
                    icon={<Car />}
                  />
                  <Checkbox
                    label={t("filters.power")}
                    checked={editForm.power_outlets}
                    onChange={(checked) => setEditForm({ ...editForm, power_outlets: checked })}
                    icon={<Plug />}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">{t("modal.tags")}</label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-100 border-transparent focus:bg-white focus:border-amber-500 rounded-xl outline-none transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors"
                  >
                    Kapat
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-amber-700 text-white font-medium rounded-xl hover:bg-amber-800 transition-colors shadow-sm"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
