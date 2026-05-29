"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Client, { Local } from "@/lib/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowLeft,
  ArrowUp,
  Sparkle,
  Plus,
  MagnifyingGlass,
  ThumbsUp,
  Copy,
  Check,
  ShareNetwork,
  Info,
  Calendar,
  User,
  Warning,
  X,
  PencilSimple,
  Trash
} from "@phosphor-icons/react";

const client = new Client(Local);

interface Meme {
  id: string;
  title: string;
  description: string;
  context: string;
  example: string;
  trend_status: string;
  media_url: string;
  tags: string[];
  likes_count: number;
  created_by: string;
  created_at: string;
}

// Smart parser for Giphy / Tenor / Custom media URLs
function getGiphyEmbedUrl(url: string) {
  if (!url) return "";
  
  // 1. If it's already an embed URL
  if (url.includes("/embed/")) return url;
  
  // 2. Giphy Media direct URLs (e.g., https://media.giphy.com/media/v1.Y2lk.../3o7TKoWXm3okO1kgdW/giphy.gif)
  let match = url.match(/media\.giphy\.com\/media\/(?:v1\.Y2lk[a-zA-Z0-9]+\/)?([a-zA-Z0-9]+)\//);
  if (match && match[1]) {
    return `https://giphy.com/embed/${match[1]}`;
  }
  
  // 3. Standard Giphy Web URLs (e.g., https://giphy.com/gifs/happy-3o7TKoWXm3okO1kgdW)
  match = url.match(/giphy\.com\/gifs\/(?:[a-zA-Z0-9-]+-)?([a-zA-Z0-9]{10,25})/);
  if (match && match[1]) {
    return `https://giphy.com/embed/${match[1]}`;
  }
  
  // 4. Tenor Embed / Web URL matching
  if (url.includes("tenor.com")) {
    // If it has embed in it or is a direct GIF link
    return url;
  }

  return url;
}

// Helper to check if URL should be rendered as iframe (embed) or img
function isEmbeddable(url: string) {
  return url.includes("giphy.com/embed") || url.includes("giphy.com/gifs") || url.includes("media.giphy.com") || url.includes("tenor.com/embed") || url.includes("tenor.com/view");
}

export default function MemedexPage() {
  const { locale } = useLanguage();
  
  // List State
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Scroll to Top State
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedTrend, setSelectedTrend] = useState("");

  // Detail Modal
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  // Submit Modal
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTrend, setNewTrend] = useState("Trending");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [variants, setVariants] = useState<Meme[]>([]);

  // Copy Feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editTrend, setEditTrend] = useState("Trending");
  const [editMediaUrl, setEditMediaUrl] = useState("");
  const [editError, setEditError] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Common tags for quick filter
  const popularTags = [
    { tr: "Mizah", en: "Humor" },
    { tr: "Yazılımcı", en: "Coding" },
    { tr: "Tepki", en: "Reaction" },
    { tr: "Ofis", en: "Office" },
    { tr: "İlişkiler", en: "Relatable" },
    { tr: "Sarkastik", en: "Sarcastic" }
  ];

  // Fetch memes from backend (initial load or filter reset)
  const fetchMemes = async () => {
    try {
      setLoading(true);
      setError(null);
      setPage(0);
      // @ts-ignore - type generated dynamically by Encore
      const response = await client.memedex.getMemes({
        search: search,
        tag: selectedTag,
        trend: selectedTrend,
        onlyParents: true,
        limit: 32,
        offset: 0
      });
      const fetched = response.memes || [];
      setMemes(fetched);
      setHasMore(fetched.length === 32);
    } catch (err: any) {
      console.error(err);
      setError(locale === "tr" ? "Meme'ler yüklenirken bir hata oluştu." : "Failed to load memes.");
    } finally {
      setLoading(false);
    }
  };

  // Load more memes for pagination
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextOffset = (page + 1) * 32;
      // @ts-ignore
      const response = await client.memedex.getMemes({
        search: search,
        tag: selectedTag,
        trend: selectedTrend,
        onlyParents: true,
        limit: 32,
        offset: nextOffset
      });
      const fetched = response.memes || [];
      setMemes(prev => [...prev, ...fetched]);
      setPage(prev => prev + 1);
      setHasMore(fetched.length === 32);
    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMemes();
  }, [search, selectedTag, selectedTrend]);

  useEffect(() => {
    if (selectedMeme) {
      setShowMoreDetails(false);
      const loadVariants = async () => {
        try {
          // @ts-ignore
          const response = await client.memedex.getMemes({
            parentId: selectedMeme.id,
            onlyParents: false
          });
          setVariants(response.memes || []);
        } catch (e) {
          console.error("Failed to load variants", e);
        }
      };
      loadVariants();
    } else {
      setVariants([]);
    }
  }, [selectedMeme]);

  // Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSubmitOpen(false);
        setIsEditOpen(false);
        setSelectedMeme(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Scroll to Top Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Prevent white background leakage on scroll by styling html/body
  useEffect(() => {
    document.documentElement.style.backgroundColor = "#020617";
    document.body.style.backgroundColor = "#020617";
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  // Handle Like/Upvote
  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      // @ts-ignore
      const response = await client.memedex.likeMeme({ id });
      
      // Update locally
      setMemes(prev => prev.map(m => m.id === id ? { ...m, likes_count: response.likesCount } : m));
      if (selectedMeme && selectedMeme.id === id) {
        setSelectedMeme(prev => prev ? { ...prev, likes_count: response.likesCount } : null);
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // Copy media link to clipboard
  const handleCopy = (e: React.MouseEvent, id: string, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit new meme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMediaUrl) {
      setSubmitError(locale === "tr" ? "Lütfen gerekli tüm alanları doldurun." : "Please fill out all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      // @ts-ignore
      await client.memedex.createMeme({
        title: newTitle,
        trendStatus: newTrend,
        mediaUrl: newMediaUrl,
        description: "",
        context: "",
        example: "",
        tags: [],
        createdBy: "Anonymous",
        parentId: newParentId || undefined
      });

      // Clear Form & Close
      setNewTitle("");
      setNewTrend("Trending");
      setNewMediaUrl("");
      setNewParentId("");
      setIsSubmitOpen(false);

      // Refresh listing
      fetchMemes();
    } catch (err: any) {
      console.error(err);
      setSubmitError(locale === "tr" ? "Gönderim sırasında hata oluştu: " + err.message : "Submission error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit meme
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editMediaUrl) {
      setEditError(locale === "tr" ? "Lütfen gerekli tüm alanları doldurun." : "Please fill out all required fields.");
      return;
    }

    try {
      setEditing(true);
      setEditError("");

      // @ts-ignore
      await client.memedex.updateMeme(editId, {
        title: editTitle,
        trendStatus: editTrend,
        mediaUrl: editMediaUrl,
      });

      setIsEditOpen(false);
      setSelectedMeme(null);
      fetchMemes();
    } catch (err: any) {
      console.error(err);
      setEditError(locale === "tr" ? "Güncelleme sırasında hata oluştu: " + err.message : "Update error: " + err.message);
    } finally {
      setEditing(false);
    }
  };

  // Delete meme
  const handleDeleteMeme = async (id: string) => {
    if (!confirm(locale === "tr" ? "Bu meme'i silmek istediğinize emin misiniz?" : "Are you sure you want to delete this meme?")) {
      return;
    }

    try {
      setDeleting(true);
      // @ts-ignore
      await client.memedex.deleteMeme(id);
      setSelectedMeme(null);
      fetchMemes();
    } catch (err: any) {
      console.error(err);
      alert(locale === "tr" ? "Silme işlemi başarısız oldu: " + err.message : "Delete failed: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getTrendBadgeStyle = (status: string) => {
    switch (status) {
      case "Trending":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "Classic":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
      default:
        return "bg-slate-700/40 text-slate-400 border-slate-700/60";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden pb-12">
      {/* Visual background details */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[35%] h-[35%] rounded-full bg-pink-600/10 blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="w-full border-b border-slate-900 bg-slate-950 sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto grid grid-cols-3 items-center">
          <div className="flex justify-start">
            <Link href="/home" className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer">
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">{locale === "tr" ? "Geri Dön" : "Back"}</span>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="p-1 bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 rounded-lg">
              <Sparkle size={16} className="animate-pulse" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              Memedex
            </h1>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setIsSubmitOpen(true)}
              className="fixed bottom-6 right-6 md:static z-40 md:z-auto p-4 md:px-3 md:py-1.5 rounded-full md:rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white shadow-2xl md:shadow-lg hover:shadow-fuchsia-950/70 hover:scale-[1.05] active:scale-[0.95] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-6 h-6 md:w-4 md:h-4" weight="bold" />
              <span className="hidden md:inline text-sm font-semibold">{locale === "tr" ? "Meme Ekle" : "Add Meme"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-6 py-8 flex-1 flex flex-col gap-6 z-10">
        

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={locale === "tr" ? "Meme ara (örn: Boyfriend, coding...)" : "Search memes..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/50 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition-all outline-none"
            />
          </div>

          {/* Trend filter */}
          <div className="md:col-span-3">
            <select
              value={selectedTrend}
              onChange={(e) => setSelectedTrend(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/50 rounded-2xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all cursor-pointer"
            >
              <option value="">{locale === "tr" ? "Tüm Akımlar" : "All Trends"}</option>
              <option value="Trending">{locale === "tr" ? "Trend Olanlar" : "Trending"}</option>
              <option value="Classic">{locale === "tr" ? "Klasikler" : "Classics"}</option>
              <option value="Dead">{locale === "tr" ? "Dead (Tedavülden Kalkanlar)" : "Dead Memes"}</option>
            </select>
          </div>

          {/* Quick Tag Selectors */}
          <div className="md:col-span-4 flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedTag("")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border cursor-pointer transition-all ${
                selectedTag === ""
                  ? "bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {locale === "tr" ? "Hepsi" : "All"}
            </button>
            {popularTags.map((tag) => {
              const tagValue = tag.en;
              const tagLabel = locale === "tr" ? tag.tr : tag.en;
              return (
                <button
                  key={tagValue}
                  onClick={() => setSelectedTag(tagValue)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border whitespace-nowrap cursor-pointer transition-all ${
                    selectedTag === tagValue
                      ? "bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  #{tagLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">{locale === "tr" ? "Yükleniyor..." : "Loading memes..."}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-400">
            <Warning size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && memes.length === 0 && (
          <div className="bg-slate-900/25 border border-slate-900/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
            <span className="text-4xl">👽</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-300">{locale === "tr" ? "Meme Bulunamadı" : "No Memes Found"}</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {locale === "tr" 
                  ? "Aradığınız kriterlere uygun meme bulunamadı. İlk ekleyen siz olabilirsiniz!" 
                  : "No memes matched your filters. Be the first to add one!"}
              </p>
            </div>
            <button
              onClick={() => setIsSubmitOpen(true)}
              className="mt-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-750 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              {locale === "tr" ? "Hemen Meme Ekle" : "Add a Meme Now"}
            </button>
          </div>
        )}

        {/* Meme Grid */}
        {!loading && memes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {memes.map((meme) => {
              const embedUrl = getGiphyEmbedUrl(meme.media_url);
              const isEmbed = isEmbeddable(embedUrl);

              return (
                <div
                  key={meme.id}
                  onClick={() => setSelectedMeme(meme)}
                  className="group bg-slate-900/30 hover:bg-slate-900/60 border border-slate-900 hover:border-purple-900/40 rounded-3xl overflow-hidden flex flex-col shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                >
                  {/* Media Wrapper */}
                  <div className="aspect-[4/3] bg-slate-950 border-b border-slate-900/60 relative overflow-hidden pointer-events-none">
                    {isEmbed ? (
                      <iframe
                        src={embedUrl}
                        width="100%"
                        height="100%"
                        className="absolute inset-0 w-full h-full border-none pointer-events-none"
                        allowFullScreen
                        loading="lazy"
                      />
                    ) : (
                      <img
                        src={meme.media_url}
                        alt={meme.title}
                        className="w-full h-full object-contain object-center"
                        loading="lazy"
                      />
                    )}
                    {/* Status badge */}
                    <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${getTrendBadgeStyle(meme.trend_status)}`}>
                      {meme.trend_status}
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-base text-slate-100 group-hover:text-fuchsia-400 transition-colors">
                        {meme.title}
                      </h3>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-900/40">
                      <div className="text-[11px] text-slate-500 font-medium">
                        {meme.trend_status}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Copy button */}
                        <button
                          onClick={(e) => handleCopy(e, meme.id, meme.media_url)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Copy template link"
                        >
                          {copiedId === meme.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                        
                        {/* Like button */}
                        <button
                          onClick={(e) => handleLike(e, meme.id)}
                          className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-850 text-slate-400 hover:text-slate-100 border border-transparent hover:border-slate-800 rounded-xl transition-all cursor-pointer"
                        >
                          <ThumbsUp size={13} className="text-pink-500" />
                          <span className="text-xs font-semibold">{meme.likes_count}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Pagination Button */}
        {!loading && memes.length > 0 && hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loadingMore ? (locale === "tr" ? "Yükleniyor..." : "Loading...") : (locale === "tr" ? "Daha Fazla Göster" : "Show More")}
            </button>
          </div>
        )}
      </main>

      {/* Meme Detail Modal */}
      {selectedMeme && (
        <div 
          onClick={() => setSelectedMeme(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col relative max-h-[90vh]"
          >
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedMeme(null)}
              className="absolute top-4 right-4 p-2 bg-slate-950/60 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-full z-10 transition-all cursor-pointer"
            >
              <X size={16} weight="bold" />
            </button>

            <div className="overflow-y-auto p-6 md:p-8 space-y-6">
              
              {/* Image / GIF viewer */}
              <div className="aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 shadow-inner">
                {isEmbeddable(getGiphyEmbedUrl(selectedMeme.media_url)) ? (
                  <iframe
                    src={getGiphyEmbedUrl(selectedMeme.media_url)}
                    width="100%"
                    height="100%"
                    className="absolute inset-0 w-full h-full border-none"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={selectedMeme.media_url}
                    alt={selectedMeme.title}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Meme details header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold text-slate-100">{selectedMeme.title}</h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTrendBadgeStyle(selectedMeme.trend_status)}`}>
                      {selectedMeme.trend_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User size={13} />
                      {selectedMeme.created_by}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {new Date(selectedMeme.created_at).toLocaleDateString()}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditId(selectedMeme.id);
                      setEditTitle(selectedMeme.title);
                      setEditTrend(selectedMeme.trend_status);
                      setEditMediaUrl(selectedMeme.media_url);
                      setIsEditOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-2xl text-xs font-semibold text-slate-350 hover:text-slate-100 transition-all cursor-pointer"
                  >
                    <PencilSimple size={14} />
                    <span>{locale === "tr" ? "Düzenle" : "Edit"}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteMeme(selectedMeme.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/30 rounded-2xl text-xs font-semibold text-rose-400 hover:text-rose-350 transition-all cursor-pointer"
                    disabled={deleting}
                  >
                    <Trash size={14} />
                    <span>{locale === "tr" ? "Sil" : "Delete"}</span>
                  </button>

                  <button
                    onClick={(e) => handleCopy(e, selectedMeme.id, selectedMeme.media_url)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-2xl text-xs font-semibold text-slate-300 hover:text-slate-100 transition-all cursor-pointer"
                  >
                    {copiedId === selectedMeme.id ? (
                      <>
                        <Check size={14} className="text-green-400" />
                        <span>{locale === "tr" ? "Kopyalandı!" : "Copied!"}</span>
                      </>
                    ) : (
                      <>
                        <ShareNetwork size={14} />
                        <span>{locale === "tr" ? "GIF Linki Kopyala" : "Copy GIF Link"}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={(e) => handleLike(e, selectedMeme.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-pink-950/20 hover:shadow-pink-950/40 transition-all cursor-pointer"
                  >
                    <ThumbsUp size={14} weight="fill" />
                    <span>{selectedMeme.likes_count}</span>
                  </button>
                </div>
              </div>

              {/* Show More Details Section */}
              <div className="border-t border-slate-800/60 pt-5">
                <button
                  onClick={() => setShowMoreDetails(!showMoreDetails)}
                  className="w-full flex items-center justify-between py-2 text-sm font-semibold text-fuchsia-400 hover:text-fuchsia-300 transition-colors cursor-pointer"
                >
                  <span>{showMoreDetails ? (locale === "tr" ? "Daha Az Göster" : "Show Less") : (locale === "tr" ? "Detayları Göster (Açıklama, Bağlam vb.)" : "Show More Details (Description, Context etc.)")}</span>
                  <span className="text-xs">{showMoreDetails ? "▲" : "▼"}</span>
                </button>

                {showMoreDetails && (
                  <div className="mt-4 space-y-4 bg-slate-950/40 border border-slate-850 p-5 rounded-2xl">
                    {/* Description */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {locale === "tr" ? "Açıklama" : "Description"}
                      </h4>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {selectedMeme.description || (locale === "tr" ? "Açıklama eklenmemiş." : "No description provided.")}
                      </p>
                    </div>

                    {/* Context */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {locale === "tr" ? "Kullanım Bağlamı" : "Context / Usage"}
                      </h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {selectedMeme.context || (locale === "tr" ? "Kullanım bağlamı eklenmemiş." : "No context provided.")}
                      </p>
                    </div>

                    {/* Example */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {locale === "tr" ? "Örnek Kullanım" : "Example"}
                      </h4>
                      <p className="text-sm text-slate-350 italic leading-relaxed">
                        {selectedMeme.example ? `"${selectedMeme.example}"` : (locale === "tr" ? "Örnek eklenmemiş." : "No example provided.")}
                      </p>
                    </div>

                    {/* Tags */}
                    {selectedMeme.tags && selectedMeme.tags.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/40">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {locale === "tr" ? "Etiketler" : "Tags"}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedMeme.tags.map((tag) => (
                            <span key={tag} className="text-[11px] bg-slate-900 px-2.5 py-1 border border-slate-800 text-slate-300 rounded-full font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Variants Section */}
              {variants.length > 0 && (
                <div className="border-t border-slate-800/60 pt-6 space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                    {locale === "tr" ? "Bu Meme'in Varyantları" : "Variants of this Meme"}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {variants.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => setSelectedMeme(v)}
                        className="bg-slate-950/65 border border-slate-850 hover:border-fuchsia-500/40 rounded-2xl p-3 flex flex-col gap-2 cursor-pointer transition-all duration-200"
                      >
                        <div className="aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden relative pointer-events-none">
                          {isEmbeddable(getGiphyEmbedUrl(v.media_url)) ? (
                            <iframe
                              src={getGiphyEmbedUrl(v.media_url)}
                              width="100%"
                              height="100%"
                              className="absolute inset-0 w-full h-full border-none pointer-events-none"
                              allowFullScreen
                            />
                          ) : (
                            <img
                              src={v.media_url}
                              alt={v.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span className="text-xs font-bold text-slate-200 truncate">{v.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Meme Submission Modal */}
      {isSubmitOpen && (
        <div 
          onClick={() => setIsSubmitOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col relative max-h-[95vh]"
          >
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkle size={18} className="text-fuchsia-400" />
                <span>{locale === "tr" ? "Yeni Meme Ekle" : "Add New Meme"}</span>
              </h2>
              <button
                onClick={() => setIsSubmitOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5 overflow-y-auto">
              
              {submitError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-2xl flex items-center gap-2">
                  <Warning size={16} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  {locale === "tr" ? "Meme Başlığı" : "Meme Title"}
                </label>
                <input
                  type="text"
                  placeholder={locale === "tr" ? "örn: Distracted Boyfriend" : "e.g. Distracted Boyfriend"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 rounded-2xl px-4.5 py-3 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all duration-200"
                  required
                />
              </div>

              {/* Media URL */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  {locale === "tr" ? "Giphy / Tenor / Resim Linki" : "Giphy / Tenor / Image Link"}
                </label>
                <input
                  type="url"
                  placeholder="https://giphy.com/gifs/..."
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 rounded-2xl px-4.5 py-3 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all duration-200"
                  required
                />
              </div>

              {/* Preview */}
              {newMediaUrl && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase block">
                    {locale === "tr" ? "Önizleme" : "Preview"}
                  </label>
                  <div className="w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center">
                    {isEmbeddable(getGiphyEmbedUrl(newMediaUrl)) ? (
                      <iframe
                        src={getGiphyEmbedUrl(newMediaUrl)}
                        width="100%"
                        height="100%"
                        className="absolute inset-0 w-full h-full border-none"
                        allowFullScreen
                      />
                    ) : (
                      <img
                        src={newMediaUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Trend Status */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  {locale === "tr" ? "Akım Durumu" : "Trend Status"}
                </label>
                <select
                  value={newTrend}
                  onChange={(e) => setNewTrend(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 rounded-2xl px-4.5 py-3 text-sm text-slate-200 outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="Trending">{locale === "tr" ? "Trend (Popüler)" : "Trending"}</option>
                  <option value="Classic">{locale === "tr" ? "Klasik" : "Classic"}</option>
                  <option value="Dead">{locale === "tr" ? "Dead (Eski/Unutulmuş)" : "Dead"}</option>
                </select>
              </div>



              {/* Parent Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  {locale === "tr" ? "Bu Başka Bir Meme'in Varyantı mı?" : "Is this a variant of another meme?"}
                </label>
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 rounded-2xl px-4.5 py-3 text-sm text-slate-200 outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="">{locale === "tr" ? "Hayır, Yeni Bir Ana Meme" : "No, this is a new main meme"}</option>
                  {memes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm transition-all duration-200 shadow-lg shadow-fuchsia-950/30 hover:scale-[1.01] active:scale-[0.99] mt-6 cursor-pointer"
              >
                {submitting ? (locale === "tr" ? "Ekleniyor..." : "Adding...") : (locale === "tr" ? "Meme Ekle" : "Add Meme")}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Meme Edit Modal */}
      {isEditOpen && (
        <div 
          onClick={() => setIsEditOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col relative max-h-[95vh]"
          >
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <PencilSimple size={18} className="text-fuchsia-400" />
                <span>{locale === "tr" ? "Meme Düzenle" : "Edit Meme"}</span>
              </h2>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-all cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 p-6 space-y-5 overflow-y-auto">
              
              {editError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-2xl flex items-center gap-2">
                  <Warning size={16} />
                  <span>{editError}</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  {locale === "tr" ? "Meme Başlığı" : "Meme Title"}
                </label>
                <input
                  type="text"
                  placeholder={locale === "tr" ? "örn: Distracted Boyfriend" : "e.g. Distracted Boyfriend"}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 rounded-2xl px-4.5 py-3 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all duration-200"
                  required
                />
              </div>

              {/* Media URL */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  {locale === "tr" ? "Giphy / Tenor / Resim Linki" : "Giphy / Tenor / Image Link"}
                </label>
                <input
                  type="url"
                  placeholder="https://giphy.com/gifs/..."
                  value={editMediaUrl}
                  onChange={(e) => setEditMediaUrl(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 rounded-2xl px-4.5 py-3 text-sm text-slate-100 placeholder-slate-650 outline-none transition-all duration-200"
                  required
                />
              </div>

              {/* Preview */}
              {editMediaUrl && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase block">
                    {locale === "tr" ? "Önizleme" : "Preview"}
                  </label>
                  <div className="w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center">
                    {isEmbeddable(getGiphyEmbedUrl(editMediaUrl)) ? (
                      <iframe
                        src={getGiphyEmbedUrl(editMediaUrl)}
                        width="100%"
                        height="100%"
                        className="absolute inset-0 w-full h-full border-none"
                        allowFullScreen
                      />
                    ) : (
                      <img
                        src={editMediaUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Trend Status */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  {locale === "tr" ? "Akım Durumu" : "Trend Status"}
                </label>
                <select
                  value={editTrend}
                  onChange={(e) => setEditTrend(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 rounded-2xl px-4.5 py-3 text-sm text-slate-200 outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="Trending">{locale === "tr" ? "Trend (Popüler)" : "Trending"}</option>
                  <option value="Classic">{locale === "tr" ? "Klasik" : "Classic"}</option>
                  <option value="Dead">{locale === "tr" ? "Dead (Eski/Unutulmuş)" : "Dead"}</option>
                </select>
              </div>



              {/* Submit Action */}
              <button
                type="submit"
                disabled={editing}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm transition-all duration-200 shadow-lg shadow-fuchsia-950/30 hover:scale-[1.01] active:scale-[0.99] mt-6 cursor-pointer"
              >
                {editing ? (locale === "tr" ? "Güncelleniyor..." : "Updating...") : (locale === "tr" ? "Kaydet" : "Save Changes")}
              </button>
            </form>
          </div>
        </div>
      )}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 md:bottom-6 right-6 p-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white rounded-full shadow-lg shadow-fuchsia-950/40 border border-fuchsia-500/20 hover:scale-110 active:scale-95 transition-all z-40 cursor-pointer"
          title="Scroll to Top"
        >
          <ArrowUp size={20} weight="bold" />
        </button>
      )}
    </div>
  );
}
