"use client";

import { getAppRootUrl } from "@/lib/apps";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  Buildings,
  Plus,
  Trash,
  CaretLeft,
  Link as LinkIcon,
  PencilSimple,
  ArrowSquareIn,
  MagnifyingGlass,
  Funnel,
  Note,
  Briefcase,
  Warning,
  Rows,
  SquaresFour,
  FileText,
  Printer,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";
import { toast, Toaster } from "react-hot-toast";
import { createBrowserClient } from "@/lib/api";
import { apply_tracker } from "@/lib/client";

const client = createBrowserClient();

const STATUS_LABELS: Record<apply_tracker.ApplicationStatus, { label: string; color: string; bg: string; border: string }> = {
  to_apply: { label: "Başvurulacak", color: "text-zinc-500", bg: "bg-zinc-100", border: "border-zinc-200" },
  applied: { label: "Başvuruldu", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  accepted: { label: "Olumlu Dönüş", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  rejected: { label: "Olumsuz Dönüş", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
  withdrawn: { label: "Geri Çekildi", color: "text-zinc-400", bg: "bg-zinc-100", border: "border-zinc-200" },
};

const PRIORITY_LABELS: Record<apply_tracker.ApplicationPriority, { label: string; color: string }> = {
  low: { label: "Düşük", color: "bg-zinc-100 text-zinc-500 border border-zinc-200/50" },
  medium: { label: "Orta", color: "bg-indigo-50 text-indigo-600 border border-indigo-100" },
  high: { label: "Yüksek", color: "bg-rose-50 text-rose-600 border border-rose-100" },
};

export default function ApplyTrackerPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [applications, setApplications] = useState<apply_tracker.Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [selectedAppForEdit, setSelectedAppForEdit] = useState<apply_tracker.Application | null>(null);
  const [selectedAppForCv, setSelectedAppForCv] = useState<apply_tracker.Application | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban'); // Default to kanban for SSR/desktop initial state
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);
  const [showCvEditor, setShowCvEditor] = useState(false);

  // Detect screen size on mount to set initial view mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 768) {
        setViewMode('list');
      } else {
        setViewMode('kanban');
      }
    }
  }, []);

  // Load applications
  useEffect(() => {
    if (isUserLoaded) {
      fetchApplications();
    }
  }, [isUserLoaded, user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      if (!user) {
        setApplications([]);
        return;
      }
      const res = await client.apply_tracker.getApplications(user.id);
      setApplications(res.applications || []);
    } catch (error) {
      console.error("fetchApplications error:", error);
      toast.error("Başvurular yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await client.apply_tracker.deleteApplication(id, { userId: user.id });
      setApplications(applications.filter((app) => app.id !== id));
      toast.success("Başvuru silindi.");
    } catch (error) {
      toast.error("Silme işlemi başarısız.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: apply_tracker.ApplicationStatus) => {
    if (!user) return;
    const target = applications.find(a => a.id === id);
    if (!target) return;

    try {
      // Optimistic update
      setApplications(applications.map(a => a.id === id ? { ...a, status: newStatus } : a));

      await client.apply_tracker.updateApplication({
        userId: user.id,
        id: target.id,
        companyName: target.company_name,
        roleTitle: target.role_title || undefined,
        url: target.url || undefined,
        status: newStatus,
        priority: target.priority,
        notes: target.notes || undefined,
        appliedAt: newStatus === 'applied' ? new Date().toISOString() : (target.applied_at || undefined)
      });
      toast.success("Durum güncellendi.");
    } catch (err) {
      // Revert
      fetchApplications();
      toast.error("Durum güncellenemedi.");
    }
  };

  // Filter applications
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.role_title && app.role_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.notes && app.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" ? true : app.status === statusFilter;
    const matchesPriority = priorityFilter === "all" ? true : app.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Get favicon URL
  const getFaviconUrl = (urlStr: string | null) => {
    if (!urlStr) return null;
    try {
      const url = new URL(urlStr);
      return `https://www.google.com/s2/favicons?sz=64&domain=${url.hostname}`;
    } catch {
      return null;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 relative overflow-hidden font-sans">
      <Toaster position="top-center" toastOptions={{
        style: {
          background: "#ffffff",
          color: "#18181b",
          border: "1px solid #e4e4e7",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
        }
      }} />

      <main className={`flex-1 px-4 py-8 pb-32 mx-auto w-full relative z-10 transition-all duration-300 ${viewMode === 'kanban' ? 'max-w-7xl' : 'max-w-2xl'}`}>
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => window.location.href = getAppRootUrl()}
            className="group flex items-center gap-2 text-zinc-650 text-xs font-semibold hover:text-zinc-900 transition-all bg-white hover:bg-zinc-100/50 px-3.5 py-2 rounded-xl border border-zinc-200 shadow-sm active:scale-95"
          >
            <CaretLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Katalog</span>
          </button>

          {user && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowImportDrawer(true)}
                className="bg-white hover:bg-zinc-100/50 text-zinc-650 hover:text-zinc-900 text-xs font-bold px-3.5 py-2.5 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 border border-zinc-200 shadow-sm"
              >
                <ArrowSquareIn size={15} weight="bold" />
                <span>Toplu Aktar</span>
              </button>
              <button
                onClick={() => {
                  setSelectedAppForEdit(null);
                  setShowAddDrawer(true);
                }}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-all flex items-center gap-1.5 shadow"
              >
                <Plus size={15} weight="bold" />
                <span>Yeni Başvuru</span>
              </button>
            </div>
          )}
        </div>

        {/* Hero title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 flex items-center gap-3">
            <Buildings size={32} className="text-zinc-850" weight="fill" />
            Başvuru Takip
          </h1>
          <p className="text-zinc-500 text-sm mt-1">İş başvurularınızı, süreçlerinizi ve ilan detaylarını tek bir yerden izleyin.</p>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col gap-3.5">
            {/* Search Input */}
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <MagnifyingGlass size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Şirket, pozisyon veya not ara..."
                className="w-full bg-zinc-50/50 border border-zinc-200 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/10 outline-none transition-all placeholder:text-zinc-400"
              />
            </div>

            {/* Select Filters & View Switcher */}
            <div className="flex gap-2.5 items-center">
              <div className="flex-1 relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-700 focus:border-zinc-400 outline-none appearance-none cursor-pointer"
                >
                  <option value="all">Tüm Durumlar</option>
                  {Object.entries(STATUS_LABELS).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                  <Funnel size={12} />
                </div>
              </div>

              <div className="flex-1 relative">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs text-zinc-700 focus:border-zinc-400 outline-none appearance-none cursor-pointer"
                >
                  <option value="all">Tüm Öncelikler</option>
                  <option value="low">Düşük Öncelik</option>
                  <option value="medium">Orta Öncelik</option>
                  <option value="high">Yüksek Öncelik</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
                  <Funnel size={12} />
                </div>
              </div>

              {/* View Switcher Toggle */}
              <div className="flex bg-zinc-150 p-1 rounded-xl border border-zinc-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                  title="Liste Görünümü"
                >
                  <Rows size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                  title="Kanban Board Görünümü"
                >
                  <SquaresFour size={16} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        {loading ? (
          <div className="text-center py-24 text-zinc-400 text-xs font-semibold uppercase tracking-widest animate-pulse flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-transparent animate-spin" />
            <span>Başvurular Yükleniyor...</span>
          </div>
        ) : !user ? (
          <div className="text-center py-20 bg-white border border-zinc-200 shadow-sm rounded-3xl flex flex-col items-center justify-center p-6">
            <Buildings size={48} className="text-zinc-300 mb-4" />
            <p className="text-sm font-semibold text-zinc-800 mb-2">Giriş Yapmalısınız</p>
            <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">Başvurularınızı eklemek ve süreçlerinizi takip etmek için kullanıcı girişi yapmalısınız.</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 bg-white border border-zinc-200 shadow-sm rounded-3xl flex flex-col items-center justify-center p-6">
            <Buildings size={48} className="text-zinc-300 mb-4" />
            <p className="text-sm font-semibold text-zinc-800 mb-2">Henüz Başvuru Yok</p>
            <p className="text-xs text-zinc-500 max-w-xs mb-6 leading-relaxed">İş başvurularınızı tek tek ekleyebilir veya listelerinizi kopyalayıp toplu aktarabilirsiniz.</p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <button
                onClick={() => setShowImportDrawer(true)}
                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 font-bold py-3 px-4 rounded-xl transition-all text-xs"
              >
                Toplu İçe Aktar
              </button>
              <button
                onClick={() => {
                  setSelectedAppForEdit(null);
                  setShowAddDrawer(true);
                }}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-xl transition-all text-xs shadow"
              >
                İlk Başvuruyu Ekle
              </button>
            </div>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs font-semibold">Aranan kriterlere uygun iş başvurusu bulunamadı.</div>
        ) : viewMode === 'kanban' ? (
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent snap-x">
            {Object.entries(STATUS_LABELS).map(([statusKey, statusVal]) => {
              // Skip if status filter is active and doesn't match this key
              if (statusFilter !== "all" && statusFilter !== statusKey) return null;

              const columnApps = filteredApps.filter(app => app.status === statusKey);
              const isDraggedOver = draggedOverCol === statusKey;

              return (
                <div
                  key={statusKey}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setDraggedOverCol(statusKey)}
                  onDragLeave={() => setDraggedOverCol(null)}
                  onDrop={(e) => {
                    setDraggedOverCol(null);
                    const id = e.dataTransfer.getData("text/plain");
                    if (id) handleStatusChange(id, statusKey as apply_tracker.ApplicationStatus);
                  }}
                  className={`flex-1 min-w-[280px] max-w-[320px] rounded-2xl p-3 flex flex-col snap-align-start shrink-0 transition-all ${
                    isDraggedOver ? "bg-indigo-50/80 border-2 border-dashed border-indigo-300" : "bg-zinc-100/40 border border-zinc-200/60"
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200/80 shrink-0">
                    <span className={`text-xs font-bold ${statusVal.color}`}>{statusVal.label}</span>
                    <span className="text-[10px] bg-white border border-zinc-200 text-zinc-500 font-bold px-2 py-0.5 rounded-lg">{columnApps.length}</span>
                  </div>

                  {/* Column Content */}
                  <div className="space-y-3">
                    {columnApps.length === 0 ? (
                      <div className="text-center py-12 text-[10px] text-zinc-400 font-semibold border border-dashed border-zinc-200/80 rounded-xl bg-white/50">
                        Henüz yok
                      </div>
                    ) : (
                      columnApps.map((app) => {
                        const favicon = getFaviconUrl(app.url);
                        return (
                          <div
                            key={app.id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData("text/plain", app.id)}
                            className="bg-white hover:bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 rounded-xl p-3 flex flex-col gap-2 transition-all relative group shadow-sm cursor-grab active:cursor-grabbing"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {app.url ? (
                                    <a
                                      href={app.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-bold text-zinc-900 truncate hover:text-indigo-600 transition-colors flex items-center gap-1"
                                      onClick={(e) => e.stopPropagation()}
                                      title="İlanı Gör"
                                    >
                                      <span className="truncate">{app.company_name}</span>
                                      <LinkIcon size={10} className="text-zinc-450 shrink-0" />
                                    </a>
                                  ) : (
                                    <span className="text-xs font-bold text-zinc-900 truncate">{app.company_name}</span>
                                  )}
                                </div>
                                {app.role_title && (
                                  <div className="text-[10px] text-zinc-500 truncate mt-0.5">{app.role_title}</div>
                                )}
                                {app.applied_at && (
                                  <div className="text-[9px] text-indigo-600 font-bold mt-1 flex items-center gap-1">
                                    <FileText size={10} weight="bold" />
                                    <span>{formatDate(app.applied_at)} tarihinde başvuruldu</span>
                                  </div>
                                )}
                              </div>
                              
                              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${PRIORITY_LABELS[app.priority]?.color}`}>
                                {PRIORITY_LABELS[app.priority]?.label}
                              </span>
                            </div>

                            {app.notes && (
                              <p className="text-[10px] text-zinc-650 leading-normal line-clamp-2 italic bg-zinc-50 p-1.5 rounded border border-zinc-100">
                                {app.notes}
                              </p>
                            )}

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between border-t border-zinc-100 pt-2 mt-0.5 shrink-0">
                              {/* Quick status shifter */}
                              <div className="relative">
                                <select
                                  value={app.status}
                                  onChange={(e) => handleStatusChange(app.id, e.target.value as apply_tracker.ApplicationStatus)}
                                  className="bg-transparent text-[9px] text-zinc-500 hover:text-zinc-800 font-bold outline-none cursor-pointer border-none p-0 pr-3 appearance-none"
                                >
                                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                  ))}
                                </select>
                                <span className="absolute inset-y-0 right-0 flex items-center text-[7px] text-zinc-400 pointer-events-none">▼</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedAppForCv(app)}
                                  className={`p-0.5 rounded transition-all ${app.cv_html ? 'text-indigo-650 bg-indigo-50 hover:bg-indigo-100/60' : 'text-zinc-400 hover:text-indigo-600 bg-zinc-50 hover:bg-zinc-100'}`}
                                  title={app.cv_html ? "CV'yi Düzenle / Görüntüle" : "CV Oluştur"}
                                >
                                  <FileText size={12} weight={app.cv_html ? "fill" : "bold"} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAppForEdit(app);
                                    setShowAddDrawer(true);
                                  }}
                                  className="text-zinc-400 hover:text-zinc-800 p-0.5 rounded transition-all"
                                  title="Düzenle"
                                >
                                  <PencilSimple size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTargetId(app.id)}
                                  className="text-zinc-400 hover:text-rose-500 p-0.5 rounded transition-all"
                                  title="Sil"
                                >
                                  <Trash size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map((app) => {
              const favicon = getFaviconUrl(app.url);
              const statusInfo = STATUS_LABELS[app.status] || STATUS_LABELS.to_apply;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={app.id}
                  className="bg-white rounded-2xl p-4.5 border border-zinc-200/80 hover:border-zinc-300 transition-all flex flex-col gap-3 relative group shadow-sm"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      {/* Company Logo or Icon */}
                      <div className="w-11 h-11 rounded-xl bg-zinc-50 border border-zinc-200/60 flex items-center justify-center text-zinc-500 font-bold text-base uppercase shrink-0 overflow-hidden relative shadow-sm">
                        {favicon ? (
                          <img
                            src={favicon}
                            alt={app.company_name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          app.company_name.charAt(0)
                        )}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          {app.url ? (
                            <a
                              href={app.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base font-bold text-zinc-900 truncate hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                              title="İlanı Gör"
                            >
                              <span>{app.company_name}</span>
                              <LinkIcon size={12} className="text-zinc-400 group-hover:text-indigo-650 transition-colors shrink-0" />
                            </a>
                          ) : (
                            <h3 className="text-base font-bold text-zinc-900 truncate">
                              {app.company_name}
                            </h3>
                          )}
                        </div>

                        {app.role_title && (
                          <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1">
                            <Briefcase size={12} className="text-zinc-400" />
                            <span className="truncate">{app.role_title}</span>
                          </div>
                        )}

                        {app.applied_at && (
                          <div className="text-[10px] text-indigo-600 font-bold mt-1.5 flex items-center gap-1.5">
                            <FileText size={12} weight="bold" />
                            <span>{formatDate(app.applied_at)} tarihinde başvuruldu</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Priority Tag */}
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${PRIORITY_LABELS[app.priority]?.color}`}>
                        {PRIORITY_LABELS[app.priority]?.label}
                      </span>
                    </div>
                  </div>

                  {app.notes && (
                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/50 flex items-start gap-2 text-xs text-zinc-650 leading-relaxed italic">
                      <Note size={14} className="text-indigo-500/70 shrink-0 mt-0.5" />
                      <p className="line-clamp-2 text-ellipsis overflow-hidden">{app.notes}</p>
                    </div>
                  )}

                  {/* Actions & Status Dropdown */}
                  <div className="flex items-center justify-between mt-1 pt-3 border-t border-zinc-100 gap-2">
                    {/* Status badge and selection */}
                    <div className="relative">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as apply_tracker.ApplicationStatus)}
                        className={`text-xs font-bold rounded-lg border px-2.5 py-1 outline-none appearance-none cursor-pointer pr-6 shadow-sm ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-zinc-400">
                        <span className="text-[8px] font-bold">▼</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedAppForCv(app)}
                        className={`p-2 rounded-xl border border-transparent transition-all active:scale-90 ${app.cv_html ? 'text-indigo-655 bg-indigo-50 hover:text-indigo-800 hover:bg-indigo-100/60 hover:border-indigo-100' : 'text-zinc-400 hover:text-indigo-600 hover:bg-zinc-50 hover:border-zinc-100'}`}
                        title={app.cv_html ? "CV'yi Düzenle / Görüntüle" : "CV Oluştur"}
                      >
                        <FileText size={14} weight={app.cv_html ? "fill" : "bold"} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAppForEdit(app);
                          setShowAddDrawer(true);
                        }}
                        className="text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 p-2 rounded-xl border border-transparent hover:border-zinc-200 transition-all active:scale-90"
                        title="Düzenle"
                      >
                        <PencilSimple size={14} weight="bold" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(app.id)}
                        className="text-zinc-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all active:scale-90"
                        title="Sil"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* 1. Add / Edit Application Drawer */}
      <Drawer.Root
        open={showAddDrawer}
        onOpenChange={(open) => {
          setShowAddDrawer(open);
          if (!open) setSelectedAppForEdit(null);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60]" />
          <Drawer.Content className="bg-white text-zinc-950 flex flex-col rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[92dvh] outline-none z-[70] max-w-lg mx-auto border-t border-zinc-200 shadow-2xl">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mx-auto w-10 h-1 rounded-full bg-zinc-200 mb-6" />
              <Drawer.Title className="text-xl font-extrabold mb-1 tracking-tight flex items-center gap-2 text-zinc-900">
                {selectedAppForEdit ? (
                  <>
                    <PencilSimple size={20} className="text-indigo-600" />
                    <span>Başvuru Düzenle</span>
                  </>
                ) : (
                  <>
                    <Plus size={20} className="text-indigo-600" />
                    <span>Yeni Başvuru Ekle</span>
                  </>
                )}
              </Drawer.Title>
              <Drawer.Description className="text-xs text-zinc-500 mb-6">
                İş başvurusu bilgilerini detaylıca girerek kaydedebilirsiniz.
              </Drawer.Description>
              <AddAppForm
                initialApp={selectedAppForEdit}
                onComplete={() => {
                  fetchApplications();
                  setShowAddDrawer(false);
                  setSelectedAppForEdit(null);
                }}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* 2. Bulk Import / Paste Drawer */}
      <Drawer.Root
        open={showImportDrawer}
        onOpenChange={setShowImportDrawer}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60]" />
          <Drawer.Content className="bg-white text-zinc-950 flex flex-col rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[92dvh] outline-none z-[70] max-w-lg mx-auto border-t border-zinc-200 shadow-2xl">
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mx-auto w-10 h-1 rounded-full bg-zinc-200 mb-6" />
              <Drawer.Title className="text-xl font-extrabold mb-1 tracking-tight flex items-center gap-2 text-zinc-900">
                <ArrowSquareIn size={20} className="text-indigo-600" />
                <span>Toplu İçe Aktar</span>
              </Drawer.Title>
              <Drawer.Description className="text-xs text-zinc-500 mb-6">
                basvuru.txt formatındaki metnini buraya yapıştır. Sistem satırları analiz edip, şirketleri ve ilan linklerini otomatik ayıracak.
              </Drawer.Description>
              <BulkImportForm
                onComplete={() => {
                  fetchApplications();
                  setShowImportDrawer(false);
                }}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* 3. CV Editor Drawer */}
      <Drawer.Root
        direction="right"
        open={!!selectedAppForCv}
        onOpenChange={(open) => {
          if (!open) setSelectedAppForCv(null);
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60]" />
          <Drawer.Content className="bg-white text-zinc-950 flex flex-col md:rounded-l-[2rem] rounded-t-[2rem] fixed md:top-0 md:right-0 md:bottom-0 md:left-auto bottom-0 left-0 right-0 md:w-[85vw] md:max-w-4xl max-h-[96dvh] md:max-h-screen outline-none z-[70] max-w-2xl mx-auto border-t md:border-t-0 md:border-l border-zinc-200 shadow-2xl">
            <div className="p-6 overflow-y-auto flex-1 flex flex-col">
              <div className="mx-auto w-10 h-1 rounded-full bg-zinc-200 mb-6 shrink-0 md:hidden" />
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                  <Drawer.Title className="text-xl font-extrabold tracking-tight flex items-center gap-2 text-zinc-900">
                    <FileText size={24} className="text-indigo-600" weight="fill" />
                    <span>{selectedAppForCv?.company_name} - CV Düzenleyici</span>
                  </Drawer.Title>
                  <Drawer.Description className="text-xs text-zinc-500 mt-1">
                    Bu başvuruya özel CV'nizi HTML/CSS ile hazırlayın ve PDF olarak indirin.
                  </Drawer.Description>
                </div>
                <button
                  onClick={() => setSelectedAppForCv(null)}
                  className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-all"
                >
                  <CaretLeft size={20} weight="bold" className="rotate-180" />
                </button>
              </div>
              
              {selectedAppForCv && (
                <div className="flex-1 min-h-0">
                  <CvEditorForm
                    app={selectedAppForCv}
                    onComplete={() => {
                      fetchApplications();
                      setSelectedAppForCv(null);
                    }}
                  />
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTargetId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-xs bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-6 text-zinc-900"
            >
              <div className="space-y-3 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                  <Warning size={22} weight="fill" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">Başvuruyu Sil</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Bu başvuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  className="flex-1 h-10 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all border border-zinc-200"
                >
                  Vazgeç
                </button>
                <button
                  onClick={() => {
                    if (deleteTargetId) {
                      handleDelete(deleteTargetId);
                      setDeleteTargetId(null);
                    }
                  }}
                  className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20"
                >
                  Sil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const DEFAULT_CV_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 40px; background: #ffffff; }
  h1 { font-size: 32px; margin-bottom: 8px; color: #111827; font-weight: 800; text-align: left; letter-spacing: -0.02em; }
  .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 30px; text-align: left; border-bottom: 1px solid #f3f4f6; padding-bottom: 20px; display: flex; gap: 15px; flex-wrap: wrap; }
  .section { margin-bottom: 35px; break-inside: auto; }
  .section-title { font-size: 16px; font-weight: 800; text-transform: uppercase; color: #4f46e5; border-bottom: 2px solid #eef2ff; padding-bottom: 8px; margin-bottom: 20px; letter-spacing: 0.05em; break-after: avoid; }
  .item { margin-bottom: 24px; break-inside: avoid; page-break-inside: avoid; }
  .item-header { font-weight: 700; font-size: 16px; display: flex; justify-content: space-between; color: #111827; }
  .item-sub { color: #6b7280; font-size: 14px; margin-top: 4px; display: flex; justify-content: space-between; font-weight: 500; }
  .item-desc { font-size: 14px; color: #4b5563; margin-top: 10px; padding-left: 15px; border-left: 3px solid #f3f4f6; }
  .skills-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .skill-tag { background: #f9fafb; border: 1px solid #f3f4f6; padding: 4px 12px; rounded: 6px; font-size: 13px; color: #374151; font-weight: 500; }
</style>
</head>
<body>
  <h1>AD SOYAD</h1>
  <div class="subtitle">
    <span>📧 email@example.com</span>
    <span>📱 +90 555 555 5555</span>
    <span>🔗 github.com/username</span>
  </div>
  
  <div class="section">
    <div class="section-title">Deneyim</div>
    <div class="item">
      <div class="item-header"><span>Senior Frontend Developer</span> <span>2022 — Günümüz</span></div>
      <div class="item-sub"><span>Şirket Adı A.Ş.</span> <span>İstanbul, TR</span></div>
      <div class="item-desc">Next.js, TypeScript ve modern CSS mimarileri ile yüksek performanslı web uygulamaları geliştirdim. Ekip liderliği ve mimari kararlarda aktif rol aldım.</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Yetenekler</div>
    <div class="skills-list">
      <span class="skill-tag">JavaScript</span>
      <span class="skill-tag">TypeScript</span>
      <span class="skill-tag">React</span>
      <span class="skill-tag">Next.js</span>
      <span class="skill-tag">Tailwind CSS</span>
      <span class="skill-tag">PostgreSQL</span>
      <span class="skill-tag">Git</span>
    </div>
  </div>
</body>
</html>`;

// Manually Add/Edit Form
function AddAppForm({
  initialApp,
  onComplete,
}: {
  initialApp?: apply_tracker.Application | null;
  onComplete: () => void;
}) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    companyName: initialApp?.company_name || "",
    roleTitle: initialApp?.role_title || "",
    url: initialApp?.url || "",
    status: initialApp?.status || "to_apply" as apply_tracker.ApplicationStatus,
    priority: initialApp?.priority || "medium" as apply_tracker.ApplicationPriority,
    notes: initialApp?.notes || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.companyName.trim()) {
      toast.error("Lütfen şirket adını girin.");
      return;
    }

    try {
      setLoading(true);
      if (initialApp) {
        await client.apply_tracker.updateApplication({
          userId: user.id,
          id: initialApp.id,
          companyName: formData.companyName.trim(),
          roleTitle: formData.roleTitle.trim() || undefined,
          url: formData.url.trim() || undefined,
          status: formData.status,
          priority: formData.priority,
          notes: formData.notes.trim() || undefined,
          appliedAt: formData.status === 'applied' ? (initialApp.applied_at || new Date().toISOString()) : undefined,
        });
        toast.success("Başvuru güncellendi.");
      } else {
        await client.apply_tracker.addApplication({
          userId: user.id,
          companyName: formData.companyName.trim(),
          roleTitle: formData.roleTitle.trim() || undefined,
          url: formData.url.trim() || undefined,
          status: formData.status,
          priority: formData.priority,
          notes: formData.notes.trim() || undefined,
          appliedAt: formData.status === 'applied' ? new Date().toISOString() : undefined,
        });
        toast.success("Yeni başvuru kaydedildi.");
      }
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error("Hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-8">
      <div>
        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5 block">Şirket Adı *</label>
        <input
          required
          type="text"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          placeholder="Örn: Google, Notion, Figma"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:border-zinc-400 outline-none text-zinc-900 transition-all placeholder:text-zinc-400"
        />
      </div>

      <div>
        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5 block">Pozisyon / Rol</label>
        <input
          type="text"
          value={formData.roleTitle}
          onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
          placeholder="Örn: Full-Stack Engineer, Product Manager"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:border-zinc-400 outline-none text-zinc-900 transition-all placeholder:text-zinc-400"
        />
      </div>

      <div>
        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5 block">İlan Linki (URL)</label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://..."
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:border-zinc-400 outline-none text-zinc-900 transition-all placeholder:text-zinc-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5 block">Durum</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as apply_tracker.ApplicationStatus })}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-3 text-sm focus:border-zinc-400 outline-none text-zinc-900 cursor-pointer"
          >
            {Object.entries(STATUS_LABELS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5 block">Öncelik</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as apply_tracker.ApplicationPriority })}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-3 text-sm focus:border-zinc-400 outline-none text-zinc-900 cursor-pointer"
          >
            <option value="low">Düşük</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5 block">Notlar</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Görüşme tarihleri veya önemli detaylar..."
          rows={3}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:border-zinc-400 outline-none text-zinc-900 transition-all placeholder:text-zinc-400 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-sm shadow mt-4 active:scale-98"
      >
        {loading ? "Kaydediliyor..." : initialApp ? "Değişiklikleri Kaydet" : "Başvuruyu Ekle"}
      </button>
    </form>
  );
}

// Dedicated CV Editor Form
function CvEditorForm({
  app,
  onComplete,
}: {
  app: apply_tracker.Application;
  onComplete: () => void;
}) {
  const { user } = useUser();
  const [cvHtml, setCvHtml] = useState(app.cv_html || "");
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.6);
  const [contentScale, setContentScale] = useState(0.8); // Internal density scale

  // Auto-adjust zoom on mount or preview mode change
  useEffect(() => {
    if (previewMode && typeof window !== 'undefined') {
      const container = document.getElementById('cv-scroll-container');
      if (container) {
        const availableWidth = container.clientWidth - 64; // 32px padding each side
        const a4WidthPx = 210 * 3.78; // 210mm to pixels (approx 96dpi)
        const fitZoom = Math.min(availableWidth / a4WidthPx, 1);
        setZoomLevel(Math.floor(fitZoom * 10) / 10);
      }
    }
  }, [previewMode]);

  const handleSave = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await client.apply_tracker.updateApplication({
        userId: user.id,
        id: app.id,
        companyName: app.company_name,
        roleTitle: app.role_title || undefined,
        url: app.url || undefined,
        status: app.status,
        priority: app.priority,
        notes: app.notes || undefined,
        cvHtml: cvHtml.trim() || undefined,
        appliedAt: app.applied_at || undefined,
      });
      toast.success("CV başarıyla kaydedildi.");
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error("CV kaydedilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = () => {
    setCvHtml(DEFAULT_CV_TEMPLATE);
    toast.success("Hazır CV şablonu yüklendi.");
  };

  const handleDownloadPdf = async () => {
    // @ts-ignore
    const html2pdf = (await import('html2pdf.js')).default;
    
    try {
      toast.loading("PDF oluşturuluyor...", { id: "pdf-gen" });

      // Create a temporary hidden iframe to completely isolate styles from Tailwind 4
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '210mm';
      iframe.style.height = '1000mm'; // Large enough to avoid initial clipping
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error("Iframe document not found");

      // Set the content with the scale applied
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; width: 210mm; }
              #wrapper { 
                width: ${100 / contentScale}%; 
                transform: scale(${contentScale}); 
                transform-origin: top left; 
              }
            </style>
          </head>
          <body>
            <div id="wrapper">
              ${cvHtml || ""}
            </div>
          </body>
        </html>
      `);
      iframeDoc.close();

      // Give it a moment to render
      await new Promise(resolve => setTimeout(resolve, 300));

      const opt = {
        margin: 0,
        filename: `${app.company_name.replace(/\s+/g, '_')}_CV.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      // Target the body of the iframe
      await html2pdf().set(opt).from(iframeDoc.body).save();
      
      document.body.removeChild(iframe);
      toast.success("PDF başarıyla indirildi.", { id: "pdf-gen" });
    } catch (err) {
      console.error(err);
      toast.error("PDF oluşturulurken hata oluştu.", { id: "pdf-gen" });
    }
  };

  const handlePrint = () => {
    const iframe = document.getElementById('cv-preview-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-8">
      <div className="flex items-center justify-between bg-zinc-100 p-1 rounded-xl border border-zinc-200">
        <button
          type="button"
          onClick={() => setPreviewMode(false)}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!previewMode ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
        >
          HTML Düzenle
        </button>
        <button
          type="button"
          onClick={() => setPreviewMode(true)}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${previewMode ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
        >
          Önizleme
        </button>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          {!previewMode ? (
            <div className="flex-1 flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">HTML / CSS Kodu</label>
                <button
                  type="button"
                  onClick={loadTemplate}
                  className="text-[10px] text-indigo-600 hover:text-indigo-850 font-bold bg-indigo-50 border border-indigo-100 rounded px-2.5 py-1 transition-all active:scale-95"
                >
                  Şablon Yükle
                </button>
              </div>
              <textarea
                value={cvHtml}
                onChange={(e) => setCvHtml(e.target.value)}
                placeholder="<html>..."
                className="flex-1 w-full bg-zinc-900 text-zinc-100 font-mono rounded-xl px-4 py-3 text-xs focus:border-zinc-700 outline-none transition-all resize-none min-h-[400px]"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">CV Önizleme</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-100 rounded-lg p-0.5 border border-zinc-200" title="Görünüm Yakınlaştırma">
                      <button 
                        onClick={() => setZoomLevel(Math.max(0.1, zoomLevel - 0.1))}
                        className="p-1 hover:bg-white rounded-md transition-all text-zinc-500 hover:text-zinc-900"
                      >
                        <MagnifyingGlassMinus size={14} weight="bold" />
                      </button>
                      <span className="text-[10px] font-bold px-2 text-zinc-600 min-w-[40px] text-center">
                        %{Math.round(zoomLevel * 100)}
                      </span>
                      <button 
                        onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                        className="p-1 hover:bg-white rounded-md transition-all text-zinc-500 hover:text-zinc-900"
                      >
                        <MagnifyingGlassPlus size={14} weight="bold" />
                      </button>
                    </div>

                    <div className="flex items-center bg-indigo-50 rounded-lg p-0.5 border border-indigo-100" title="İçerik Yoğunluğu (Yazı Boyutu Oranı)">
                      <button 
                        onClick={() => setContentScale(Math.max(0.5, contentScale - 0.05))}
                        className="p-1 hover:bg-white rounded-md transition-all text-indigo-500 hover:text-indigo-900"
                      >
                        <Rows size={14} weight="bold" />
                      </button>
                      <span className="text-[10px] font-bold px-2 text-indigo-600 min-w-[45px] text-center">
                        {contentScale.toFixed(2)}x
                      </span>
                      <button 
                        onClick={() => setContentScale(Math.min(1.5, contentScale + 0.05))}
                        className="p-1 hover:bg-white rounded-md transition-all text-indigo-500 hover:text-indigo-900"
                      >
                        <SquaresFour size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCvHtml(cvHtml)} // Trigger re-render of iframe
                    className="text-[10px] text-zinc-600 hover:text-zinc-900 font-bold bg-zinc-100 border border-zinc-200 rounded px-2.5 py-1 transition-all active:scale-95 flex items-center gap-1"
                  >
                    <ArrowsClockwise size={12} weight="bold" />
                    <span>Yenile</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="text-[10px] text-indigo-600 hover:text-indigo-850 font-bold bg-indigo-50 border border-indigo-100 rounded px-2.5 py-1 transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Printer size={12} weight="bold" />
                    <span>Yazdır</span>
                  </button>
                </div>
              </div>
              
            <div 
              id="cv-scroll-container"
              className="flex-1 bg-zinc-200/50 border border-zinc-200 rounded-xl overflow-auto shadow-inner min-h-[500px] relative flex justify-center p-8 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:20px_20px]"
            >
              <div 
                style={{ 
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  width: '210mm',
                  minHeight: '297mm',
                  backgroundColor: 'white',
                  boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                  marginBottom: '100px',
                  position: 'relative',
                }}
                className="shrink-0 transition-transform duration-200 ease-out"
              >
                {/* Visual Page Break Indicators */}
                <div className="absolute top-[297mm] left-0 right-0 border-t-2 border-dashed border-indigo-200/50 z-10 pointer-events-none">
                  <span className="absolute right-0 -top-5 text-[10px] font-bold text-indigo-300 bg-white px-2 rounded-tl-md border-l border-t border-indigo-100">2. Sayfa Başlangıcı</span>
                </div>
                <div className="absolute top-[594mm] left-0 right-0 border-t-2 border-dashed border-indigo-200/50 z-10 pointer-events-none">
                  <span className="absolute right-0 -top-5 text-[10px] font-bold text-indigo-300 bg-white px-2 rounded-tl-md border-l border-t border-indigo-100">3. Sayfa Başlangıcı</span>
                </div>

                <iframe
                  id="cv-preview-iframe"
                  title="CV Preview"
                  className="w-full h-full border-0 origin-top-left"
                  style={{ 
                    width: `${100 / contentScale}%`,
                    height: `${100 / contentScale}%`,
                    transform: `scale(${contentScale})`,
                    minHeight: '1000mm', // Allow iframe to be long
                  }}
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <style>
                          body { margin: 0; padding: 0; background: white; }
                          /* Ensure no scrollbars inside iframe */
                          html, body { overflow: hidden; }
                        </style>
                      </head>
                      <body>
                        ${cvHtml || "<html><body style='font-family:sans-serif; text-align:center; padding-top:40px; color:#71717a;'><h3>CV içeriği boş.</h3></body></html>"}
                      </body>
                    </html>
                  `}
                />
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar Actions */}
        <div className="hidden md:flex flex-col gap-3 shrink-0 pt-7">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-14 h-14 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 font-bold rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shadow-sm active:scale-95 group"
            title="PDF İndir"
          >
            <FileText size={20} weight="bold" className="text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] uppercase tracking-tighter">İndir</span>
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="w-14 h-14 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 shadow active:scale-95 group"
            title="CV'yi Kaydet"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
            ) : (
              <>
                <div className="w-5 h-5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                </div>
                <span className="text-[8px] uppercase tracking-tighter">Kaydet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Actions */}
      <div className="grid grid-cols-2 gap-3 pt-2 md:hidden">
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="h-12 bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-sm active:scale-98"
        >
          <FileText size={18} weight="bold" className="text-indigo-600" />
          <span>PDF İndir</span>
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-sm shadow active:scale-98"
        >
          {loading ? "Kaydediliyor..." : "CV'yi Kaydet"}
        </button>
      </div>
    </div>
  );
}

// Bulk Import / Seeding Form
function BulkImportForm({ onComplete }: { onComplete: () => void }) {
  const { user } = useUser();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<apply_tracker.AppImportItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Parse text on change in real-time
  useEffect(() => {
    if (!text.trim()) {
      setParsed([]);
      return;
    }

    const lines = text.split("\n");
    const results: apply_tracker.AppImportItem[] = [];

    let currentCompany = "";
    let currentUrl = "";
    let currentPriority: apply_tracker.ApplicationPriority = "medium";
    let currentStatus: apply_tracker.ApplicationStatus = "to_apply";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith("Created At") || line.startsWith("Completed At") || line.startsWith("File Path")) {
        continue;
      }

      if (line === "Bakılacak") {
        currentStatus = "to_apply";
        continue;
      }
      if (line === "Yok" || line === "Uygun Değil Çok") {
        currentStatus = "withdrawn";
        continue;
      }

      if (line.startsWith("http://") || line.startsWith("https://")) {
        if (currentCompany) {
          if (!currentUrl) {
            currentUrl = line;
          } else {
            results.push({
              company_name: currentCompany,
              url: currentUrl,
              priority: currentPriority,
              status: currentStatus,
            });
            currentUrl = line;
          }
        } else {
          try {
            const host = new URL(line).hostname.replace("www.", "");
            const parts = host.split(".");
            currentCompany = parts[0].toUpperCase();
            currentUrl = line;
          } catch {
            currentCompany = "Bilinmeyen Şirket";
            currentUrl = line;
          }
        }
        continue;
      }

      if (currentCompany) {
        results.push({
          company_name: currentCompany,
          url: currentUrl || undefined,
          priority: currentPriority,
          status: currentStatus,
        });
        currentCompany = "";
        currentUrl = "";
        currentPriority = "medium";
      }

      let cleanedLine = line;
      let priority: apply_tracker.ApplicationPriority = "medium";

      if (line.startsWith("+")) {
        priority = "high";
        cleanedLine = line.substring(1).trim();
      } else if (line.startsWith("!")) {
        priority = "medium";
        cleanedLine = line.substring(1).trim();
      }

      currentCompany = cleanedLine;
      currentPriority = priority;
    }

    if (currentCompany) {
      results.push({
        company_name: currentCompany,
        url: currentUrl || undefined,
        priority: currentPriority,
        status: currentStatus,
      });
    }

    setParsed(results);
  }, [text]);

  const handleImport = async () => {
    if (!user) return;
    if (parsed.length === 0) {
      toast.error("İçe aktarılacak herhangi bir veri bulunamadı.");
      return;
    }

    try {
      setLoading(true);
      await client.apply_tracker.bulkImport({
        userId: user.id,
        applications: parsed,
      });
      toast.success(`${parsed.length} başvuru başarıyla içe aktarıldı!`);
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error("Toplu aktarma başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1.5 block">Metni Buraya Yapıştır</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Örn:&#10;+Ship or Die&#10;https://shipordie.club/&#10;! Ruby Labs&#10;https://jobs.ashbyhq.com/..."
          rows={8}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs focus:border-zinc-400 outline-none text-zinc-900 font-mono transition-all placeholder:text-zinc-400 resize-y"
        />
      </div>

      {parsed.length > 0 && (
        <div className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/50">
          <div className="px-4 py-2.5 bg-zinc-100 border-b border-zinc-200 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Ayrıştırılan Başvurular ({parsed.length})</span>
            <span className="text-[9px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded border border-indigo-100">Önizleme</span>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-zinc-200/80 pr-1 text-xs">
            {parsed.map((item, idx) => (
              <div key={idx} className="px-4 py-2.5 flex items-center justify-between gap-3 bg-white">
                <div className="min-w-0">
                  <div className="font-bold text-zinc-900 truncate flex items-center gap-1.5">
                    {item.priority === 'high' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                    {item.company_name}
                  </div>
                  {item.url && (
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5 font-mono">{item.url}</div>
                  )}
                </div>
                <span className="text-[10px] text-zinc-650 shrink-0 font-medium bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-md">
                  {STATUS_LABELS[item.status || 'to_apply']?.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={loading || parsed.length === 0}
        onClick={handleImport}
        className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl flex items-center justify-center transition-all disabled:opacity-50 text-sm shadow active:scale-98"
      >
        {loading ? "Aktarılıyor..." : `${parsed.length} Başvuruyu İçeri Aktar`}
      </button>
    </div>
  );
}
