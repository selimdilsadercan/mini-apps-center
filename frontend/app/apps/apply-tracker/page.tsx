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
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban'); // Default to kanban for SSR/desktop initial state
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);
  const [selectedCvApp, setSelectedCvApp] = useState<apply_tracker.Application | null>(null);

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
        notes: target.notes || undefined
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
                                {app.cv_html && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCvApp(app)}
                                    className="text-indigo-650 hover:text-indigo-800 p-0.5 rounded transition-all bg-indigo-50 hover:bg-indigo-100/60"
                                    title="CV'yi Görüntüle"
                                  >
                                    <FileText size={12} weight="fill" />
                                  </button>
                                )}
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
                      {app.cv_html && (
                        <button
                          onClick={() => setSelectedCvApp(app)}
                          className="text-indigo-655 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-xl border border-transparent hover:border-indigo-100 transition-all active:scale-90"
                          title="CV'yi Görüntüle"
                        >
                          <FileText size={14} weight="fill" />
                        </button>
                      )}
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

      {/* CV Preview & Print Modal */}
      <AnimatePresence>
        {selectedCvApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-4xl bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-4 text-zinc-900 flex flex-col h-[90vh]"
            >
              <div className="flex justify-between items-center border-b border-zinc-150 pb-3 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <FileText size={20} className="text-indigo-650" weight="fill" />
                    <span>{selectedCvApp.company_name} - CV Önizleme</span>
                  </h3>
                  {selectedCvApp.role_title && (
                    <p className="text-xs text-zinc-500 mt-0.5">{selectedCvApp.role_title}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const iframe = document.getElementById('cv-preview-iframe') as HTMLIFrameElement;
                      if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                      }
                    }}
                    className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center gap-1.5 active:scale-95"
                  >
                    <Printer size={14} weight="bold" />
                    <span>Yazdır / PDF Kaydet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCvApp(null)}
                    className="h-9 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl transition-all border border-zinc-200 active:scale-95"
                  >
                    Kapat
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 bg-zinc-50 rounded-2xl p-2 border border-zinc-200 shadow-inner">
                <iframe
                  id="cv-preview-iframe"
                  title="CV Preview"
                  srcDoc={selectedCvApp.cv_html || "<html><body style='font-family:sans-serif; text-align:center; padding-top:40px; color:#71717a;'><h3>CV içeriği boş.</h3></body></html>"}
                  className="w-full h-full border-0 rounded-xl bg-white"
                />
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
  body { font-family: system-ui, -apple-system, sans-serif; color: #1f2937; line-height: 1.5; margin: 0; padding: 25px; background: #ffffff; }
  h1 { font-size: 24px; margin-bottom: 5px; color: #111827; font-weight: 800; text-align: center; }
  .subtitle { color: #4b5563; font-size: 13px; margin-bottom: 25px; text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; }
  .section { margin-bottom: 25px; }
  .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #4f46e5; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; letter-spacing: 0.05em; }
  .item { margin-bottom: 18px; }
  .item-header { font-weight: 700; font-size: 14px; display: flex; justify-content: space-between; color: #111827; }
  .item-sub { color: #6b7280; font-size: 12px; margin-top: 2px; display: flex; justify-content: space-between; }
  .item-desc { font-size: 13px; color: #374151; margin-top: 6px; padding-left: 10px; border-left: 2px solid #e5e7eb; }
</style>
</head>
<body>
  <h1>AD SOYAD</h1>
  <div class="subtitle">E-posta: email@example.com | Telefon: +90 555 555 5555 | GitHub: github.com/username</div>
  
  <div class="section">
    <div class="section-title">Deneyim</div>
    <div class="item">
      <div class="item-header"><span>Senior Frontend Developer</span> <span>2022 - Günümüz</span></div>
      <div class="item-sub"><span>Şirket Adı A.Ş.</span> <span>İstanbul, Türkiye</span></div>
      <div class="item-desc">Next.js, TypeScript ve modern CSS mimarileri ile yüksek performanslı web uygulamaları geliştirdim.</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Yetenekler</div>
    <div class="item" style="font-size: 13px; color: #374151;">
      <strong>Teknolojiler:</strong> JavaScript, TypeScript, React, Next.js, HTML5, CSS3, Tailwind CSS, PostgreSQL, Git
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
  const [activeTab, setActiveTab] = useState<'info' | 'cv'>('info');
  const [formData, setFormData] = useState({
    companyName: initialApp?.company_name || "",
    roleTitle: initialApp?.role_title || "",
    url: initialApp?.url || "",
    status: initialApp?.status || "to_apply" as apply_tracker.ApplicationStatus,
    priority: initialApp?.priority || "medium" as apply_tracker.ApplicationPriority,
    notes: initialApp?.notes || "",
    cvHtml: initialApp?.cv_html || "",
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
          cvHtml: formData.cvHtml.trim() || undefined,
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
          cvHtml: formData.cvHtml.trim() || undefined,
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

  const loadTemplate = () => {
    setFormData({ ...formData, cvHtml: DEFAULT_CV_TEMPLATE });
    toast.success("Hazır CV şablonu yüklendi.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-8">
      {/* Tabs Switcher */}
      <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 mb-2">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'info' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
        >
          Genel Bilgiler
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cv')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'cv' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800'}`}
        >
          HTML CV / Özgeçmiş
        </button>
      </div>

      {activeTab === 'info' ? (
        <>
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
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">HTML CV Kodu</label>
            <button
              type="button"
              onClick={loadTemplate}
              className="text-[10px] text-indigo-600 hover:text-indigo-850 font-bold bg-indigo-50 border border-indigo-100 rounded px-2.5 py-1 transition-all active:scale-95"
            >
              Hazır Şablon Yükle
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 leading-normal">
            Bu işe özel hazırladığınız CV'nizin HTML/CSS kodlarını buraya yapıştırabilirsiniz. Daha sonra doğrudan yazdırabilir veya PDF olarak kaydedebilirsiniz.
          </p>
          <textarea
            value={formData.cvHtml}
            onChange={(e) => setFormData({ ...formData, cvHtml: e.target.value })}
            placeholder="<html>&#10;  <head><style>...</style></head>&#10;  <body>...</body>&#10;</html>"
            rows={12}
            className="w-full bg-zinc-900 text-zinc-100 font-mono rounded-xl px-4 py-3 text-xs focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 outline-none transition-all placeholder:text-zinc-650 resize-none"
          />
        </div>
      )}

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
