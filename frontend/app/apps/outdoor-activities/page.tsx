"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/clerk-react";
import {
  CaretLeft,
  Compass,
  Plus,
  Star,
  MapPin,
  Globe,
  Notebook,
  Trash
} from "@phosphor-icons/react";
import { getAppRootUrl } from "@/lib/apps";
import { createBrowserClient } from "@/lib/api";
import { outdoor_activities } from "@/lib/client";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { OUTDOOR_CATEGORIES } from "../workplaces/lib/outdoor-categories";

const client = createBrowserClient();

interface CategoryConfig {
  id: string;
  name: string;
  icon: typeof Compass;
  color: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: "all", name: "Tümü", icon: Compass, color: "#0F766E" },
  ...OUTDOOR_CATEGORIES.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
  })),
];

export default function OutdoorActivitiesPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [venues, setVenues] = useState<outdoor_activities.Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("horse-riding");
  const [formCity, setFormCity] = useState("İstanbul");
  const [formDistrict, setFormDistrict] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formWebsite, setFormWebsite] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchVenues();
  }, [selectedCategory]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory === "all" ? undefined : selectedCategory;
      const res = await client.outdoor_activities.getVenues({ category: categoryParam });
      setVenues(res.venues || []);
    } catch (err) {
      console.error("fetchVenues error:", err);
      toast.error("Mekanlar yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      const res = await client.outdoor_activities.seedOutdoorVenues();
      toast.success(`${res.count} Örnek mekan başarıyla yüklendi!`);
      await fetchVenues();
    } catch (err: any) {
      toast.error(`Yükleme hatası: ${err.message || "Bilinmeyen hata"}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCity.trim()) {
      toast.error("Lütfen gerekli alanları doldurun.");
      return;
    }

    try {
      setSubmitLoading(true);
      await client.outdoor_activities.addVenue({
        name: formName,
        category: formCategory,
        city: formCity,
        district: formDistrict || undefined,
        address: formAddress || undefined,
        notes: formNotes || undefined,
        rating: formRating,
        websiteUrl: formWebsite || undefined,
        imageUrl: formImageUrl || undefined,
        createdByClerkId: user?.id || undefined
      });

      toast.success("Mekan başarıyla eklendi!");
      setShowAddDrawer(false);
      
      // Reset Form
      setFormName("");
      setFormCategory("horse-riding");
      setFormCity("İstanbul");
      setFormDistrict("");
      setFormAddress("");
      setFormNotes("");
      setFormRating(5);
      setFormWebsite("");
      setFormImageUrl("");

      await fetchVenues();
    } catch (err) {
      console.error(err);
      toast.error("Mekan eklenirken bir hata oluştu.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text relative overflow-hidden selection:bg-[#0F766E]/20">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-app-surface/95 backdrop-blur-md border-b border-app-border/60 shadow-sm">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => window.location.href = getAppRootUrl()}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" className="text-[#0F766E]" />
            </button>

            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight uppercase leading-none text-app-text flex items-center gap-1.5">
              <Compass size={18} weight="fill" className="text-[#0F766E] shrink-0" />
              <span className="truncate">
                Aktiviteler
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowAddDrawer(true)}
              className="bg-[#0F766E] hover:opacity-90 text-white text-[10px] font-black px-3 py-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus size={12} weight="bold" />
              <span>Yeni Ekle</span>
            </button>
          </div>
        </div>
      </header>


      <main className="flex-1 px-4 py-6 pb-32 max-w-xl mx-auto w-full relative z-10">
        {loading ? (
          <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
            Aktiviteler yükleniyor...
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-16 bg-app-surface rounded-3xl border border-app-border flex flex-col items-center justify-center p-6 shadow-sm">
            <Compass size={40} className="text-app-muted mb-4" />
            <p className="text-sm font-bold text-app-muted mb-6">Henüz kayıtlı aktivite mekanı bulunamadı.</p>
            <button
              onClick={() => setShowAddDrawer(true)}
              className="bg-[#0F766E] hover:opacity-90 text-white font-black py-3.5 px-6 rounded-xl transition-all shadow-lg active:scale-98 text-sm uppercase tracking-widest cursor-pointer"
            >
              İlk Mekanı Ekle
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {(() => {
              const CATEGORY_ACTIONS: Record<string, string> = {
                "horse-riding": "Ata Binmeye Git 🏇",
                "canoeing": "Kano Yapmaya Git 🚣",
                "skiing": "Kayak Yapmaya Git ⛷️",
                "camping": "Kampa Git 🏕️",
                "lasertag": "Lasertag Oynamaya Git 🔫",
                "paintball": "Paintball Oynamaya Git 🎯",
                "diving": "Dalış Yapmaya Git 🤿",
                "gokart": "Gokart Sürmeye Git 🏎️",
              };

              // Group venues by category
              const grouped = venues.reduce((acc: any, venue: any) => {
                if (!acc[venue.category]) {
                  acc[venue.category] = [];
                }
                acc[venue.category].push(venue);
                return acc;
              }, {});

              const CATEGORY_ORDER = ["horse-riding", "canoeing", "camping", "lasertag", "paintball", "diving", "gokart", "skiing"];
              const sorted = Object.entries(grouped).sort((a, b) => {
                const idxA = CATEGORY_ORDER.indexOf(a[0]);
                const idxB = CATEGORY_ORDER.indexOf(b[0]);
                return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
              });

              return sorted.map(([catId, catVenues]: any) => {
                const catConfig = CATEGORIES.find(c => c.id === catId);
                const CatIcon = catConfig?.icon || Compass;
                const actionName = CATEGORY_ACTIONS[catId] || catConfig?.name || "Aktivite";

                return (
                  <div key={catId} className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-8 h-8 rounded-lg bg-[#0F766E]/10 flex items-center justify-center">
                        <CatIcon size={16} className="text-[#0F766E]" />
                      </div>
                      <h2 className="text-base font-black text-app-text uppercase tracking-tight">
                        {actionName}
                      </h2>
                      <span className="text-[10px] text-app-muted font-bold bg-app-surface border border-app-border px-2 py-0.5 rounded-full">
                        {catVenues.length} Yer
                      </span>
                    </div>

                    <div className="space-y-4">
                      {catVenues.map((venue: any) => (
                        <Link
                          key={venue.id}
                          href={`/apps/workplaces/place?outdoorId=${encodeURIComponent(venue.id)}`}
                          className="bg-app-surface rounded-2xl border border-app-border p-4 shadow-sm flex flex-col md:flex-row gap-4 items-start relative group transition-all hover:border-[#0F766E]/30 no-underline"
                        >
                          <div className="w-full md:w-28 h-28 rounded-xl overflow-hidden bg-app-surface-muted border border-app-border flex items-center justify-center shrink-0">
                            {venue.imageUrl ? (
                              <img src={venue.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-[#0F766E]/20 to-purple-500/20 flex items-center justify-center">
                                <CatIcon size={24} className="text-[#0F766E]/60" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {venue.rating && (
                                <span className="flex items-center gap-0.5 text-amber-500 text-[10px] font-black">
                                  <Star size={10} weight="fill" />
                                  <span>{venue.rating} / 5</span>
                                </span>
                              )}
                            </div>

                            <h3 className="text-sm font-black text-app-text group-hover:text-[#0F766E] transition-colors leading-tight line-clamp-2">
                              {venue.name}
                            </h3>

                            <p className="text-[11px] text-app-muted font-bold truncate mt-0.5 flex items-center gap-1">
                              <MapPin size={10} weight="fill" className="text-app-muted shrink-0" />
                              <span>{venue.district ? `${venue.district}, ` : ""}{venue.city}</span>
                            </p>

                            {venue.notes && (
                              <p className="text-[11px] text-app-muted line-clamp-2 mt-2 leading-relaxed italic">
                                {venue.notes}
                              </p>
                            )}

                            {venue.websiteUrl && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#0F766E] mt-3"
                              >
                                <Globe size={10} />
                                <span>Web sitesi mevcut</span>
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </main>

      {/* Add Venue Drawer */}
      <Drawer.Root open={showAddDrawer} onOpenChange={setShowAddDrawer}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
          <Drawer.Content className="bg-app-bg text-app-text flex flex-col rounded-t-[2.5rem] fixed bottom-0 left-0 right-0 max-h-[90dvh] outline-none z-[70] max-w-lg mx-auto border-t border-app-border shadow-2xl">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mx-auto w-12 h-1 rounded-full bg-app-border mb-6" />
              <Drawer.Title className="text-2xl font-black mb-1 uppercase tracking-tight text-app-text">
                Yeni Aktivite Mekanı Ekle
              </Drawer.Title>
              <Drawer.Description className="text-xs text-app-muted mb-6">
                Şehirdeki aktivite yerlerini keşfetmeye yardımcı olmak için bilgi ekleyin.
              </Drawer.Description>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-app-muted mb-1.5">Mekan Adı *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Mekan veya kulüp adı..."
                    className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text focus:border-[#0F766E]/50 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-app-muted mb-1.5">Aktivite Türü *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text focus:border-[#0F766E]/50 outline-none transition-all"
                    >
                      {CATEGORIES.filter(c => c.id !== "all").map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-app-muted mb-1.5">Değerlendirme (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={formRating}
                      onChange={(e) => setFormRating(Number(e.target.value))}
                      className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text focus:border-[#0F766E]/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-app-muted mb-1.5">Şehir *</label>
                    <input
                      type="text"
                      required
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      placeholder="Örn: İstanbul, Maraş..."
                      className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text focus:border-[#0F766E]/50 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-app-muted mb-1.5">İlçe</label>
                    <input
                      type="text"
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      placeholder="Örn: Kadıköy, Onikişubat..."
                      className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text focus:border-[#0F766E]/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-app-muted mb-1.5">Açık Adres</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Tam adres bilgisi..."
                    className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text focus:border-[#0F766E]/50 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-app-muted mb-1.5">Web Sitesi URL</label>
                  <input
                    type="url"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text focus:border-[#0F766E]/50 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-app-muted mb-1.5">Görsel URL</label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text focus:border-[#0F766E]/50 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-app-muted mb-1.5">Notlar / Deneyim</label>
                  <textarea
                    rows={3}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Mekan hakkında deneyim veya ek bilgiler..."
                    className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text focus:border-[#0F766E]/50 outline-none transition-all resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddDrawer(false)}
                    className="flex-1 bg-app-surface-muted text-app-text font-black py-3 px-6 rounded-xl border border-app-border transition-all active:scale-98 text-xs uppercase tracking-widest cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="flex-1 bg-[#0F766E] hover:opacity-90 text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg active:scale-98 text-xs uppercase tracking-widest cursor-pointer disabled:opacity-50"
                  >
                    {submitLoading ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
